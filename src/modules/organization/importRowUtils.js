import * as XLSX from 'xlsx';

const normalizeKey = (key) =>
  String(key ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s_-]+/g, '');

/** Chuẩn hóa tên để so khớp không phân biệt dấu, hoa thường, tiền tố Khoa/Bộ môn. */
export const normalizeText = (value) =>
  normalizeKey(value).replace(/^(khoa|bomon|bomon|phongban|phong|donvi)/, '');

export const findEntityByNormalizedName = (docs, name) => {
  const target = normalizeText(name);
  if (!target) return null;

  const exact = docs.find((doc) => normalizeText(doc.name) === target);
  if (exact) return exact;

  const contains = docs.find((doc) => {
    const candidate = normalizeText(doc.name);
    return candidate.includes(target) || target.includes(candidate);
  });
  if (contains) return contains;

  const targetWords = target.match(/[a-z0-9]+/g) || [];
  if (targetWords.length === 0) return null;

  let best = null;
  let bestScore = 0;
  for (const doc of docs) {
    const candidate = normalizeText(doc.name);
    const score = targetWords.filter((word) => candidate.includes(word)).length;
    if (score > bestScore) {
      bestScore = score;
      best = doc;
    }
  }

  return bestScore >= Math.min(2, targetWords.length) ? best : null;
};

export const toRowMap = (row) => {
  const map = {};
  for (const [key, value] of Object.entries(row)) {
    if (key.startsWith('__')) continue;
    map[normalizeKey(key)] = value;
  }
  if (row.__values) {
    row.__values.forEach((value, index) => {
      map[`__col${index}`] = value;
    });
  }
  return map;
};

export const cell = (map, ...keys) => {
  for (const key of keys) {
    const value = map[normalizeKey(key)];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '';
};

export const isEmptyRow = (map) =>
  Object.entries(map)
    .filter(([key]) => !key.startsWith('__col'))
    .every(([, value]) => value === undefined || value === null || String(value).trim() === '');

const scoreHeaderRow = (row) => {
  const cells = row.map((c) => normalizeKey(c));
  let score = 0;
  for (const c of cells) {
    if (!c) continue;
    if (/^(stt|tt|no|#|so)$/.test(c)) score += 2;
    if (/ma|code|ten|name|khoa|bomon|lop|email|sdt|phone|hoten|donvi|kyhieu|viettat/.test(c)) score += 4;
  }
  const nonEmpty = row.filter((c) => String(c).trim());
  if (nonEmpty.length === 0) return -1;
  const numeric = nonEmpty.filter((c) => !Number.isNaN(Number(String(c).trim()))).length;
  if (numeric / nonEmpty.length > 0.75) score -= 6;
  return score;
};

const findHeaderRowIndex = (matrix) => {
  const maxScan = Math.min(25, matrix.length);
  let bestIdx = 0;
  let bestScore = -Infinity;
  for (let i = 0; i < maxScan; i++) {
    const score = scoreHeaderRow(matrix[i]);
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  return bestScore >= 2 ? bestIdx : 0;
};

const buildHeaderNames = (headerRow, rowIndex) => {
  const used = new Set();
  return headerRow.map((cell, colIndex) => {
    let name = String(cell ?? '').trim();
    if (!name || name.startsWith('__EMPTY')) {
      name = `Cot${colIndex + 1}`;
    }
    let unique = name;
    let n = 2;
    while (used.has(normalizeKey(unique))) {
      unique = `${name}_${n++}`;
    }
    used.add(normalizeKey(unique));
    return unique;
  });
};

export const parseExcelRows = (buffer) => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  if (!matrix.length) {
    return { rows: [], detectedHeaders: [], headerRow: 1 };
  }

  const headerRowIndex = findHeaderRowIndex(matrix);
  const headers = buildHeaderNames(matrix[headerRowIndex], headerRowIndex);
  const rows = [];

  for (let i = headerRowIndex + 1; i < matrix.length; i++) {
    const rowArr = matrix[i];
    const obj = { __values: rowArr.map((v) => (v === undefined || v === null ? '' : v)) };
    headers.forEach((header, colIndex) => {
      obj[header] = rowArr[colIndex] ?? '';
    });
    rows.push(obj);
  }

  return {
    rows,
    detectedHeaders: headers.filter((h) => !h.startsWith('Cot')),
    headerRow: headerRowIndex + 1,
  };
};

/** Lấy giá trị theo tên cột; nếu không có thì thử cột 1-2 (bỏ STT). */
export const cellWithFallback = (map, keys, colIndex) => {
  const direct = cell(map, ...keys);
  if (direct) return direct;
  const positional = map[`__col${colIndex}`];
  if (positional !== undefined && positional !== null && String(positional).trim() !== '') {
    return String(positional).trim();
  }
  return '';
};

export const giangVienRowFields = (map) => ({
  khoaCode: cell(map, 'khoaCode', 'maKhoa', 'makhoa', 'ma khoa', 'Mã khoa', 'Ma khoa').toUpperCase(),
  boMonCode: cell(map, 'boMonCode', 'maBoMon', 'mabomon', 'ma bo mon', 'Mã bộ môn', 'Ma bo mon').toUpperCase(),
  khoaName: cell(map, 'khoa', 'tenKhoa', 'tenkhoa', 'ten khoa', 'Khoa', 'Tên khoa', 'Don vi', 'don vi', 'Đơn vị'),
  boMonName: cell(map, 'boMon', 'boMon', 'bomon', 'tenBoMon', 'tenbomon', 'ten bo mon', 'Bộ môn', 'Bo mon', 'Tên bộ môn'),
  maGV: cell(map, 'maGV', 'magv', 'ma gv', 'Ma GV', 'Mã GV', 'ma').toUpperCase(),
  fullName: cell(map, 'fullName', 'hoTen', 'hoten', 'ho ten', 'Họ tên', 'Ho va ten', 'Tên', 'Ten'),
  email: cell(map, 'email', 'Email').toLowerCase(),
  phone: cell(map, 'phone', 'sdt', 'SDT', 'SĐT', 'dien thoai', 'Điện thoại', 'SoDienThoai', 'so dien thoai'),
});

export const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const khoaFields = (map, detectedHeaders = []) => {
  const headerStr = detectedHeaders.map((h) => normalizeKey(h)).join(' ');
  const wrongFile = /masv|magv|hoten|hovaten|malop|ngaysinh|namsinh|gioitinh|dienthoai|email/.test(headerStr);

  let code = cell(map,
    'code', 'ma', 'makhoa', 'makho', 'madonvi', 'madv', 'kyhieu', 'viettat',
    'Ma', 'Mã', 'Mã khoa', 'Ma khoa', 'Ký hiệu',
  );
  let name = cell(map,
    'name', 'ten', 'tenkhoa', 'tenkho', 'tendonvi', 'tendv', 'donvi', 'ten don vi',
    'Ten', 'Tên', 'Tên khoa', 'Ten khoa', 'Tên đơn vị',
  );

  if (!wrongFile) {
    const col0 = cellWithFallback(map, ['stt', 'tt'], 0);
    const col1 = cellWithFallback(map, [], 1);
    const col2 = cellWithFallback(map, [], 2);

    if (!code && !name && col1 && col2) {
      const skipStt = col0 && /^\d+$/.test(col0);
      code = skipStt ? col1 : col0;
      name = skipStt ? col2 : col1;
    } else if (!code && col1) {
      code = col1;
    } else if (!name && col2) {
      name = col2;
    }
  }

  return {
    code: code.toUpperCase(),
    name,
    wrongFile,
  };
};
