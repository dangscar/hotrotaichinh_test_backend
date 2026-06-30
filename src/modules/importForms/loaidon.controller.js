import LoaiDon from "./LoaiDon.model.js";
import { parsePagination, buildPaginationMeta } from "../../shared/utils/pagination.js";
import fs from "fs";
import path from "path";
import mammoth from "mammoth";
import cloudinary from "../../config/cloudinary.js";
import axios from "axios";

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

  // // Import file word để lấy các trường cần điền
  // async import(req, res) {
  //   try {
  //       // Kiểm tra file
  //       if (!req.file) {
  //           return res.status(400).json({
  //               message: "Vui lòng chọn file Word",
  //           });
  //       }
  //       console.log(req.file)
  //       res.send("Success")

  //       // //Đọc file word từ đường dẫn
  //       // const content = await readWordFile(req.file.path);

  //       // // Lấy tên file ( bỏ đuôi )
  //       // const tenDon = path.parse(req.file.originalname).name;

  //       // // tạo thư mục templates nếu chưa có
  //       // const templateDir = path.join(import.meta.dirname,"../templates");

  //       // if (!fs.existsSync(templateDir)) {
  //       //     fs.mkdirSync(templateDir, {recursive: true});
  //       // }

  //       // // đường dẫn file template
  //       // const templatePath = path.resolve(import.meta.dirname,"../templates", req.file.originalname);

  //       // // copy file sang templates
  //       // fs.copyFileSync(req.file.path, templatePath);

  //       // fs.unlink(req.file.path, (err) => {
  //       // if (err) {
  //       //     console.error(err);
  //       //     }
  //       // });

  //       // const loaiDon = await LoaiDon.create({
  //       //     tenDon,
  //       //     templateFile: templatePath,
  //       //     chiTiet: content.map(item => ({
  //       //         moTa: item,
  //       //         placeHolder: item,
  //       //     })),
  //       // });

  //       // res.json({
  //       //     success: true,
  //       //     data: loaiDon,
  //       // });

  //   } catch (error) {
  //       res.status(500).json({
  //           success: false,
  //           message: error.message,
  //       });
  //   }
  // }

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

      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: "raw",
            folder: "word-templates",
            public_id: req.file.originalname.split(".")[0],
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
    res.send("delete");
    // try {
    //     const loaiDon = await LoaiDon.findById(req.params.id);

    //     if (!loaiDon) {
    //         return res.status(404).json({
    //             success: false,
    //             message: "Không tìm thấy loại đơn",
    //         });
    //     }

    //     if (
    //         loaiDon.templateFile &&
    //         fs.existsSync(loaiDon.templateFile)
    //     ) {
    //         await fs.promises.unlink(loaiDon.templateFile);
    //     }

    //     await LoaiDon.findByIdAndDelete(req.params.id);

    //     return res.json({
    //         success: true,
    //         message: "Xóa loại đơn thành công",
    //     });

    // } catch (error) {
    //     return res.status(500).json({
    //         success: false,
    //         message: error.message,
    //     });
    // }
  }
}

export default new LoaiDonController();