import { Workflow } from '../../modules/workflows/workflow.model.js';

export const seedWorkflows = async () => {
  const exists = await Workflow.findOne({ name: 'Default Approval Workflow' });
  if (exists) {
    console.log('[Seeder] Workflows already exist, skipping');
    return;
  }

  await Workflow.create({
    name: 'Default Approval Workflow',
    steps: [
      { stepOrder: 1, stepName: 'Cố vấn duyệt', role: 'academic_advisor', action: 'review' },
      { stepOrder: 2, stepName: 'Quản lý khoa duyệt', role: 'faculty_manager', action: 'approve' },
      { stepOrder: 3, stepName: 'Phòng CTSV duyệt', role: 'student_affairs', action: 'approve' },
      { stepOrder: 4, stepName: 'Hiệu trưởng ký', role: 'principal', action: 'sign' },
    ],
    isActive: true,
  });

  console.log('[Seeder] Workflows seeded');
};
