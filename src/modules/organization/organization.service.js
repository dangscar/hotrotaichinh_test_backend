import Khoa from './models/khoa.model.js';
import BoMon from './models/boMon.model.js';
import Lop from './models/lop.model.js';
import SinhVien from './models/sinhVien.model.js';
import GiangVien from './models/giangVien.model.js';
import Quyen from './models/quyen.model.js';
import GiangVienQuyen from './models/giangVienQuyen.model.js';
import { NotFoundError, ValidationError } from '../../shared/errors/AppError.js';
import { buildPaginationMeta } from '../../shared/utils/pagination.js';
import {
  cell,
  escapeRegex,
  findEntityByNormalizedName,
  giangVienRowFields,
  isEmptyRow,
  khoaFields,
  parseExcelRows,
  toRowMap,
} from './importRowUtils.js';

const parseRows = (buffer) => parseExcelRows(buffer);

const pushImportError = (results, row, code, message, detail) => {
  results.errors.push({ row, code, message, ...(detail ? { detail } : {}) });
};

const paginate = async (Model, filter, pagination, populate = []) => {
  let query = Model.find(filter);
  populate.forEach((p) => { query = query.populate(p); });
  const [data, total] = await Promise.all([
    query.clone().skip(pagination.skip).limit(pagination.limit).sort({ createdAt: -1 }),
    Model.countDocuments(filter),
  ]);
  return { data, meta: buildPaginationMeta(total, pagination.page, pagination.limit) };
};

const softDelete = async (Model, id, blockMessage, countFn) => {
  const doc = await Model.findById(id);
  if (!doc) throw new NotFoundError('Không tìm thấy bản ghi');
  if (countFn) {
    const count = await countFn(id);
    if (count > 0) throw new ValidationError(blockMessage);
  }
  doc.isActive = false;
  await doc.save();
  return doc;
};

// ─── Khoa ───
export const getKhoas = (query, pagination) => {
  const filter = { isActive: query.isActive === 'false' ? false : query.isActive === 'all' ? undefined : true };
  if (filter.isActive === undefined) delete filter.isActive;
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { code: { $regex: query.search, $options: 'i' } },
    ];
  }
  return paginate(Khoa, filter, pagination);
};

export const getAllKhoas = () => Khoa.find({ isActive: true }).sort({ name: 1 });

export const createKhoa = async (data) => {
  const exists = await Khoa.findOne({ code: data.code.toUpperCase() });
  if (exists) throw new ValidationError(`Mã khoa ${data.code} đã tồn tại`);
  return Khoa.create({ ...data, code: data.code.toUpperCase() });
};

export const updateKhoa = async (id, data) => {
  const doc = await Khoa.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!doc) throw new NotFoundError('Không tìm thấy khoa');
  return doc;
};

export const deleteKhoa = (id) =>
  softDelete(Khoa, id, 'Không thể xóa khoa đang có bộ môn', (khoaId) => BoMon.countDocuments({ khoaId, isActive: true }));

export const importKhoas = async (buffer) => {
  const { rows, detectedHeaders, headerRow } = parseRows(buffer);
  const results = { success: 0, errors: [], detectedHeaders, headerRow };

  const headerStr = detectedHeaders.map((h) => String(h).toLowerCase()).join(' ');
  if (/ma sv|masv|ma gv|magv|ho ten|hoten|lop|ngay sinh|email/.test(headerStr)) {
    pushImportError(results, headerRow, 'WRONG_FILE', 'File không đúng loại dữ liệu');
    return results;
  }

  for (let i = 0; i < rows.length; i++) {
    const map = toRowMap(rows[i]);
    if (isEmptyRow(map)) continue;
    const { code, name } = khoaFields(map, detectedHeaders);
    if (!code || !name) {
      pushImportError(results, headerRow + i + 1, 'MISSING_FIELDS', 'Thiếu mã hoặc tên khoa');
      continue;
    }
    try {
      await Khoa.findOneAndUpdate(
        { code },
        {
          code,
          name,
          description: cell(map, 'description', 'moTa', 'mota', 'mo ta', 'Mô tả'),
          isActive: true,
        },
        { upsert: true, new: true },
      );
      results.success++;
    } catch (err) {
      results.errors.push({ row: headerRow + i + 1, message: err.message });
    }
  }

  if (results.success === 0 && results.errors.length > 1) {
    const firstMsg = results.errors[0].message;
    if (results.errors.every((e) => e.message === firstMsg)) {
      results.errors = [{ row: results.errors[0].row, message: `${firstMsg} (${results.errors.length} dòng)` }];
    }
  }

  return results;
};

