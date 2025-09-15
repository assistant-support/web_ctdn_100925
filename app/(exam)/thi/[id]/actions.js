'use server';
const runtime = 'nodejs';

import connectDB from '@/lib/mongodb';
import { Account } from '@/model/account.model';
import { getExamConfig } from '@/lib/examConfig';
import { google } from 'googleapis';
import { auth } from '@/auth';
// ⚠️ Điều chỉnh nếu đường dẫn bộ câu hỏi khác
import { QUIZ } from '@/lib/quizData';

/* =========================================================
 * Auth guard
 * =======================================================*/
async function requireSameUser(userId) {
    const session = await auth();
    const cur = session?.user?.id;
    if (!cur || String(cur) !== String(userId)) {
        return { ok: false, redirect: '/thi' };
    }
    return { ok: true, userId: cur };
}

/* =========================================================
 * Utilities: shuffle, mapping, scoring (đÃ BỎ getEndsAt cho quiz)
 * =======================================================*/
function shuffleArray(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
function makeChoiceOrder(n = 4) {
    return shuffleArray([...Array(n)].map((_, i) => i));
}
function applyChoiceOrder(choices, order) {
    return order.map((originalIdx) => choices[originalIdx]);
}
function computeQuizScore({ questionIds, choiceOrders, responses }) {
    const points = QUIZ.pointsPerCorrect || 1;
    const byId = new Map(QUIZ.questions.map((q) => [q.id, q]));
    const orderByQ = new Map(choiceOrders.map((co) => [co.questionId, co.order]));

    let correct = 0;
    (responses || []).forEach((r) => {
        const q = byId.get(r.questionId);
        if (!q) return;
        const order = orderByQ.get(r.questionId) || [0, 1, 2, 3];
        const shuffledCorrectIndex = order.indexOf(q.answerIndex);
        if (shuffledCorrectIndex === r.selectedIndex) correct += 1;
    });

    return correct * points; // cap 40 trong pre('save') của model
}

/* =========================================================
 * Google Sheets helpers (dedupe Email+CCCD; RAW I/O)
 * =======================================================*/
const SHEET_ID = '1mMSUCwAILG86HUGfGImrwAP5zYQF8fTDOJsqHI9zQNw';
const SHEET_NAME = 'Data';

const GS_HEADERS = [
    'Timestamp',
    'FullName',
    'Email',
    'CCCD',
    'Phone',
    'DOB',
    'QuizScore',
    'EssayScore',
    'TotalScore',
    'EssayContent',
];

const normEmail = (x) => String(x ?? '').trim().toLowerCase();
const normCCCD = (x) => String(x ?? '').replace(/[^\d]/g, '').trim();

function idxToA1(n) {
    let s = '';
    while (n > 0) {
        const m = (n - 1) % 26;
        s = String.fromCharCode(65 + m) + s;
        n = Math.floor((n - 1) / 26);
    }
    return s;
}

function getJwtAuth() {
    const email =
        process.env.GOOGLE_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    let key = process.env.GOOGLE_PRIVATE_KEY || '';
    if (!email || !key) throw new Error('Missing GOOGLE_* env');

    key = key
        .replace(/\\n/g, '\n')
        .replace(/^"(.*)"$/s, '$1')
        .replace(/^'(.*)'$/s, '$1')
        .trim();

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

async function ensureSheetAndHeaders() {
    const sheets = await getSheets();

    // Ensure sheet exists
    const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
    const hasSheet = meta.data.sheets?.some(
        (s) => s.properties?.title === SHEET_NAME
    );
    if (!hasSheet) {
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SHEET_ID,
            requestBody: { requests: [{ addSheet: { properties: { title: SHEET_NAME } } }] },
        });
    }

    // Read unformatted to avoid auto-format issues
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!A1:Z`,
        majorDimension: 'ROWS',
        valueRenderOption: 'UNFORMATTED_VALUE',
        dateTimeRenderOption: 'FORMATTED_STRING',
    });

    const rows = res.data.values || [];
    const headers = (rows[0] || []).map((h) => String(h).trim());

    // Ensure canonical headers
    const needHeader =
        headers.length === 0 ||
        GS_HEADERS.some((h, i) => (headers[i] || '') !== h);

    if (needHeader) {
        await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID,
            range: `${SHEET_NAME}!A1:${idxToA1(GS_HEADERS.length)}1`,
            valueInputOption: 'RAW',
            requestBody: { values: [GS_HEADERS] },
        });
        return { sheets, headers: GS_HEADERS, rows: [GS_HEADERS] };
    }

    return { sheets, headers, rows };
}

function findRowIndexByEmailCCCD(rows, headers, email, cccd) {
    const cEmail = headers.indexOf('Email');
    const cCCCD = headers.indexOf('CCCD');
    if (cEmail < 0 || cCCCD < 0) return -1;

    const kEmail = normEmail(email);
    const kCCCD = normCCCD(cccd);

    for (let r = 1; r < rows.length; r++) {
        const row = rows[r] || [];
        const vEmail = normEmail(row[cEmail] ?? '');
        const vCCCD = normCCCD(row[cCCCD] ?? '');
        if (vEmail && vCCCD && vEmail === kEmail && vCCCD === kCCCD) return r; // 0-based
    }
    return -1;
}

/** Upsert toàn hàng khi nộp tự luận (ghi đè nếu trùng, append nếu chưa có) */
async function upsertEssayRow({
    fullName,
    email,
    cccd,
    phone = '',
    dob = '',
    quizScore = 0,
    essayScore = 0,
    totalScore = 0,
    essayContent = '',
}) {
    const { sheets, headers, rows } = await ensureSheetAndHeaders();

    const ts = new Date().toISOString();
    const dobStr = dob ? new Date(dob).toISOString().slice(0, 10) : '';

    const rowData = [
        ts,
        String(fullName ?? ''),
        normEmail(email),
        normCCCD(cccd),
        String(phone ?? ''),
        dobStr,
        Number(quizScore) || 0,
        Number(essayScore) || 0,
        Number(totalScore) || 0,
        String(essayContent ?? ''),
    ];

    const foundIdx = findRowIndexByEmailCCCD(rows, headers, email, cccd);
    if (foundIdx === -1) {
        await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: `${SHEET_NAME}!A1`,
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            requestBody: { values: [rowData] },
        });
    } else {
        const rowNumber = foundIdx + 1;
        const endCol = idxToA1(GS_HEADERS.length);
        await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID,
            range: `${SHEET_NAME}!A${rowNumber}:${endCol}${rowNumber}`,
            valueInputOption: 'RAW',
            requestBody: { values: [rowData] },
        });
    }
}

/** Chỉ update điểm quiz/total nếu dòng đã tồn tại */
async function updateQuizColumnsIfExists({
    email,
    cccd,
    quizScore = 0,
    totalScore = 0,
}) {
    const { sheets, headers, rows } = await ensureSheetAndHeaders();
    const rowIdx = findRowIndexByEmailCCCD(rows, headers, email, cccd);
    if (rowIdx === -1) return { ok: false, notFound: true };

    const row = Array.from(
        { length: headers.length },
        (_, i) => (rows[rowIdx] || [])[i] ?? ''
    );

    const cTs = headers.indexOf('Timestamp');
    const cQuiz = headers.indexOf('QuizScore');
    const cTotal = headers.indexOf('TotalScore');

    if (cTs >= 0) row[cTs] = new Date().toISOString();
    if (cQuiz >= 0) row[cQuiz] = Number(quizScore) || 0;
    if (cTotal >= 0) row[cTotal] = Number(totalScore) || 0;

    const rowNumber = rowIdx + 1;
    const endCol = idxToA1(headers.length);
    await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!A${rowNumber}:${endCol}${rowNumber}`,
        valueInputOption: 'RAW',
        requestBody: { values: [row] },
    });

    return { ok: true };
}

