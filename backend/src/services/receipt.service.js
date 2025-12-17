import PDFDocument from 'pdfkit';

export const generateReceiptPDF = (data, res) => {
    const doc = new PDFDocument({ size: 'A5', margin: 30 }); // A5 is better for receipts

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Boleta_${data.clientDni}_${data.month}.pdf`);

    doc.pipe(res);

    // Header
    doc.fontSize(18).text('MIRAMAX', { align: 'center' });
    doc.fontSize(10).text('Telecomunicaciones', { align: 'center' });
    doc.moveDown();
    doc.text('RUC: 10407658864', { align: 'center' });
    doc.text('Dirección: Centro Poblado Lluin - Mache', { align: 'center' });
    doc.moveDown();

    doc.fontSize(14).text('CONSTANCIA DE PAGO', { align: 'center', underline: true });
    doc.moveDown();

    // Box
    const startY = doc.y;
    doc.fontSize(10);

    // Details
    const leftCol = 50;
    const rightCol = 150;
    const rowHeight = 20;
    let currentY = startY;

    doc.text('Cliente:', leftCol, currentY);
    doc.text(data.clientName, rightCol, currentY);
    currentY += rowHeight;

    doc.text('DNI:', leftCol, currentY);
    doc.text(data.clientDni, rightCol, currentY);
    currentY += rowHeight;

    doc.text('Periodo:', leftCol, currentY);
    doc.text(`${data.month} ${data.year}`, rightCol, currentY);
    currentY += rowHeight;

    doc.text('Fecha de Pago:', leftCol, currentY);
    doc.text(new Date().toLocaleDateString('es-PE'), rightCol, currentY);
    currentY += rowHeight;

    doc.text('Metodo:', leftCol, currentY);
    doc.text('Yape / Plin', rightCol, currentY);
    currentY += rowHeight + 10;

    // Total
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('TOTAL PAGADO:', leftCol, currentY);
    doc.text(`S/ ${parseFloat(data.amount).toFixed(2)}`, rightCol, currentY);

    // Status
    currentY += rowHeight + 10;
    doc.fillColor('green');
    doc.text('PAGADO', { align: 'center' });
    doc.fillColor('black');

    // Footer
    doc.moveDown(4);
    doc.fontSize(8).font('Helvetica');
    doc.text('Este documento es un comprobante de pago electrónico generado automáticamente.', { align: 'center' });
    doc.text('Gracias por su preferencia.', { align: 'center' });

    doc.end();
};
