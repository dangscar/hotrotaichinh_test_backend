import * as workflowService from './workflow.service.js';
import { successResponse } from '../../shared/utils/apiResponse.js';

export const getPending = async (req, res) => {
  const tasks = await workflowService.getPendingTasks(req.user);
  return successResponse(res, tasks);
};

export const approve = async (req, res) => {
  const result = await workflowService.approve(req.params.submissionId, req.user, req.body);
  return successResponse(res, result, 'Approved successfully');
};

export const reject = async (req, res) => {
  const result = await workflowService.reject(req.params.submissionId, req.user, req.body);
  return successResponse(res, result, 'Rejected');
};

export const returnToStudent = async (req, res) => {
  const result = await workflowService.returnToStudent(req.params.submissionId, req.user, req.body);
  return successResponse(res, result, 'Returned to student');
};

export const getHistory = async (req, res) => {
  const history = await workflowService.getHistory(req.params.submissionId);
  return successResponse(res, history);
};
