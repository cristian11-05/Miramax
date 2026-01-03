import { query } from '../config/database.js';
import xlsx from 'xlsx';

/**
 * Bulk Import Clients from Excel
 * Expected columns: DNI, Nombres, Direccion, Telefono, Provincia, Distrito, Caserio, Sector, Plan, Costo
 */
export const importClients = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se subió ningún archivo.' });
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
            for (const [index, row] of data.entries()) {
                const rowNum = index + 2; // Excel row number

                // Validate required fields
                if (!row.DNI || !row.Nombres) {
                    summary.errors.push(`Fila ${rowNum}: Faltan datos obligatorios (DNI, Nombres)`);
                    continue;
                }

                // Normalizar datos
                const dni = String(row.DNI).trim();
                const fullName = String(row.Nombres).trim();
                const phone = row.Telefono ? String(row.Telefono).trim() : '';
                const address = row.Direccion ? String(row.Direccion).trim() : '';

                // Ubicación geográfica
                const region = row.Region || 'La Libertad';
                const province = row.Provincia || 'Otuzco';
                const district = row.Distrito || '';
                const caserio = row.Caserio || '';
                const sector = row.Sector ? String(row.Sector).trim() : '';
                const zone = row.Zona || caserio || district; // Backwards compatibility

                // Plan y costos
                const plan = row.Plan ? String(row.Plan).trim() : 'Plan Básico';
                const cost = parseFloat(row.Costo) || 50;
                const planType = 'INTERNET'; // Por defecto

                // ========== AUTO-ASIGNACIÓN DE COBRADOR ==========
                let autoCollectorId = null;

                if (caserio && district) {
                    // Nivel 1: Buscar por caserío específico
                    const [caserioResult] = await connection.query(`
                        SELECT DISTINCT collector_id 
                        FROM clients
                        WHERE caserio = ? AND district = ? AND collector_id IS NOT NULL
                        LIMIT 1
                    `, [caserio, district]);
                    if (caserioResult.length > 0) {
                        autoCollectorId = caserioResult[0].collector_id;
                    }
                }

                if (!autoCollectorId && district) {
                    // Nivel 2: Buscar por distrito
                    const [districtResult] = await connection.query(`
                        SELECT DISTINCT collector_id 
                        FROM clients
                        WHERE district = ? AND collector_id IS NOT NULL
                        LIMIT 1
                    `, [district]);
                    if (districtResult.length > 0) {
                        autoCollectorId = districtResult[0].collector_id;
                    }
                }

                if (!autoCollectorId && province) {
                    // Nivel 3: Buscar por provincia
                    const [provinceResult] = await connection.query(`
                        SELECT DISTINCT collector_id 
                        FROM clients
                        WHERE province = ? AND collector_id IS NOT NULL
                        LIMIT 1
                    `, [province]);
                    if (provinceResult.length > 0) {
                        autoCollectorId = provinceResult[0].collector_id;
                    }
                }

                // Check if client exists
                const [existing] = await connection.query('SELECT id FROM clients WHERE dni = ?', [dni]);

                if (existing.length > 0) {
                    // Update
                    await connection.query(`
                        UPDATE clients SET 
                            full_name = ?, phone = ?, address = ?,
                            region = ?, province = ?, district = ?, caserio = ?, zone = ?, sector = ?,
                            plan = ?, plan_type = ?, cost = ?,
                            collector_id = ?
                        WHERE id = ?
                    `, [fullName, phone, address, region, province, district, caserio, zone, sector,
                        plan, planType, cost, autoCollectorId, existing[0].id]);
                    summary.updated++;
                } else {
                    // Insert new client
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
        console.error('Error importing clients:', error);
        res.status(500).json({ error: 'Error al procesar el archivo de clientes.' });
    }
};
