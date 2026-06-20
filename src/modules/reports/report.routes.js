import { Router } from 'express';
import * as reportController from './report.controller.js';
import { authenticate } from '../../shared/middlewares/authenticate.js';
import { authorize } from '../../shared/middlewares/authorize.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { ROLES } from '../../config/roles.js';

const router = Router();

router.use(authenticate);
router.use(authorize(
  ROLES.FACULTY_MANAGER,
  ROLES.STUDENT_AFFAIRS,
  ROLES.PRINCIPAL,
  ROLES.ADMIN,
));

router.get('/submissions', asyncHandler(reportController.getSubmissionStats));
router.get('/workflow-performance', asyncHandler(reportController.getWorkflowPerformance));
router.get('/export', asyncHandler(reportController.exportReport));

export default router;
