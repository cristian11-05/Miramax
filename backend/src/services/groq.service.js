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

// Get relevant context for the collector
const getCollectorContext = async (collectorId) => {
    // 1. Get collector info
    const collectorRes = await query('SELECT * FROM collectors WHERE id = ?', [collectorId]);
    const collector = collectorRes.rows[0];

    // 2. Get today's stats
    const statsRes = await query(`
        SELECT 
            COALESCE(SUM(amount), 0) as today_total,
            COUNT(DISTINCT client_id) as visited_count
        FROM payments 
        WHERE collector_id = ? AND DATE(payment_date) = CURDATE()
    `, [collectorId]);

    // 3. Get clients with debts (Limit to top 50 to save context window for MVP)
    // In production, we'd use RAG or a more specific query based on user intent.
    const debtorsRes = await query(`
        SELECT c.full_name, c.dni, c.zone, c.address, SUM(d.amount) as total_debt 
        FROM clients c
        JOIN debts d ON c.id = d.client_id
        WHERE c.collector_id = ? AND d.status = 'pending'
        GROUP BY c.id
        ORDER BY total_debt DESC
        LIMIT 30
    `, [collectorId]);

    return {
        collector: collector,
        stats: statsRes.rows[0],
        clients_with_debt: debtorsRes.rows
    };
};

export const processCollectorQuery = async (collectorId, userQuery) => {
    try {
        const contextData = await getCollectorContext(collectorId);

        const systemPrompt = `
You are a specialized AI Voice Assistant for a Debt Collector named "${contextData.collector?.full_name || 'Cobrador'}".
Your goal is to assist the collector in their daily field work efficiently and hands-free.

**Current Context:**
- Time: ${new Date().toLocaleString()}
- Collected Today: S/ ${contextData.stats.today_total}
- Clients Visited: ${contextData.stats.visited_count}

**Top Debtors List (Top 30):**
${JSON.stringify(contextData.clients_with_debt, null, 2)}

**Instructions:**
1. **Role**: You are helpful, concise, and professional. You are speaking to the collector.
2. **Knowledge**: You ONLY know about the data provided above. If asked about something not in the list, explaining that you only check the top 30 debtors or ask for a specific name to search (though currently you can't search dynamically in this MVP).
3. **Voice-First**: Keep answers short and speakable. Avoid long tables unless asked. Use natural language.
4. **Safety**: Do NOT hallucinate payments. Only report what is in the "Top Debtors List".
5. **Output**: Return a JSON object with:
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
