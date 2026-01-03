import Groq from 'groq-sdk';
import { query } from '../config/database.js';

const getGroqClient = () => {
    if (!process.env.GROQ_API_KEY) {
        console.warn("⚠️ GROQ_API_KEY missing. AI features will not work.");
        return null;
    }
    return new Groq({ apiKey: process.env.GROQ_API_KEY });
};

const groq = getGroqClient();

// Get relevant context for the collector or admin
const getCollectorContext = async (userId, role) => {
    let collector = null;
    let stats = { today_total: 0, visited_count: 0 };
    let clients = [];

    if (role === 'admin') {
        // --- CONTEXTO DE ADMINISTRADOR (Global) ---
        collector = { full_name: 'Administrador Principal' };

        // 1. Estadísticas Globales de Hoy
        const statsRes = await query(`
            SELECT 
                COALESCE(SUM(amount), 0) as today_total,
                COUNT(DISTINCT client_id) as visited_count
            FROM payments 
            WHERE DATE(payment_date) = CURDATE()
        `);
        stats = statsRes.rows[0];

        // 2. Top Deudores Globales (Pendientes)
        const debtorsRes = await query(`
            SELECT c.full_name, c.dni, c.zone, c.address, SUM(d.amount) as total_debt 
            FROM clients c
            JOIN debts d ON c.id = d.client_id
            WHERE d.status = 'pending'
            GROUP BY c.id
            ORDER BY total_debt DESC
            LIMIT 50
        `);
        clients = debtorsRes.rows;

    } else {
        // --- CONTEXTO DE COBRADOR (Específico) ---
        // 1. Get collector info
        const collectorRes = await query('SELECT * FROM collectors WHERE id = ?', [userId]);
        collector = collectorRes.rows[0];

        // 2. Get today's stats
        const statsRes = await query(`
            SELECT 
                COALESCE(SUM(amount), 0) as today_total,
                COUNT(DISTINCT client_id) as visited_count
            FROM payments 
            WHERE collector_id = ? AND DATE(payment_date) = CURDATE()
        `, [userId]);
        stats = statsRes.rows[0];

        // 3. Get clients with debts
        const debtorsRes = await query(`
            SELECT c.full_name, c.dni, c.zone, c.address, SUM(d.amount) as total_debt 
            FROM clients c
            JOIN debts d ON c.id = d.client_id
            WHERE c.collector_id = ? AND d.status = 'pending'
            GROUP BY c.id
            ORDER BY total_debt DESC
            LIMIT 30
        `, [userId]);
        clients = debtorsRes.rows;
    }

    return {
        collector: collector,
        stats: stats,
        clients_with_debt: clients
    };
};

export const processCollectorQuery = async (userId, userQuery, role) => {
    try {
        const contextData = await getCollectorContext(userId, role);

        const systemPrompt = `
You are a specialized AI Voice Assistant for "${contextData.collector?.full_name || 'Cobrador'}" (${role === 'admin' ? 'Administrator' : 'Collector'}).
Your goal is to assist in daily collection management efficiently and hands-free.

**Current Context:**
- Time: ${new Date().toLocaleString()}
- Collected Today (Total): S/ ${contextData.stats.today_total}
- Clients Visited Today: ${contextData.stats.visited_count}

**Top Debtors List (${role === 'admin' ? 'Global Top 50' : 'Your Top 30'}):**
${JSON.stringify(contextData.clients_with_debt, null, 2)}

**Instructions:**
1. **Role**: You are a helpful, friendly, and detailed assistant. Speak naturally like a co-worker.
2. **Knowledge**: You ONLY know about the data provided above.
3. **Voice-First**: Use complete sentences and be descriptive. Avoid being too robotic or brief.
4. **Currency**: CRITICAL: ALWAYS use "S/" for money (Soles). NEVER use the "$" symbol. Correct: "S/ 80.00". Incorrect: "$80.00".
5. **Safety**: Do NOT hallucinate payments. Only report what is in the "Top Debtors List".
6. **Output**: Return a JSON object with:
   - "text": The spoken response text.
   - "action": Optional action for the UI (e.g., "show_map", "open_modal").

User Query: "${userQuery}"
        `;

        if (!groq) {
            throw new Error("Groq API Key no configurada.");
        }

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userQuery }
            ],
            model: 'llama-3.1-8b-instant', // Focused on speed and reliability for mobile use
            temperature: 0.5,
            max_tokens: 500,
            response_format: { type: 'json_object' }
        });

        return JSON.parse(chatCompletion.choices[0].message.content);

    } catch (error) {
        console.error('Groq AI Error:', error);
        return {
            text: "Lo siento, hubo un error procesando tu consulta. Por favor intenta de nuevo.",
            error: true
        };
    }
};

/**
 * Analiza columnas de Excel con IA
 */
export const analyzeExcelColumns = async (columns, sampleRows) => {
    try {
        if (!groq) {
            return {
                success: false,
                error: 'GROQ_API_KEY not configured',
                mapping: createDefaultMapping(columns)
            };
        }

        const prompt = `Analiza este Excel y mapea las columnas:
Columnas: ${columns.join(', ')}
Ejemplo: ${JSON.stringify(sampleRows[0], null, 2)}

Responde SOLO con JSON válido (sin markdown):
{"DNI":"columna","Nombres":"columna","Telefono":"columna","Direccion":"columna","Provincia":"columna","Distrito":"columna","Caserio":"columna","Zona":"columna","Sector":"columna","Plan":"columna","Costo":"columna"}

Si no existe, pon null. Acepta variaciones.`;

        console.log('🤖 Sending to Groq with model llama-3.1-8b-instant...');
        const response = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.1-8b-instant',
            temperature: 0.1,
            max_tokens: 500,
            response_format: { type: 'json_object' }
        });

        const content = response.choices[0]?.message?.content || '{}';
        console.log('🤖 Groq response received:', content);
        const mapping = JSON.parse(content);

        return { success: true, mapping };
    } catch (error) {
        console.error('Error analyzing Excel:', error);
        return {
            success: false,
            error: error.message,
            mapping: createDefaultMapping(columns)
        };
    }
};

function createDefaultMapping(columns) {
    const mapping = {};
    const fields = ['DNI', 'Nombres', 'Telefono', 'Direccion', 'Provincia', 'Distrito', 'Caserio', 'Zona', 'Sector', 'Plan', 'Costo'];

    for (const field of fields) {
        const found = columns.find(col =>
            col.toLowerCase().includes(field.toLowerCase()) ||
            field.toLowerCase().includes(col.toLowerCase())
        );
        mapping[field] = found || null;
    }

    return mapping;
}
