import { Router } from 'express';
import multer from 'multer';
import loaiDonController from './loaidon.controller.js';

const router = Router();

// Configure multer for storing uploaded files temporarily
const upload = multer({
    storage: multer.memoryStorage(),
});

router.post("/", upload.single('file'), loaiDonController.import);
router.get("/", loaiDonController.getAll);
router.get("/:id", loaiDonController.getById);
router.put("/:id", loaiDonController.update);
router.delete("/:id", loaiDonController.delete);

export default router;