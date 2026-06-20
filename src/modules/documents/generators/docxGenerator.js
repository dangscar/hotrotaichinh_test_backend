import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import fs from 'fs/promises';
import path from 'path';

export const generateDOCX = async (templateName, data, outputPath) => {
  const templatePath = path.join(process.cwd(), 'templates', 'docx', templateName);
  const content = await fs.readFile(templatePath, 'binary');
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

  doc.render(data);
  const buffer = doc.getZip().generate({ type: 'nodebuffer' });
  await fs.writeFile(outputPath, buffer);
  return outputPath;
};