/* =========================================================
 * ACTIONS
 * =======================================================*/

/** Entry cho trang thi */
export async function getExamEntry({ userId, mode }) {
    const gate = await requireSameUser(userId);
    if (!gate.ok) return gate;

    await connectDB();
    const acc = await Account.findById(userId).lean();
    if (!acc) return { ok: false, redirect: '/thi' };

    const cfg = getExamConfig();

    if (mode === 'quiz') {
        const qz = acc.exam?.quiz || {};
        if (qz.status === 'submitted') {
            return { ok: true, stage: 'submitted', mode: 'quiz', score: qz.score ?? 0 };
        }

        if (qz.status === 'in_progress' && qz.startedAt) {
            const byId = new Map(QUIZ.questions.map((q) => [q.id, q]));
            const orderByQ = new Map((qz.choiceOrders || []).map((co) => [co.questionId, co.order]));
            const questions = (qz.questionIds || [])
                .map((id) => {
                    const q = byId.get(id);
                    if (!q) return null;
                    const order = orderByQ.get(id) || [0, 1, 2, 3];
                    return { id, text: q.text, choices: applyChoiceOrder(q.choices, order) };
                })
                .filter(Boolean);

            return {
                ok: true,
                stage: 'in_progress',
                mode: 'quiz',
                quiz: {
                    questions,
                    responses: qz.responses || [],
                    // endsAtISO: đã loại bỏ theo yêu cầu bỏ thời gian
                },
            };
        }

        // Not started → hiển thị nội quy
        return {
            ok: true,
            stage: 'rules',
            mode: 'quiz',
            config: {
                perAttemptCount: QUIZ.perAttemptCount,
                // Bỏ thông số thời gian cho quiz
                durationMinutes: null,
                deadlineISO: null,
            },
        };
    }

    // ESSAY
    const attempts = acc.exam?.essay?.attempts || [];
    const maxAttempts = (getExamConfig()?.essay?.maxAttempts) ?? 3;
    const attemptsLeft = Math.max(0, maxAttempts - attempts.length);
    const deadlineISO = cfg.essay.deadline ? cfg.essay.deadline.toISOString() : null;

    if (cfg.essay.deadline && new Date() > cfg.essay.deadline) {
        return { ok: true, stage: 'essay_closed', mode: 'essay' };
    }

    return {
        ok: true,
        stage: 'essay',
        mode: 'essay',
        essay: {
            attemptsLeft,
            deadlineISO,
            lastContent: attempts.length ? attempts[attempts.length - 1].content : '',
        },
    };
}

