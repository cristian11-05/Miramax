import { query } from '../config/database.js';
import xlsx from 'xlsx';

/**
 * Bulk Import Clients from Excel
 * Expected columns: DNI, Nombres, Direccion, Telefono, Zona, Sector, Plan, Costo
 */
export const importClients = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se subió ningún archivo.' });
        }

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
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
                const address = row.Direccion ? String(row.Direccion).trim() : '';
                const phone = row.Telefono ? String(row.Telefono).trim() : '';
                const zone = row.Zona ? String(row.Zona).trim() : 'Sin Zona';
                const sector = row.Sector ? String(row.Sector).trim() : '';
                const plan = row.Plan ? String(row.Plan).trim() : 'Básico';
                const cost = parseFloat(row.Costo) || 0;

                // Check if client exists
                const [existing] = await connection.query('SELECT id FROM clients WHERE dni = ?', [dni]);

                if (existing.length > 0) {
                    // Update
                    await connection.query(`
                        UPDATE clients SET 
                            full_name = ?, address = ?, phone = ?, zone = ?, sector = ?, internet_plan = ?, installation_cost = ?
                        WHERE id = ?
                    `, [fullName, address, phone, zone, sector, plan, cost, existing[0].id]);
                    summary.updated++;
                } else {
                    // Insert
                    await connection.query(`
                        INSERT INTO clients (dni, full_name, address, phone, zone, sector, internet_plan, installation_cost, status)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
                    `, [dni, fullName, address, phone, zone, sector, plan, cost]);
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
