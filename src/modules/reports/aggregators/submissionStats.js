import { Submission } from '../../forms/form.model.js';

export const getSubmissionAggregates = async (query = {}) => {
  const match = {};
  if (query.from || query.to) {
    match.createdAt = {};
    if (query.from) match.createdAt.$gte = new Date(query.from);
    if (query.to) match.createdAt.$lte = new Date(query.to);
  }

  const byStatus = await Submission.aggregate([
    { $match: match },
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $project: { status: '$_id', count: 1, _id: 0 } },
  ]);

  const total = byStatus.reduce((sum, s) => sum + s.count, 0);
  return { total, byStatus };
};
