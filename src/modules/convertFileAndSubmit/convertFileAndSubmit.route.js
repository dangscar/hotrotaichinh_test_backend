import { Router } from 'express';
import multer from 'multer';
import convertFileAndSubmitController from './convertFileAndSubmit.controller.js';

const router = Router();

// Configure multer for storing uploaded files temporarily
const upload = multer({ dest: 'uploads/' });


router.post("/generate", upload.single('ANH_THE'), convertFileAndSubmitController.generateFile);
router.post("/preview", upload.single('ANH_THE'), convertFileAndSubmitController.previewFile);
router.get("/", convertFileAndSubmitController.getAll); //Lấy danh sách các file sinh viên đã nộp

export default router;