/** Bắt đầu quiz: chọn câu, trộn đáp án */
export async function startQuiz({ userId }) {
    const gate = await requireSameUser(userId);
    if (!gate.ok) return gate;

    await connectDB();
    const cfg = getExamConfig();
    const acc = await Account.findById(userId);
    if (!acc) return { ok: false, error: 'Không tìm thấy tài khoản.' };

    const qz = acc.exam?.quiz || {};
    if (qz.status === 'submitted') return { ok: false, error: 'Bạn đã nộp bài trắc nghiệm.' };
    if (qz.status === 'in_progress') return { ok: true };

    const perAttempt = Math.min(QUIZ.perAttemptCount || 20, QUIZ.questions.length);
    const picked = shuffleArray(QUIZ.questions).slice(0, perAttempt);

    acc.exam.quiz = {
        status: 'in_progress',
        startedAt: new Date(),
        submittedAt: null,
        questionIds: picked.map((q) => q.id),
        choiceOrders: picked.map((q) => ({ questionId: q.id, order: makeChoiceOrder(q.choices.length) })),
        responses: [],
        score: 0,
        locked: false,
    };

    await acc.save();
    return { ok: true };
}

/** Heartbeat */
export async function heartbeatQuiz({ userId }) {
    const gate = await requireSameUser(userId);
    if (!gate.ok) return gate;
    return { ok: true };
}

/** Lưu từng đáp án (không còn auto-submit theo thời gian) */
export async function recordQuizResponse({ userId, questionId, selectedIndex }) {
    const gate = await requireSameUser(userId);
    if (!gate.ok) return gate;

    await connectDB();
    const acc = await Account.findById(userId);
    if (!acc) return { ok: false, error: 'Không tìm thấy tài khoản.' };

    const qz = acc.exam?.quiz;
    if (!qz || qz.status !== 'in_progress') {
        return { ok: false, error: 'Bài thi chưa bắt đầu hoặc đã kết thúc.' };
    }

    // Xác định độ dài đáp án thật theo order của câu này
    const co = (qz.choiceOrders || []).find((x) => x.questionId === questionId);
    const maxChoiceIndex = ((co?.order?.length ?? 4) - 1);

    if (typeof selectedIndex !== 'number' || selectedIndex < 0 || selectedIndex > maxChoiceIndex) {
        return { ok: false, error: 'Chỉ số đáp án không hợp lệ.' };
    }
    if (!qz.questionIds?.includes?.(questionId)) {
        return { ok: false, error: 'Câu hỏi không thuộc bài thi của bạn.' };
    }

    const i = (qz.responses || []).findIndex((r) => r.questionId === questionId);
    if (i >= 0) {
        qz.responses[i].selectedIndex = selectedIndex;
        qz.responses[i].selectedAt = new Date();
    } else {
        qz.responses.push({ questionId, selectedIndex, selectedAt: new Date() });
    }

    await acc.save();
    return { ok: true };
}

