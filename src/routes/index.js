import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import userRoutes from '../modules/users/user.routes.js';
import formRoutes from '../modules/forms/form.routes.js';
import workflowRoutes from '../modules/workflows/workflow.routes.js';
import signatureRoutes from '../modules/signatures/signature.routes.js';
import notificationRoutes from '../modules/notifications/notification.routes.js';
import dashboardRoutes from '../modules/dashboard/dashboard.routes.js';
import reportRoutes from '../modules/reports/report.routes.js';
import auditLogRoutes from '../modules/auditLogs/auditLog.routes.js';
import organizationRoutes from '../modules/organization/organization.routes.js';
import importFormRoutes from '../modules/importForms/loaidon.route.js'; //Import form
import convertFileAndSubmitRoutes from '../modules/convertFileAndSubmit/convertFileAndSubmit.route.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'PM_TTHC2 API is running' });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/forms', formRoutes);
router.use('/workflows', workflowRoutes);
router.use('/signatures', signatureRoutes);
router.use('/notifications', notificationRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/organization', organizationRoutes);
router.use('/import-forms', importFormRoutes) //Route import form
router.use('/convert-file-and-submit', convertFileAndSubmitRoutes); //Route convert file and submit
export default router;
