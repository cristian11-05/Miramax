import { query } from '../config/database.js';
import xlsx from 'xlsx';
import { analyzeExcelColumns } from '../services/groq.service.js';

/**
 * Previsualizar importación de clientes con análisis IA
 */
export const previewImportClients = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se subió ningún archivo.' });
        }

        let workbook;
        console.log('📂 File received:', req.file.path || 'buffer');
        try {
            if (req.file.buffer) {
                workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
            } else if (req.file.path) {
                workbook = xlsx.readFile(req.file.path);
            } else {
                console.error('❌ No buffer or path in req.file');
                return res.status(400).json({ error: 'No se pudo leer el archivo.' });
            }
        } catch (readErr) {
            console.error('❌ Error reading file with xlsx:', readErr);
            throw readErr;
        }

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);
        console.log(`📊 Data parsed: ${data.length} rows`);

        if (data.length === 0) {
            console.warn('⚠️ File is empty');
            return res.status(400).json({ error: 'El archivo Excel está vacío.' });
        }

        // Obtener columnas del Excel
        const columns = Object.keys(data[0]);
        console.log('🔎 Columns found:', columns);

        // Usar IA para mapear columnas automáticamente
        console.log('🤖 Analyzing columns with AI...');
        const aiAnalysis = await analyzeExcelColumns(columns, data.slice(0, 3));

        if (!aiAnalysis.success) {
            console.error('❌ AI Analysis failed:', aiAnalysis.error);
            return res.status(500).json({
                error: 'No se pudo analizar el archivo con IA.',
                details: aiAnalysis.error
            });
        }
        console.log('✅ AI Analysis success:', aiAnalysis.mapping);

        const mapping = aiAnalysis.mapping;

        // Generar resumen de lo que se importará
        const summary = {
            totalRows: data.length,
            detectedColumns: mapping,
            preview: data.slice(0, 5).map(row => ({
                dni: row[mapping.DNI] || '',
                nombres: row[mapping.Nombres] || '',
                telefono: row[mapping.Telefono] || '',
                distrito: row[mapping.Distrito] || '',
                caserio: row[mapping.Caserio] || '',
                plan: row[mapping.Plan] || '',
                costo: row[mapping.Costo] || ''
            })),
            warnings: []
        };

        // Validar que al menos tengamos DNI y Nombres
        if (!mapping.DNI || !mapping.Nombres) {
            summary.warnings.push('⚠️ No se detectaron las columnas obligatorias: DNI y Nombres');
        }

        // Contar cuántos tendrán auto-asignación de cobrador
        let withCollector = 0;
        for (const row of data) {
            if (row[mapping.Distrito] && row[mapping.Caserio]) {
                withCollector++;
            }
        }

        summary.stats = {
            withLocation: withCollector,
            withoutLocation: data.length - withCollector,
            estimatedNewClients: data.length, // Se calculará consultando BD
            estimatedUpdates: 0
        };

        res.json({ success: true, summary, mapping });

    } catch (error) {
        console.error('Error previewing import:', error);
        res.status(500).json({
            error: 'Error al analizar el archivo.',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

/**
 * Importar clientes confirmados (después del preview)
 */
export const confirmImportClients = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se subió ningún archivo.' });
        }

        const { mapping } = req.body; // Mapping confirmado por el usuario

        if (!mapping) {
            return res.status(400).json({ error: 'Falta el mapping de columnas.' });
        }

        let workbook;
        if (req.file.buffer) {
            workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        } else if (req.file.path) {
            workbook = xlsx.readFile(req.file.path);
        } else {
            return res.status(400).json({ error: 'No se pudo leer el archivo.' });
        }

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        const summary = {
            total: data.length,
            imported: 0,
            updated: 0,
            errors: []
        };

        const connection = await import('../config/database.js').then(m => m.getClient());
        await connection.beginTransaction();

        try {
            const mappingObj = typeof mapping === 'string' ? JSON.parse(mapping) : mapping;

            for (const [index, row] of data.entries()) {
                const rowNum = index + 2;

                // Extraer datos usando el mapping
                const dni = row[mappingObj.DNI] ? String(row[mappingObj.DNI]).trim() : '';
                const fullName = row[mappingObj.Nombres] ? String(row[mappingObj.Nombres]).trim() : '';

                if (!dni || !fullName) {
                    summary.errors.push(`Fila ${rowNum}: Faltan DNI o Nombres`);
                    continue;
                }

                const phone = row[mappingObj.Telefono] ? String(row[mappingObj.Telefono]).trim() : '';
                const address = row[mappingObj.Direccion] ? String(row[mappingObj.Direccion]).trim() : '';
                const region = row[mappingObj.Region] || 'La Libertad';
                const province = row[mappingObj.Provincia] || 'Otuzco';
                const district = row[mappingObj.Distrito] || '';
                const caserio = row[mappingObj.Caserio] || '';
                const sector = row[mappingObj.Sector] || '';
                const zone = row[mappingObj.Zona] || caserio || district;
                const plan = row[mappingObj.Plan] || 'Plan Básico';
                const cost = parseFloat(row[mappingObj.Costo]) || 50;
                const planType = 'INTERNET';

                // Auto-asignación de cobrador (mismo código que antes)
                let autoCollectorId = null;

                if (caserio && district) {
                    const [caserioResult] = await connection.query(`
                        SELECT DISTINCT collector_id FROM clients
                        WHERE caserio = ? AND district = ? AND collector_id IS NOT NULL LIMIT 1
                    `, [caserio, district]);
                    if (caserioResult.length > 0) autoCollectorId = caserioResult[0].collector_id;
                }

                if (!autoCollectorId && district) {
                    const [districtResult] = await connection.query(`
                        SELECT DISTINCT collector_id FROM clients
                        WHERE district = ? AND collector_id IS NOT NULL LIMIT 1
                    `, [district]);
                    if (districtResult.length > 0) autoCollectorId = districtResult[0].collector_id;
                }

                if (!autoCollectorId && province) {
                    const [provinceResult] = await connection.query(`
                        SELECT DISTINCT collector_id FROM clients
                        WHERE province = ? AND collector_id IS NOT NULL LIMIT 1
                    `, [province]);
                    if (provinceResult.length > 0) autoCollectorId = provinceResult[0].collector_id;
                }

                const [existing] = await connection.query('SELECT id FROM clients WHERE dni = ?', [dni]);

                if (existing.length > 0) {
                    await connection.query(`
                        UPDATE clients SET 
                            full_name = ?, phone = ?, address = ?,
                            region = ?, province = ?, district = ?, caserio = ?, zone = ?, sector = ?,
                            plan = ?, plan_type = ?, cost = ?, collector_id = ?
                        WHERE id = ?
                    `, [fullName, phone, address, region, province, district, caserio, zone, sector,
                        plan, planType, cost, autoCollectorId, existing[0].id]);
                    summary.updated++;
                } else {
                    await connection.query(`
                        INSERT INTO clients (
                            dni, full_name, phone, address,
                            region, province, district, caserio, zone, sector,
                            plan_type, plan, cost, collector_id, service_status
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
                    `, [dni, fullName, phone, address, region, province, district, caserio, zone, sector,
                        planType, plan, cost, autoCollectorId]);
                    summary.imported++;
                }
            }

            await connection.commit();
            res.json({ success: true, summary });

        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Error confirming import:', error);
        res.status(500).json({ error: 'Error al importar clientes.' });
    }
};
