import Khoa from '../../modules/organization/models/khoa.model.js';
import BoMon from '../../modules/organization/models/boMon.model.js';
import Lop from '../../modules/organization/models/lop.model.js';
import Quyen from '../../modules/organization/models/quyen.model.js';

const DEFAULT_QUYENS = [
  { code: 'truong_khoa', name: 'Trưởng khoa', description: 'Quản lý cấp khoa' },
  { code: 'pho_khoa', name: 'Phó khoa', description: 'Phó quản lý cấp khoa' },
  { code: 'truong_bo_mon', name: 'Trưởng bộ môn', description: 'Quản lý cấp bộ môn' },
  { code: 'pho_bo_mon', name: 'Phó trưởng bộ môn', description: 'Phó quản lý cấp bộ môn' },
  { code: 'ban_giam_hieu', name: 'Ban giám hiệu', description: 'Ký duyệt cấp trường' },
  { code: 'truong_phong', name: 'Trưởng phòng', description: 'Quản lý phòng ban' },
  { code: 'pho_phong', name: 'Phó phòng', description: 'Phó quản lý phòng ban' },
];

export const seedOrganization = async () => {
  for (const q of DEFAULT_QUYENS) {
    await Quyen.findOneAndUpdate({ code: q.code }, { ...q, isActive: true }, { upsert: true });
  }

  const khoaCnt = await Khoa.countDocuments();
  if (khoaCnt > 0) {
    console.log('[Seeder] Organization already exists, skipping demo data');
    return;
  }

  const cntt = await Khoa.create({
    code: 'CNTT',
    name: 'Khoa Công nghệ Thông tin',
    description: 'Khoa CNTT - CTUT',
  });

  const dvt = await Khoa.create({
    code: 'DVT',
    name: 'Khoa Điện tử Viễn thông',
    description: 'Khoa Điện tử Viễn thông - CTUT',
  });

  const khmt = await BoMon.create({
    code: 'KHMT',
    name: 'Bộ môn Khoa học Máy tính',
    khoaId: cntt._id,
  });

  const htvt = await BoMon.create({
    code: 'HTVT',
    name: 'Bộ môn Hệ thống Thông tin',
    khoaId: cntt._id,
  });

  await Lop.create({
    code: 'DH22TIN01',
    name: 'DH22TIN01',
    khoaId: cntt._id,
    boMonId: khmt._id,
    academicYear: '2022-2026',
  });

  await Lop.create({
    code: 'DH22TIN02',
    name: 'DH22TIN02',
    khoaId: cntt._id,
    boMonId: htvt._id,
    academicYear: '2022-2026',
  });

  console.log('[Seeder] Organization demo data seeded (2 khoa, 2 bộ môn, 2 lớp, 7 quyền)');
};
