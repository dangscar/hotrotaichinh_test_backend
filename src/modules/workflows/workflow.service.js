import * as workflowRepository from './workflow.repository.js';
import { getNextStep } from './engines/workflowEngine.js';
import { NotFoundError } from '../../shared/errors/AppError.js';
import { SUBMISSION_STATUS } from '../../shared/constants/submissionStatus.js';

export const getPendingTasks = async (user) => {
  return workflowRepository.findPendingByRole(user.role);
};

export const approve = async (submissionId, user, { comment }) => {
  const instance = await workflowRepository.findInstanceBySubmission(submissionId);
  if (!instance) throw new NotFoundError('Workflow instance not found');

  const nextStep = getNextStep(instance, 'approve');
  instance.steps.push({
    stepOrder: instance.currentStepOrder,
    handledBy: user.id,
    action: 'approved',
    comment,
    handledAt: new Date(),
  });

  if (nextStep) {
    instance.currentStepOrder = nextStep.stepOrder;
    instance.status = 'in_progress';
  } else {
    instance.status = 'completed';
    instance.completedAt = new Date();
  }

  await instance.save();
  await workflowRepository.updateSubmissionStatus(
    submissionId,
    nextStep ? SUBMISSION_STATUS.IN_REVIEW : SUBMISSION_STATUS.APPROVED,
  );

  return instance;
};

export const reject = async (submissionId, user, { comment }) => {
  const instance = await workflowRepository.findInstanceBySubmission(submissionId);
  if (!instance) throw new NotFoundError('Workflow instance not found');

  instance.status = 'rejected';
  instance.steps.push({
    stepOrder: instance.currentStepOrder,
    handledBy: user.id,
    action: 'rejected',
    comment,
    handledAt: new Date(),
  });

  await instance.save();
  await workflowRepository.updateSubmissionStatus(submissionId, SUBMISSION_STATUS.REJECTED);
  return instance;
};

export const returnToStudent = async (submissionId, user, { comment }) => {
  const instance = await workflowRepository.findInstanceBySubmission(submissionId);
  if (!instance) throw new NotFoundError('Workflow instance not found');

  instance.currentStepOrder = 0;
  instance.steps.push({
    stepOrder: instance.currentStepOrder,
    handledBy: user.id,
    action: 'returned',
    comment,
    handledAt: new Date(),
  });

  await instance.save();
  await workflowRepository.updateSubmissionStatus(submissionId, SUBMISSION_STATUS.RETURNED);
  return instance;
};

export const getHistory = async (submissionId) => {
  const instance = await workflowRepository.findInstanceBySubmission(submissionId);
  if (!instance) throw new NotFoundError('Workflow history not found');
  return instance.steps;
};
