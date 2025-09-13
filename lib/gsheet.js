// lib/gsheet.js
import { google } from 'googleapis';

export const runtime = 'nodejs'; // đảm bảo không chạy Edge

function getJwtAuth() {
    const email =
        process.env.GOOGLE_CLIENT_EMAIL ||
        process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    let key = process.env.GOOGLE_PRIVATE_KEY || '';

    if (!email || !key) {
        throw new Error('Missing GOOGLE_CLIENT_EMAIL/GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY');
    }

    // chuẩn hoá private key
    key = key.replace(/\\n/g, '\n').replace(/^"(.*)"$/s, '$1').replace(/^'(.*)'$/s, '$1').trim();
    if (!key.startsWith('-----BEGIN PRIVATE KEY-----')) {
        throw new Error('Invalid GOOGLE_PRIVATE_KEY');
    }

    return new google.auth.JWT({
        email,
        key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
}

async function getSheets() {
    const auth = getJwtAuth();
    await auth.authorize();
    return google.sheets({ version: 'v4', auth });
}

function idxToA1(n) {
    let s = '';
    while (n > 0) {
        const m = (n - 1) % 26;
        s = String.fromCharCode(65 + m) + s;
        n = Math.floor((n - 1) / 26);
    }
    return s;
}

const DEFAULT_HEADERS = [
    'Timestamp',    // ISO
    'FullName',
    'Email',
    'CCCD',
    'Phone',
    'DOB',          // yyyy-mm-dd
    'QuizScore',
    'EssayScore',
    'TotalScore',
    'EssayLength',  // số ký tự đã lưu (nếu có)
    'EssayContent', // chỉ lưu nếu đạt ngưỡng dòng
];

async function readSheet({ spreadsheetId, sheetName }) {
    const sheets = await getSheets();
    const rangeAll = `${sheetName}!A1:Z`;
    const getRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: rangeAll,
        majorDimension: 'ROWS',
    });

    const rows = getRes.data.values || [];
    let headers = rows[0] || [];

    // Đảm bảo header theo schema (bổ sung/ghi đè tên cột)
    let changed = false;
    DEFAULT_HEADERS.forEach((h, i) => {
        if (headers[i] !== h) { headers[i] = h; changed = true; }
    });
    if (rows.length === 0 || changed) {
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${sheetName}!A1:${idxToA1(DEFAULT_HEADERS.length)}1`,
            valueInputOption: 'RAW',
            requestBody: { values: [headers] },
        });
    }

    return { sheets, rows: rows.length ? rows : [headers], headers };
}

/**
 * Upsert đầy đủ 1 dòng kết quả (append nếu chưa có, update nếu trùng Email+CCCD).
 * EssayContent chỉ được lưu khi số dòng >= essayLinesThreshold.
 */
export async function upsertExamResultToSheet(p) {
    const {
        spreadsheetId,
        sheetName = 'Sheet1',
        fullName,
        email,
        cccd,
        phone = '',
        dob = '',
        quizScore = 0,
        essayScore = 0,
        totalScore = 0,
        essayContent = '',
        essayLinesThreshold = 1500, // lưu “toàn văn” khi số DÒNG >= ngưỡng
    } = p || {};

    if (!spreadsheetId) throw new Error('Missing spreadsheetId');
    if (!email || !cccd) throw new Error('Missing email/cccd');

    const { sheets, rows, headers } = await readSheet({ spreadsheetId, sheetName });

    const col = (name) => headers.indexOf(name);
    const cEmail = col('Email');
    const cCCCD = col('CCCD');

    // tìm dòng trùng email + cccd
    let foundRowIdx = -1;
    for (let r = 1; r < rows.length; r++) {
        const row = rows[r] || [];
        const emailCell = (row[cEmail] || '').toString().trim().toLowerCase();
        const cccdCell = (row[cCCCD] || '').toString().trim();
        if (emailCell === String(email).trim().toLowerCase() && cccdCell === String(cccd).trim()) {
            foundRowIdx = r;
            break;
        }
    }

    // Chỉ lưu EssayContent khi đủ "số dòng"
    const essayLines = String(essayContent || '').split(/\r?\n/).length;
    const essayToStore = essayLines >= essayLinesThreshold ? String(essayContent || '') : '';
    const timestamp = new Date().toISOString();
    const dobStr = dob ? new Date(dob).toISOString().slice(0, 10) : '';

    const rowData = [
        timestamp,
        fullName || '',
        email || '',
        cccd || '',
        phone || '',
        dobStr,
        Number(quizScore) || 0,
        Number(essayScore) || 0,
        Number(totalScore) || 0,
        (essayToStore || '').length,
        essayToStore,
    ];

    if (foundRowIdx === -1) {
        // append
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `${sheetName}!A1`,
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            requestBody: { values: [rowData] },
        });
    } else {
        // cập nhật toàn bộ dòng
        const rowNumber = foundRowIdx + 1;
        const endCol = idxToA1(DEFAULT_HEADERS.length);
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${sheetName}!A${rowNumber}:${endCol}${rowNumber}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [rowData] },
        });
    }

    return { ok: true };
}

/**
 * Chỉ UPDATE một số cột (ví dụ cập nhật QuizScore & TotalScore sau khi nộp trắc nghiệm),
 * và CHỈ làm nếu đã tồn tại dòng trùng Email+CCCD (không tự append).
 */
export async function updateExamResultColumns({ spreadsheetId, sheetName = 'Sheet1', email, cccd, updates }) {
    if (!spreadsheetId) throw new Error('Missing spreadsheetId');
    if (!email || !cccd) throw new Error('Missing email/cccd');

    const { sheets, rows, headers } = await readSheet({ spreadsheetId, sheetName });

    const col = (name) => headers.indexOf(name);
    const cEmail = col('Email');
    const cCCCD = col('CCCD');

    // tìm dòng
    let foundRowIdx = -1;
    for (let r = 1; r < rows.length; r++) {
        const row = rows[r] || [];
        const emailCell = (row[cEmail] || '').toString().trim().toLowerCase();
        const cccdCell = (row[cCCCD] || '').toString().trim();
        if (emailCell === String(email).trim().toLowerCase() && cccdCell === String(cccd).trim()) {
            foundRowIdx = r;
            break;
        }
    }

    if (foundRowIdx === -1) {
        return { ok: false, notFound: true };
    }

    // lấy row hiện tại, pad đủ độ dài
    const current = Array.from({ length: headers.length }, (_, i) => (rows[foundRowIdx] || [])[i] ?? '');

    // cập nhật cột theo "updates"
    Object.entries(updates || {}).forEach(([k, v]) => {
        const ci = col(k);
        if (ci >= 0) current[ci] = v;
    });

    // luôn cập nhật Timestamp cho dễ truy vết
    const cTs = col('Timestamp');
    if (cTs >= 0) current[cTs] = new Date().toISOString();

    const rowNumber = foundRowIdx + 1;
    const endCol = idxToA1(headers.length);
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A${rowNumber}:${endCol}${rowNumber}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [current] },
    });

    return { ok: true, row: rowNumber };
}
