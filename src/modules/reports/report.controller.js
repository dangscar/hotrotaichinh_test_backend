import * as reportService from './report.service.js';
import { successResponse } from '../../shared/utils/apiResponse.js';

export const getSubmissionStats = async (req, res) => {
  const stats = await reportService.getSubmissionStats(req.query);
  return successResponse(res, stats);
};

export const getWorkflowPerformance = async (req, res) => {
  const stats = await reportService.getWorkflowPerformance(req.query);
  return successResponse(res, stats);
};

export const exportReport = async (req, res) => {
  const data = await reportService.exportReport(req.query);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=report.csv');
  return res.send(data);
};
