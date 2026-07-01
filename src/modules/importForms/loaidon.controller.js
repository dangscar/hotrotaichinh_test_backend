import LoaiDon from "./LoaiDon.model.js";
import { parsePagination, buildPaginationMeta } from "../../shared/utils/pagination.js";
import fs from "fs";
import path from "path";
import mammoth from "mammoth";
import cloudinary from "../../config/cloudinary.js";
import axios from "axios";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

// Hàm đọc file word và lấy ra các trường cần điền (chẳng hạn {Ho_Ten}, {MSSV})
async function readWordFileFromUrl(url) {
  // 1. tải file từ Cloudinary
  const response = await axios.get(url, {
    responseType: "arraybuffer",
  });

  const buffer = Buffer.from(response.data);

  // 2. đọc docx từ buffer
  const result = await mammoth.extractRawText({
    buffer,
  });

  const content = result.value;

  const matches = content.match(/\{([^}]+)\}/g) || [];

  const fields = matches.map((item) =>
    item.replace(/[{}]/g, "")
  );

  return fields;
}

class LoaiDonController {

  async import(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "Vui lòng chọn file Word",
        });
      }
      //✅ check đúng file docx
      if (
        req.file.mimetype !==
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        return res.status(400).json({
          message: "Chỉ hỗ trợ file DOCX",
        });
      }

      const fileName = req.file.originalname.split(".")[0];

      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: "raw",
            folder: "word-templates",
            public_id: `${fileName}-${Date.now()}`,
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );

        // ⚠️ quan trọng nhất
        stream.end(req.file.buffer);
      });

      const content = await readWordFileFromUrl(uploadResult.secure_url);
      const loaiDon = await LoaiDon.create({
        tenDon: req.file.originalname.split(".")[0],
        templateFile: uploadResult.secure_url,
        chiTiet: content.map(item => ({
          moTa: item,
          placeHolder: item,
        })),
      });

      return res.json({
        success: true,
        data: loaiDon,
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getAll(req, res) {
    try {
      const { page, limit, skip } = parsePagination(req.query);
      const search = req.query.search || "";

      const query = {};
      if (search) {
        query.tenDon = { $regex: search, $options: "i" };
      }

      const [data, total] = await Promise.all([
        LoaiDon.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        LoaiDon.countDocuments(query),
      ]);

      res.json({
        success: true,
        data,
        pagination: buildPaginationMeta(total, page, limit),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getById(req, res) {
    try {
      const loaiDon = await LoaiDon.findById(req.params.id);

      if (!loaiDon) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy loại đơn",
        });
      }

      res.json({
        success: true,
        data: loaiDon,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async update(req, res) {
    try {
      const { tenDon, chiTiet } = req.body;

      const loaiDon = await LoaiDon.findById(req.params.id);

      if (!loaiDon) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy loại đơn",
        });
      }

      // cập nhật tên đơn
      if (tenDon !== undefined) {
        loaiDon.tenDon = tenDon;
      }

      // chỉ update moTa, giữ nguyên placeHolder
      if (Array.isArray(chiTiet)) {
        loaiDon.chiTiet = loaiDon.chiTiet.map(oldItem => {
          const updatedItem = chiTiet.find(
            newItem => newItem._id === oldItem._id.toString()
          );

          if (updatedItem) {
            return {
              ...oldItem.toObject(),
              moTa: updatedItem.moTa ?? oldItem.moTa
              // ❗ placeHolder giữ nguyên
            };
          }

          return oldItem;
        });
      }

      await loaiDon.save();

      res.json({
        success: true,
        message: "Cập nhật mô tả thành công",
        data: loaiDon
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async delete(req, res) {
    try {
      const loaiDon = await LoaiDon.findById(req.params.id);

      if (!loaiDon) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy loại đơn",
        });
      }

      if (loaiDon.templateFile) {
        const publicId = getPublicId(loaiDon.templateFile);

        if (publicId) {
          await cloudinary.uploader.destroy(publicId, {
            resource_type: "raw",
          });
        }
      }

      await LoaiDon.findByIdAndDelete(req.params.id);

      return res.json({
        success: true,
        message: "Xóa thành công",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  previewFile = async (req, res) => {
    try {
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({ message: "Missing template URL" });
      }

      // 1. download docx từ URL
      const response = await axios.get(url, {
        responseType: "arraybuffer",
      });

      const content = Buffer.from(response.data);

      const zip = new PizZip(content);

      const doc = new Docxtemplater(zip);

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
  };


}

function getPublicId(url) {
  const regex = /\/upload\/(?:v\d+\/)?(.+?)(?:\.[^/.]+)?$/;
  const match = url.match(regex);

  return match ? match[1] : null;
}

export default new LoaiDonController();