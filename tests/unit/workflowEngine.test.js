import { getNextStep } from '../../src/modules/workflows/engines/workflowEngine.js';

describe('workflowEngine', () => {
  test('getNextStep returns next step on approve', () => {
    const instance = { currentStepOrder: 1 };
    const next = getNextStep(instance, 'approve');
    expect(next.stepOrder).toBe(2);
  });

  test('getNextStep returns null on reject', () => {
    const instance = { currentStepOrder: 1 };
    expect(getNextStep(instance, 'reject')).toBeNull();
  });
});
