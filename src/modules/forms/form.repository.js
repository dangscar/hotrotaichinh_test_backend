import { FormTemplate, Submission } from './form.model.js';

export const findActiveTemplates = () => FormTemplate.find({ isActive: true });

export const findTemplateById = (id) => FormTemplate.findById(id);

export const createTemplate = (data) => FormTemplate.create(data);

export const findSubmissions = (filter = {}) => Submission.find(filter)
  .populate('formId', 'name code')
  .populate('submittedBy', 'fullName email')
  .sort({ createdAt: -1 });

export const findSubmissionsByUser = (userId) =>
  Submission.find({ submittedBy: userId }).sort({ createdAt: -1 });

export const findSubmissionById = (id) =>
  Submission.findById(id)
    .populate('formId')
    .populate('submittedBy', 'fullName email studentId');

export const createSubmission = (data) => Submission.create(data);

export const updateSubmission = (id, data) =>
  Submission.findByIdAndUpdate(id, data, { new: true });

export const countSubmissions = () => Submission.countDocuments();
