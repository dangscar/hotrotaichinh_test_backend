import * as formRepository from './form.repository.js';
import { NotFoundError, ValidationError } from '../../shared/errors/AppError.js';
import { SUBMISSION_STATUS } from '../../shared/constants/submissionStatus.js';

const generateSubmissionCode = async () => {
  const count = await formRepository.countSubmissions();
  const year = new Date().getFullYear();
  return `HS-${year}-${String(count + 1).padStart(5, '0')}`;
};

export const getTemplates = () => formRepository.findActiveTemplates();

export const getTemplate = async (id) => {
  const template = await formRepository.findTemplateById(id);
  if (!template) throw new NotFoundError('Form template not found');
  return template;
};

export const createTemplate = (data, userId) =>
  formRepository.createTemplate({ ...data, createdBy: userId });

export const getSubmissions = (query) => formRepository.findSubmissions(query);

export const getMySubmissions = (userId) =>
  formRepository.findSubmissionsByUser(userId);

export const getSubmission = async (id) => {
  const submission = await formRepository.findSubmissionById(id);
  if (!submission) throw new NotFoundError('Submission not found');
  return submission;
};

export const createSubmission = async (data, userId) => {
  const code = await generateSubmissionCode();
  return formRepository.createSubmission({
    ...data,
    submissionCode: code,
    submittedBy: userId,
    status: SUBMISSION_STATUS.DRAFT,
  });
};

export const updateSubmission = async (id, data) => {
  const submission = await formRepository.updateSubmission(id, data);
  if (!submission) throw new NotFoundError('Submission not found');
  return submission;
};

export const submitForm = async (id, userId) => {
  const submission = await formRepository.findSubmissionById(id);
  if (!submission) throw new NotFoundError('Submission not found');
  if (submission.submittedBy.toString() !== userId) {
    throw new ValidationError('Not authorized to submit this form');
  }
  if (submission.status !== SUBMISSION_STATUS.DRAFT) {
    throw new ValidationError('Submission already submitted');
  }

  return formRepository.updateSubmission(id, {
    status: SUBMISSION_STATUS.SUBMITTED,
    submittedAt: new Date(),
    currentStepOrder: 1,
  });
};
