import { getSubmissionAggregates } from './aggregators/submissionStats.js';
import { getWorkflowAggregates } from './aggregators/workflowStats.js';

export const getSubmissionStats = (query) => getSubmissionAggregates(query);

export const getWorkflowPerformance = (query) => getWorkflowAggregates(query);

export const exportReport = async (query) => {
  const stats = await getSubmissionAggregates(query);
  const header = 'Status,Count\n';
  const rows = stats.byStatus.map((s) => `${s.status},${s.count}`).join('\n');
  return header + rows;
};