/** Nộp quiz: chấm điểm, lock, cập nhật GSheet (nếu đã có dòng) – chạy GSheet ở background */
export async function submitQuiz({ userId }) {
    const gate = await requireSameUser(userId);
    if (!gate.ok) return gate;

    await connectDB();
    const acc = await Account.findById(userId);
    if (!acc) return { ok: false, error: 'Không tìm thấy tài khoản.' };

    const qz = acc.exam?.quiz;
    if (!qz) return { ok: false, error: 'Không có dữ liệu trắc nghiệm.' };
    if (qz.status === 'submitted') return { ok: true };

    const score = computeQuizScore({
        questionIds: qz.questionIds || [],
        choiceOrders: qz.choiceOrders || [],
        responses: qz.responses || [],
    });

    acc.exam.quiz.score = Math.max(0, score);
    acc.exam.quiz.status = 'submitted';
    acc.exam.quiz.submittedAt = new Date();
    acc.exam.quiz.locked = true;

    await acc.save(); // pre('save') tính totalScore

    // Fire-and-forget update GSheet nếu đã có dòng
    setTimeout(async () => {
        try {
            await updateQuizColumnsIfExists({
                email: acc.email,
                cccd: acc.nationalId,
                quizScore: acc.exam?.quiz?.score ?? 0,
                totalScore:
                    acc.exam?.totalScore ??
                    (acc.exam?.quiz?.score ?? 0) + (acc.exam?.essay?.bestScore ?? 0),
            });
        } catch (e) {
            console.error('Update GSheet (quiz) failed:', e?.message || e);
        }
    }, 0);

    return { ok: true };
}

/** Nộp/lưu tự luận (giữ nguyên deadline/attempt) */
export async function submitEssay({ userId, content }) {
    const gate = await requireSameUser(userId);
    if (!gate.ok) return gate;

    await connectDB();
    const cfg = getExamConfig();

    const acc = await Account.findById(userId);
    if (!acc) return { ok: false, error: 'Không tìm thấy tài khoản.' };

    const deadline = cfg?.essay?.deadline || null;
    if (deadline && new Date() > deadline) {
        return { ok: false, error: 'Đã quá hạn nộp bài tự luận.' };
    }

    const attempts = acc.exam?.essay?.attempts || [];
    const maxAttempts = cfg?.essay?.maxAttempts ?? 3;
    if (attempts.length >= maxAttempts) {
        return { ok: false, error: 'Bạn đã hết lượt nộp/chỉnh sửa.' };
    }

    const body = String(content || '').slice(0, 3000); // theo UI
    if (!body.trim()) return { ok: false, error: 'Nội dung bài tự luận còn trống.' };

    // 1) Save Mongo (nguồn chân lý)
    acc.exam.essay.attempts.push({ content: body, submittedAt: new Date() });
    await acc.save(); // pre('save') cập nhật totalScore (bestScore giữ nguyên nếu chưa chấm)

    // 2) Background upsert vào GSheet nếu đủ điều kiện độ dài
    if (body.length > 1500) {
        const quizScore = acc.exam?.quiz?.score ?? 0;
        const essayScore = acc.exam?.essay?.bestScore ?? 0; // có thể 0 nếu chưa chấm
        const totalScore = acc.exam?.totalScore ?? quizScore + essayScore;

        setTimeout(async () => {
            try {
                await upsertEssayRow({
                    fullName: acc.fullName,
                    email: acc.email,
                    cccd: acc.nationalId,
                    phone: acc.phone,
                    dob: acc.dob,
                    quizScore,
                    essayScore,
                    totalScore,
                    essayContent: body, // lưu nội dung gần nhất
                });
            } catch (e) {
                console.error('Sync GSheet (essay) failed:', e?.message || e);
            }
        }, 0);
    }

    return { ok: true };
}

/** Hỗ trợ API /finalize: sau cập nhật không auto-submit theo thời gian nữa */
export async function finalizeQuizIfNeededFor(userId) {
    await connectDB();
    const acc = await Account.findById(userId);
    if (!acc) return { ok: false, error: 'Không tìm thấy tài khoản.' };

    const qz = acc.exam?.quiz;
    if (!qz || qz.status !== 'in_progress' || !qz.startedAt) {
        return { ok: true, skipped: true };
    }

    // BỎ kiểm tra thời gian; không tự động nộp nữa
    return { ok: true, skipped: true };
}
