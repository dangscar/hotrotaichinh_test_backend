import { Router } from 'express';
import * as workflowController from './workflow.controller.js';
import { authenticate } from '../../shared/middlewares/authenticate.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';

const router = Router();

router.use(authenticate);

router.get('/pending', asyncHandler(workflowController.getPending));
router.post('/:submissionId/approve', asyncHandler(workflowController.approve));
router.post('/:submissionId/reject', asyncHandler(workflowController.reject));
router.post('/:submissionId/return', asyncHandler(workflowController.returnToStudent));
router.get('/:submissionId/history', asyncHandler(workflowController.getHistory));

export default router;
