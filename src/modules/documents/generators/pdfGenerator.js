import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export const generatePDF = async (data, outputPath) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(outputPath);

    doc.pipe(stream);
    doc.fontSize(20).text('PM_TTHC2 - Administrative Document', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12);

    Object.entries(data).forEach(([key, value]) => {
      doc.text(`${key}: ${value}`);
    });

    doc.end();
    stream.on('finish', () => resolve(outputPath));
    stream.on('error', reject);
  });
};

export const getTemplatePath = (templateName) =>
  path.join(process.cwd(), 'templates', 'pdf', templateName);
