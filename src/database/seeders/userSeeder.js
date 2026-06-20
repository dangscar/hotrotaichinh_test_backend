import User from '../../modules/users/user.model.js';
import { hashPassword } from '../../shared/utils/hashPassword.js';
import { ROLES } from '../../config/roles.js';

const LEGACY_EMAIL_MAP = [
  ['sinhvien@tthc.edu.vn', 'sinhvien@ctut.edu.vn'],
  ['advisor@tthc.edu.vn', 'advisor@ctut.edu.vn'],
  ['assistant@tthc.edu.vn', 'assistant@ctut.edu.vn'],
  ['manager@tthc.edu.vn', 'manager@ctut.edu.vn'],
  ['ctsv@tthc.edu.vn', 'ctsv@ctut.edu.vn'],
  ['principal@tthc.edu.vn', 'principal@ctut.edu.vn'],
  ['staff@tthc.edu.vn', 'staff@ctut.edu.vn'],
  ['admin@tthc.local', 'admin@ctut.edu.vn'],
];

const DEMO_USERS = [
  {
    email: 'sinhvien@ctut.edu.vn',
    password: 'Student@123',
    fullName: 'Nguyễn Văn An',
    role: ROLES.STUDENT,
    studentId: 'SV20260001',
    faculty: 'Khoa Công nghệ Thông tin',
  },
  {
    email: 'advisor@ctut.edu.vn',
    password: 'Advisor@123',
    fullName: 'ThS. Trần Quốc Bình',
    role: ROLES.ACADEMIC_ADVISOR,
    department: 'Bộ môn Khoa học Máy tính',
  },
  {
    email: 'assistant@ctut.edu.vn',
    password: 'Assistant@123',
    fullName: 'Lê Thanh Hương',
    role: ROLES.FACULTY_ASSISTANT,
    faculty: 'Khoa Điện tử Viễn thông',
  },
  {
    email: 'manager@ctut.edu.vn',
    password: 'Manager@123',
    fullName: 'PGS. TS. Nguyễn Văn Hùng',
    role: ROLES.FACULTY_MANAGER,
    faculty: 'Khoa Công nghệ Thông tin',
  },
  {
    email: 'ctsv@ctut.edu.vn',
    password: 'Ctsv@123',
    fullName: 'Đỗ Thị Kim Oanh',
    role: ROLES.STUDENT_AFFAIRS,
    department: 'Phòng Công tác Học sinh Sinh viên',
  },
  {
    email: 'principal@ctut.edu.vn',
    password: 'Principal@123',
    fullName: 'GS. TS. Phạm Hoàng Hải',
    role: ROLES.PRINCIPAL,
    department: 'Ban Giám Hiệu',
  },
  {
    email: 'staff@ctut.edu.vn',
    password: 'Staff@123',
    fullName: 'Nguyễn Minh Châu',
    role: ROLES.OFFICE_STAFF,
    department: 'Văn phòng Trường',
  },
  {
    email: 'admin@ctut.edu.vn',
    password: 'Admin@123',
    fullName: 'Quản trị viên Hệ thống',
    role: ROLES.ADMIN,
    department: 'Phòng Quản trị hệ thống',
  },
];

const migrateLegacyEmails = async () => {
  for (const [oldEmail, newEmail] of LEGACY_EMAIL_MAP) {
    const updated = await User.updateOne({ email: oldEmail }, { $set: { email: newEmail } });
    if (updated.modifiedCount > 0) {
      console.log(`[Seeder] Migrated email: ${oldEmail} → ${newEmail}`);
    }
  }
};

export const seedUsers = async () => {
  await migrateLegacyEmails();

  let created = 0;
  let skipped = 0;

  for (const userData of DEMO_USERS) {
    const exists = await User.findOne({ email: userData.email });
    if (exists) {
      skipped++;
      continue;
    }

    const { password, ...rest } = userData;
    await User.create({
      ...rest,
      password: await hashPassword(password),
      isActive: true,
    });
    created++;
    console.log(`[Seeder] Created user: ${userData.email}`);
  }

  console.log(`[Seeder] Users — created: ${created}, skipped: ${skipped}`);
};
