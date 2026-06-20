import { WorkflowInstance } from './workflow.model.js';
import { Submission } from '../forms/form.model.js';

export const findPendingByRole = (role) =>
  WorkflowInstance.find({ status: { $in: ['pending', 'in_progress'] } })
    .populate('submissionId')
    .limit(50);

export const findInstanceBySubmission = (submissionId) =>
  WorkflowInstance.findOne({ submissionId });

export const updateSubmissionStatus = (submissionId, status) =>
  Submission.findByIdAndUpdate(submissionId, { status }, { new: true });

export const createInstance = (data) => WorkflowInstance.create(data);
