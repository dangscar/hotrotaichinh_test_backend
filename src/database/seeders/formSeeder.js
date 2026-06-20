import { FormTemplate } from '../../modules/forms/form.model.js';

export const seedForms = async () => {
  const exists = await FormTemplate.findOne({ code: 'TTHC-001' });
  if (exists) {
    console.log('[Seeder] Form templates already exist, skipping');
    return;
  }

  await FormTemplate.create({
    code: 'TTHC-001',
    name: 'Đơn xin xác nhận sinh viên',
    description: 'Biểu mẫu xin xác nhận thông tin sinh viên',
    category: 'Hành chính',
    fields: [
      { name: 'reason', label: 'Lý do xin xác nhận', type: 'textarea', required: true },
      { name: 'quantity', label: 'Số lượng bản', type: 'number', required: true },
    ],
    isActive: true,
  });

  console.log('[Seeder] Form templates seeded');
};