// ─── Bộ môn ───
export const getBoMons = (query, pagination) => {
  const filter = {};
  if (query.khoaId) filter.khoaId = query.khoaId;
  if (query.isActive !== 'all') filter.isActive = query.isActive !== 'false';
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { code: { $regex: query.search, $options: 'i' } },
    ];
  }
  return paginate(BoMon, filter, pagination, [{ path: 'khoaId', select: 'code name' }]);
};

export const createBoMon = async (data) => {
  const khoa = await Khoa.findById(data.khoaId);
  if (!khoa) throw new ValidationError('Khoa không tồn tại');
  return BoMon.create({ ...data, code: data.code.toUpperCase() });
};

export const updateBoMon = async (id, data) => {
  const doc = await BoMon.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .populate('khoaId', 'code name');
  if (!doc) throw new NotFoundError('Không tìm thấy bộ môn');
  return doc;
};

export const deleteBoMon = async (id) => {
  const doc = await BoMon.findById(id);
  if (!doc) throw new NotFoundError('Không tìm thấy bộ môn');

  const [lopCount, gvCount] = await Promise.all([
    Lop.countDocuments({ boMonId: id, isActive: true }),
    GiangVien.countDocuments({ boMonId: id, isActive: true }),
  ]);

  if (lopCount > 0 || gvCount > 0) {
    const parts = [];
    if (lopCount > 0) parts.push(`${lopCount} lớp`);
    if (gvCount > 0) parts.push(`${gvCount} giảng viên`);
    throw new ValidationError(`Bộ môn còn ${parts.join(' và ')}. Hãy xóa hoặc chuyển trước.`);
  }

  doc.isActive = false;
  await doc.save();
  return doc;
};

export const importBoMons = async (buffer, defaults = {}) => {
  const { rows, headerRow } = parseRows(buffer);
  const results = { success: 0, errors: [] };

  let defaultKhoa = null;
  if (defaults.khoaId) {
    defaultKhoa = await Khoa.findOne({ _id: defaults.khoaId, isActive: true });
  }

  for (let i = 0; i < rows.length; i++) {
    const map = toRowMap(rows[i]);
    if (isEmptyRow(map)) continue;
    const khoaCode = cell(map, 'khoaCode', 'maKhoa', 'makhoa', 'ma khoa', 'Khoa', 'Mã khoa').toUpperCase();
    const code = cell(map, 'code', 'ma', 'mabomon', 'ma bo mon', 'Mã bộ môn', 'MaBoMon', 'Ma bo mon').toUpperCase();
    const name = cell(map, 'name', 'ten', 'tenbomon', 'ten bo mon', 'Tên bộ môn', 'TenBoMon', 'Ten bo mon', 'Tên');

    let khoa = defaultKhoa;
    if (!khoa && khoaCode) {
      khoa = await Khoa.findOne({ code: khoaCode, isActive: true });
    }
    if (!khoa && cell(map, 'khoa', 'Khoa', 'tenKhoa')) {
      const khoas = await Khoa.find({ isActive: true });
      khoa = findEntityByNormalizedName(khoas, cell(map, 'khoa', 'Khoa', 'tenKhoa'));
    }

    if (!khoa) {
      pushImportError(results, headerRow + i + 1, 'MISSING_KHOA', 'Chưa xác định được khoa', {
        name: khoaCode || cell(map, 'khoa', 'Khoa', 'tenKhoa'),
      });
      continue;
    }
    if (!code || !name) {
      pushImportError(results, headerRow + i + 1, 'MISSING_FIELDS', 'Thiếu mã hoặc tên bộ môn');
      continue;
    }
    try {
      await BoMon.findOneAndUpdate(
        { khoaId: khoa._id, code },
        { khoaId: khoa._id, code, name, isActive: true },
        { upsert: true, new: true },
      );
      results.success++;
    } catch (err) {
      results.errors.push({ row: headerRow + i + 1, message: err.message });
    }
  }
  return results;
};

// ─── Lớp ───
export const getLops = (query, pagination) => {
  const filter = {};
  if (query.khoaId) filter.khoaId = query.khoaId;
  if (query.boMonId) filter.boMonId = query.boMonId;
  if (query.isActive !== 'all') filter.isActive = query.isActive !== 'false';
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { code: { $regex: query.search, $options: 'i' } },
    ];
  }
  return paginate(Lop, filter, pagination, [
    { path: 'khoaId', select: 'code name' },
    { path: 'boMonId', select: 'code name' },
  ]);
};

