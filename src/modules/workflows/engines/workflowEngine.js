export const getNextStep = (instance, action) => {
  if (action === 'reject' || action === 'return') return null;
  return { stepOrder: instance.currentStepOrder + 1 };
};

export const canHandleStep = (step, userRole) => {
  return step.role === userRole || userRole === 'admin';
};
