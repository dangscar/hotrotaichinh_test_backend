import * as formService from './form.service.js';
import { successResponse } from '../../shared/utils/apiResponse.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';

export const getTemplates = async (_req, res) => {
  const templates = await formService.getTemplates();
  return successResponse(res, templates);
};

export const getTemplate = async (req, res) => {
  const template = await formService.getTemplate(req.params.id);
  return successResponse(res, template);
};

export const createTemplate = async (req, res) => {
  const template = await formService.createTemplate(req.body, req.user.id);
  return successResponse(res, template, 'Form template created', HTTP_STATUS.CREATED);
};

export const getSubmissions = async (req, res) => {
  const submissions = await formService.getSubmissions(req.query);
  return successResponse(res, submissions);
};

export const getMySubmissions = async (req, res) => {
  const submissions = await formService.getMySubmissions(req.user.id);
  return successResponse(res, submissions);
};

export const getSubmission = async (req, res) => {
  const submission = await formService.getSubmission(req.params.id);
  return successResponse(res, submission);
};

export const createSubmission = async (req, res) => {
  const submission = await formService.createSubmission(req.body, req.user.id);
  return successResponse(res, submission, 'Submission created', HTTP_STATUS.CREATED);
};

export const updateSubmission = async (req, res) => {
  const submission = await formService.updateSubmission(req.params.id, req.body);
  return successResponse(res, submission, 'Submission updated');
};

export const submitForm = async (req, res) => {
  const submission = await formService.submitForm(req.params.id, req.user.id);
  return successResponse(res, submission, 'Form submitted');
};