export const createLop = async (data) => {
  const boMon = await BoMon.findById(data.boMonId);
  if (!boMon) throw new ValidationError('Bộ môn không tồn tại');
  return Lop.create({
    ...data,
    code: data.code.toUpperCase(),
    khoaId: data.khoaId || boMon.khoaId,
  });
};

export const updateLop = async (id, data) => {
  const doc = await Lop.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .populate('khoaId', 'code name')
    .populate('boMonId', 'code name');
  if (!doc) throw new NotFoundError('Không tìm thấy lớp');
  return doc;
};

export const deleteLop = (id) =>
  softDelete(Lop, id, 'Không thể xóa lớp đang có sinh viên', (lopId) => SinhVien.countDocuments({ lopId, isActive: true }));

export const importLops = async (buffer, defaults = {}) => {
  const { rows, headerRow } = parseRows(buffer);
  const results = { success: 0, errors: [] };

  let defaultBoMon = null;
  if (defaults.boMonId) {
    defaultBoMon = await BoMon.findOne({ _id: defaults.boMonId, isActive: true });
  }

  for (let i = 0; i < rows.length; i++) {
    const map = toRowMap(rows[i]);
    if (isEmptyRow(map)) continue;
    const boMonCode = cell(map, 'boMonCode', 'maBoMon', 'mabomon', 'ma bo mon', 'Mã bộ môn').toUpperCase();
    const khoaCode = cell(map, 'khoaCode', 'maKhoa', 'makhoa', 'ma khoa', 'Mã khoa').toUpperCase();
    const code = cell(map, 'code', 'ma', 'malop', 'ma lop', 'Mã lớp', 'MaLop', 'Ma lop').toUpperCase();
    const name = cell(map, 'name', 'ten', 'tenlop', 'ten lop', 'Tên lớp', 'TenLop', 'Ten lop', 'Tên');

    let boMon = defaultBoMon;
    if (!boMon && (boMonCode || khoaCode)) {
      const khoa = khoaCode
        ? await Khoa.findOne({ code: khoaCode, isActive: true })
        : defaults.khoaId
          ? await Khoa.findOne({ _id: defaults.khoaId, isActive: true })
          : null;
      if (khoa && boMonCode) {
        boMon = await BoMon.findOne({ khoaId: khoa._id, code: boMonCode, isActive: true });
      }
    }

    if (!boMon) {
      pushImportError(results, headerRow + i + 1, 'MISSING_BOMON', 'Chưa xác định được bộ môn', {
        name: boMonCode || cell(map, 'boMon', 'BoMon', 'tenBoMon'),
      });
      continue;
    }
    if (!code || !name) {
      pushImportError(results, headerRow + i + 1, 'MISSING_FIELDS', 'Thiếu mã hoặc tên lớp');
      continue;
    }
    try {
      await Lop.findOneAndUpdate(
        { boMonId: boMon._id, code },
        {
          khoaId: boMon.khoaId,
          boMonId: boMon._id,
          code,
          name,
          academicYear: cell(map, 'academicYear', 'namHoc', 'nam hoc', 'Năm học'),
          isActive: true,
        },
        { upsert: true, new: true },
      );
      results.success++;
    } catch (err) {
      results.errors.push({ row: headerRow + i + 1, message: err.message });
    }
  }
  return results;
};

// ─── Sinh viên ───
export const getSinhViens = (query, pagination) => {
  const filter = {};
  if (query.khoaId) filter.khoaId = query.khoaId;
  if (query.boMonId) filter.boMonId = query.boMonId;
  if (query.lopId) filter.lopId = query.lopId;
  if (query.isActive !== 'all') filter.isActive = query.isActive !== 'false';
  if (query.search) {
    filter.$or = [
      { fullName: { $regex: query.search, $options: 'i' } },
      { maSV: { $regex: query.search, $options: 'i' } },
      { email: { $regex: query.search, $options: 'i' } },
    ];
  }
  return paginate(SinhVien, filter, pagination, [
    { path: 'khoaId', select: 'code name' },
    { path: 'boMonId', select: 'code name' },
    { path: 'lopId', select: 'code name' },
  ]);
};

export const createSinhVien = async (data) => {
  const lop = await Lop.findById(data.lopId);
  if (!lop) throw new ValidationError('Lớp không tồn tại');
  return SinhVien.create({
    ...data,
    maSV: data.maSV.toUpperCase(),
    khoaId: data.khoaId || lop.khoaId,
    boMonId: data.boMonId || lop.boMonId,
  });
};

