import { Router } from 'express';
import * as signatureController from './signature.controller.js';
import { authenticate } from '../../shared/middlewares/authenticate.js';
import { authorize } from '../../shared/middlewares/authorize.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { ROLES } from '../../config/roles.js';

const router = Router();

router.use(authenticate);

router.post('/:submissionId/sign', authorize(ROLES.PRINCIPAL, ROLES.ADMIN), asyncHandler(signatureController.sign));
router.post('/:id/verify', asyncHandler(signatureController.verify));
router.get('/submission/:submissionId', asyncHandler(signatureController.getBySubmission));

export default router;
