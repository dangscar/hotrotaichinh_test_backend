import { Router } from 'express';
import * as userController from './user.controller.js';
import { authenticate } from '../../shared/middlewares/authenticate.js';
import { authorize } from '../../shared/middlewares/authorize.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { ROLES } from '../../config/roles.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize(ROLES.ADMIN), asyncHandler(userController.getAll));
router.get('/:id', asyncHandler(userController.getById));
router.post('/', authorize(ROLES.ADMIN), asyncHandler(userController.create));
router.put('/:id', authorize(ROLES.ADMIN), asyncHandler(userController.update));
router.patch('/:id/status', authorize(ROLES.ADMIN), asyncHandler(userController.updateStatus));
router.delete('/:id', authorize(ROLES.ADMIN), asyncHandler(userController.remove));

export default router;