export const updateSinhVien = async (id, data) => {
  const doc = await SinhVien.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .populate('khoaId', 'code name')
    .populate('boMonId', 'code name')
    .populate('lopId', 'code name');
  if (!doc) throw new NotFoundError('Không tìm thấy sinh viên');
  return doc;
};

export const deleteSinhVien = (id) => softDelete(SinhVien, id);

export const importSinhViens = async (buffer, defaults = {}) => {
  const { rows, headerRow } = parseRows(buffer);
  const results = { success: 0, errors: [] };

  let defaultLop = null;
  if (defaults.lopId) {
    defaultLop = await Lop.findOne({ _id: defaults.lopId, isActive: true });
  }

  for (let i = 0; i < rows.length; i++) {
    const map = toRowMap(rows[i]);
    if (isEmptyRow(map)) continue;
    const lopCode = cell(map, 'lopCode', 'maLop', 'malop', 'ma lop', 'Mã lớp', 'Lop', 'Lớp', 'MaLop').toUpperCase();
    const maSV = cell(map, 'maSV', 'masv', 'ma sv', 'Mã SV', 'MaSV', 'Ma SV').toUpperCase();
    const fullName = cell(map, 'fullName', 'hoTen', 'hoten', 'ho ten', 'Họ tên', 'HoTen', 'ten', 'Tên');

    let lop = defaultLop;
    if (!lop && lopCode) {
      lop = await Lop.findOne({ code: lopCode, isActive: true });
    }

    if (!lop) {
      pushImportError(results, headerRow + i + 1, 'MISSING_LOP', 'Chưa xác định được lớp', {
        name: lopCode || cell(map, 'lop', 'Lop'),
      });
      continue;
    }
    if (!maSV || !fullName) {
      pushImportError(results, headerRow + i + 1, 'MISSING_FIELDS', 'Thiếu mã SV hoặc họ tên');
      continue;
    }
    try {
      await SinhVien.findOneAndUpdate(
        { maSV },
        {
          maSV,
          fullName,
          email: cell(map, 'email', 'Email').toLowerCase(),
          phone: cell(map, 'phone', 'sdt', 'SDT', 'SĐT'),
          khoaId: lop.khoaId,
          boMonId: lop.boMonId,
          lopId: lop._id,
          isActive: true,
        },
        { upsert: true, new: true },
      );
      results.success++;
    } catch (err) {
      results.errors.push({ row: headerRow + i + 1, message: err.message });
    }
  }
  return results;
};

// ─── Giảng viên ───
export const getGiangViens = (query, pagination) => {
  const filter = {};
  if (query.khoaId) filter.khoaId = query.khoaId;
  if (query.boMonId) filter.boMonId = query.boMonId;
  if (query.isActive !== 'all') filter.isActive = query.isActive !== 'false';
  if (query.search) {
    filter.$or = [
      { fullName: { $regex: query.search, $options: 'i' } },
      { maGV: { $regex: query.search, $options: 'i' } },
      { email: { $regex: query.search, $options: 'i' } },
    ];
  }
  return paginate(GiangVien, filter, pagination, [
    { path: 'khoaId', select: 'code name' },
    { path: 'boMonId', select: 'code name' },
  ]);
};

export const createGiangVien = async (data) => {
  const boMon = await BoMon.findById(data.boMonId);
  if (!boMon) throw new ValidationError('Bộ môn không tồn tại');
  return GiangVien.create({
    ...data,
    maGV: data.maGV.toUpperCase(),
    khoaId: data.khoaId || boMon.khoaId,
  });
};

export const updateGiangVien = async (id, data) => {
  const doc = await GiangVien.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .populate('khoaId', 'code name')
    .populate('boMonId', 'code name');
  if (!doc) throw new NotFoundError('Không tìm thấy giảng viên');
  return doc;
};

export const deleteGiangVien = (id) => softDelete(GiangVien, id);

