import { Submission } from '../forms/form.model.js';
import { SUBMISSION_STATUS } from '../../shared/constants/submissionStatus.js';

export const getStats = async (user) => {
  const baseFilter = user.role === 'student' ? { submittedBy: user.id } : {};

  const [total, pending, completed, rejected] = await Promise.all([
    Submission.countDocuments(baseFilter),
    Submission.countDocuments({ ...baseFilter, status: SUBMISSION_STATUS.IN_REVIEW }),
    Submission.countDocuments({ ...baseFilter, status: SUBMISSION_STATUS.COMPLETED }),
    Submission.countDocuments({ ...baseFilter, status: SUBMISSION_STATUS.REJECTED }),
  ]);

  return {
    totalSubmissions: total,
    pendingApprovals: pending,
    completedThisMonth: completed,
    rejectedCount: rejected,
  };
};
