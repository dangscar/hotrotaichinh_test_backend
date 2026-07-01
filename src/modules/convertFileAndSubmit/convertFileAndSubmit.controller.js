import fs from "fs";
import path from "path";
// import libre from "libreoffice-convert";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import ImageModule from "docxtemplater-image-module-free";
import GeneratedFile from "./GeneratedFile.model.js";
import axios from "axios";

// async function convertDocxToPdf(buffer) {
//     return new Promise((resolve, reject) => {
//         libre.convert(buffer, ".pdf", undefined, (err, done) => {
//             if (err) return reject(err);
//             resolve(done);
//         });
//     });
// }

class ConvertFileAndSubmitController {

    // async generateDoc(templatePath, outputFileName, data, format = "docx") {
    //     const content = fs.readFileSync(templatePath, "binary");
    //     const zip = new PizZip(content);

    //     const imageModule = new ImageModule({
    //         centered: false,
    //         getImage(tagValue) {
    //             return fs.readFileSync(tagValue);
    //         },
    //         getSize() {
    //             return [120, 80];
    //         }
    //     });

    //     const doc = new Docxtemplater(zip, {
    //         paragraphLoop: true,
    //         linebreaks: true,
    //         modules: [imageModule]
    //     });

    //     doc.render(data);

    //     const buffer = doc.getZip().generate({
    //         type: "nodebuffer",
    //         compression: "DEFLATE",
    //     });

    //     // if (format === "pdf") {
    //     //     const pdfBuffer = await convertDocxToPdf(buffer);

    //     //     await this.saveGeneratedFile(
    //     //         pdfBuffer,
    //     //         outputFileName.replace(".docx", ".pdf"),
    //     //         data.tenDon || outputFileName.replace(".docx", ".pdf"),
    //     //         data.HO_TEN || data.tenNguoiGui || "Người gửi không tên"
    //     //     );

    //     //     return {
    //     //         success: true,
    //     //         message: "Lưu file PDF thành công"
    //     //     };
    //     // }

    //     // await this.saveGeneratedFile(
    //     //     buffer,
    //     //     outputFileName,
    //     //     data.tenDon || outputFileName,
    //     //     data.HO_TEN || data.tenNguoiGui || "Người gửi không tên"
    //     // );

    //     return {
    //         success: true,
    //         message: "Lưu file DOCX thành công"
    //     };
    // }

    generateFile = async (req, res, next) => {
        try {
            const generatedFile = await GeneratedFile.create({
                tenDon: "Đơn xin cấp lại thẻ sinh viên",
                tenNguoiGui: "Nguyễn Văn A",
                duongDanFile: "https://res.cloudinary.com/duss4h6vi/raw/upload/v1782895929/word-templates/don_cap_lai_the_sinh_vien2-1782895933436",
                trangThai: "cho_duyet",
            });

            return res.json({
                success: true,
                data: generatedFile,
            });

            // const format = req.query.format || "docx";
            // const templateFile = req.body.templateFile;
            // const filePath = req.file?.path;

            // const data = {
            //     ...req.body,
            //     ANH_THE: filePath
            // };

            // const result = await this.generateDoc(
            //     templateFile,
            //     req.query.fileName || "output.docx",
            //     data,
            //     format
            // );

            // if (filePath) {
            //     fs.unlink(filePath, () => {});
            // }

            // return res.status(200).json(result);

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: err.message,
            });
            // if (req.file?.path) {
            //     fs.unlink(req.file.path, () => { });
            // }
            // next(error);
        }
    }
    //Lưu file vào thư mục generated-files và thêm vào database
    // async saveGeneratedFile(buffer, outputFileName, tenDon, tenNguoiGui) {
    //     const saveDir = path.join(import.meta.dirname, "../../generated-files");

    //     if (!fs.existsSync(saveDir)) {
    //         fs.mkdirSync(saveDir, { recursive: true });
    //     }

    //     const fileName = Date.now() + "_" + outputFileName;
    //     const filePath = path.join(saveDir, fileName);

    //     fs.writeFileSync(filePath, buffer);

    //     await GeneratedFile.create({
    //         tenDon,
    //         tenNguoiGui,
    //         duongDanFile: filePath,
    //         trangThai: "cho_duyet"
    //     });

    //     return filePath;
    // }

    previewFile = async (req, res, next) => {

        try {
            const { url, ...fields } = req.body;

            if (!url) {
                return res.status(400).json({ message: "Missing template URL" });
            }

            // 1. download docx từ URL
            const response = await axios.get(url, {
                responseType: "arraybuffer",
            });

            const content = Buffer.from(response.data);

            const zip = new PizZip(content);

            // 2. image module (giữ nguyên nếu bạn có ảnh)
            const imageModule = new ImageModule({
                getImage(tagValue) {
                    return tagValue;
                },

                getSize() {
                    return [120, 90];
                },
            });

            const doc = new Docxtemplater(zip, {
                modules: [imageModule],
            });

            // 3. render dynamic toàn bộ body
            doc.render({
                ...fields,
            });

            // 4. generate file
            const buffer = doc.getZip().generate({
                type: "nodebuffer",
            });

            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            );

            res.setHeader(
                "Content-Disposition",
                'inline; filename="output.docx"'
            );
            res.send(buffer);
        } catch (err) {
            console.error(err);
            res.status(500).json({
                message: err.message,
            });
        }
    }

    getAll = async (req, res, next) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            const skip = (page - 1) * limit;

            const [data, total] = await Promise.all([
                GeneratedFile.find()
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit),
                GeneratedFile.countDocuments()
            ]);

            res.json({
                success: true,
                data,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new ConvertFileAndSubmitController();