const resolveBoMonForImport = async (fields, defaults = {}) => {
  if (defaults.boMonId) {
    const fromDefault = await BoMon.findOne({ _id: defaults.boMonId, isActive: true });
    if (fromDefault) return fromDefault;
  }

  let khoa = null;
  if (fields.khoaCode) {
    khoa = await Khoa.findOne({ code: fields.khoaCode, isActive: true });
  } else if (defaults.khoaId) {
    khoa = await Khoa.findOne({ _id: defaults.khoaId, isActive: true });
  } else if (fields.khoaName) {
    const khoas = await Khoa.find({ isActive: true });
    khoa = findEntityByNormalizedName(khoas, fields.khoaName);
    if (!khoa) {
      khoa = await Khoa.findOne({
        name: { $regex: new RegExp(escapeRegex(fields.khoaName), 'i') },
        isActive: true,
      });
    }
  }

  if (fields.boMonCode) {
    if (khoa) {
      const scoped = await BoMon.findOne({ khoaId: khoa._id, code: fields.boMonCode, isActive: true });
      if (scoped) return scoped;
    }
    const global = await BoMon.findOne({ code: fields.boMonCode, isActive: true });
    if (global) return global;
  }

  if (fields.boMonName) {
    const filter = { isActive: true };
    if (khoa) filter.khoaId = khoa._id;
    const boMons = await BoMon.find(filter);
    const matched = findEntityByNormalizedName(boMons, fields.boMonName);
    if (matched) return matched;

    if (khoa) {
      const allBoMons = await BoMon.find({ isActive: true });
      return findEntityByNormalizedName(allBoMons, fields.boMonName);
    }
  }

  return null;
};

export const importGiangViens = async (buffer, defaults = {}) => {
  const { rows, detectedHeaders, headerRow } = parseRows(buffer);
  const results = { success: 0, errors: [], detectedHeaders, headerRow };

  for (let i = 0; i < rows.length; i++) {
    const map = toRowMap(rows[i]);
    if (isEmptyRow(map)) continue;
    const fields = giangVienRowFields(map);

    if (!fields.maGV || !fields.fullName) {
      pushImportError(results, headerRow + i + 1, 'MISSING_FIELDS', 'Thiếu mã GV hoặc họ tên');
      continue;
    }

    const boMon = await resolveBoMonForImport(fields, defaults);
    if (!boMon) {
      pushImportError(results, headerRow + i + 1, 'MISSING_BOMON', 'Chưa có bộ môn trong hệ thống', {
        name: fields.boMonName || fields.boMonCode,
      });
      continue;
    }

    try {
      await GiangVien.findOneAndUpdate(
        { maGV: fields.maGV },
        {
          maGV: fields.maGV,
          fullName: fields.fullName,
          email: fields.email,
          phone: fields.phone,
          khoaId: boMon.khoaId,
          boMonId: boMon._id,
          isActive: true,
        },
        { upsert: true, new: true },
      );
      results.success++;
    } catch (err) {
      results.errors.push({ row: headerRow + i + 1, message: err.message });
    }
  }

  if (results.success === 0 && results.errors.length > 1) {
    const firstMsg = results.errors[0].message;
    if (results.errors.every((e) => e.message === firstMsg)) {
      results.errors = [{ row: results.errors[0].row, message: `${firstMsg} (${results.errors.length} dòng)` }];
    }
  }

  return results;
};

// ─── Quyền ───
export const getQuyens = (query, pagination) => {
  const filter = {};
  if (query.isActive !== 'all') filter.isActive = query.isActive !== 'false';
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { code: { $regex: query.search, $options: 'i' } },
    ];
  }
  return paginate(Quyen, filter, pagination);
};

export const getAllQuyens = () => Quyen.find({ isActive: true }).sort({ name: 1 });

export const createQuyen = (data) => Quyen.create(data);

export const updateQuyen = async (id, data) => {
  const doc = await Quyen.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!doc) throw new NotFoundError('Không tìm thấy quyền');
  return doc;
};

export const deleteQuyen = (id) => softDelete(Quyen, id);

// ─── Gán quyền GV ───
export const getGiangVienQuyens = (query, pagination) => {
  const filter = {};
  if (query.giangVienId) filter.giangVienId = query.giangVienId;
  if (query.isActive !== 'all') filter.isActive = query.isActive !== 'false';
  return paginate(GiangVienQuyen, filter, pagination, [
    { path: 'giangVienId', select: 'maGV fullName' },
    { path: 'quyenId', select: 'code name' },
    { path: 'khoaId', select: 'code name' },
    { path: 'boMonId', select: 'code name' },
  ]);
};

export const assignGiangVienQuyen = async (data) => {
  const gv = await GiangVien.findById(data.giangVienId);
  const quyen = await Quyen.findById(data.quyenId);
  if (!gv) throw new ValidationError('Giảng viên không tồn tại');
  if (!quyen) throw new ValidationError('Quyền không tồn tại');
  return GiangVienQuyen.create({
    giangVienId: data.giangVienId,
    quyenId: data.quyenId,
    khoaId: data.khoaId || gv.khoaId,
    boMonId: data.boMonId || gv.boMonId,
  });
};

export const revokeGiangVienQuyen = async (id) => {
  const doc = await GiangVienQuyen.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!doc) throw new NotFoundError('Không tìm thấy bản ghi phân quyền');
  return doc;
};
