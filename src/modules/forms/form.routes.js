import { Router } from 'express';
import * as formController from './form.controller.js';
import { authenticate } from '../../shared/middlewares/authenticate.js';
import { authorize } from '../../shared/middlewares/authorize.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { ROLES } from '../../config/roles.js';

const router = Router();

// Submission routes (must be before /:id)
router.get('/submissions/list', authenticate, asyncHandler(formController.getSubmissions));
router.get('/submissions/my', authenticate, asyncHandler(formController.getMySubmissions));
router.get('/submissions/:id', authenticate, asyncHandler(formController.getSubmission));
router.post('/submissions', authenticate, authorize(ROLES.STUDENT), asyncHandler(formController.createSubmission));
router.put('/submissions/:id', authenticate, asyncHandler(formController.updateSubmission));
router.post('/submissions/:id/submit', authenticate, asyncHandler(formController.submitForm));

// Template routes
router.get('/', authenticate, asyncHandler(formController.getTemplates));
router.get('/:id', authenticate, asyncHandler(formController.getTemplate));
router.post('/', authenticate, authorize(ROLES.ADMIN), asyncHandler(formController.createTemplate));

export default router;
