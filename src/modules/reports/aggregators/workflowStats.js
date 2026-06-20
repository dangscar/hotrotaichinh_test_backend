import { WorkflowInstance } from '../../workflows/workflow.model.js';

export const getWorkflowAggregates = async () => {
  const byStatus = await WorkflowInstance.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $project: { status: '$_id', count: 1, _id: 0 } },
  ]);

  return { byStatus };
};
