// model/account.model.js
import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/* ========== Validate helpers ========== */
export function normalizePhone(input) {
    const s = String(input || '').replace(/\D/g, '');
    if (s.startsWith('84')) return '0' + s.slice(2);
    if (s.startsWith('0')) return s;
    if (s.length === 9) return '0' + s;
    return s;
}
export function isValidVNPhone(input) {
    const p = normalizePhone(input);
    return /^(0)(3|5|7|8|9)\d{8}$/.test(p);
}
export function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}
export function isValidCCCD(n) {
    return /^\d{12}$/.test(String(n || '').trim());
}

/* ========== Exam sub-schemas (tối giản) ========== */
const ChoiceOrderSchema = new Schema(
    {
        questionId: { type: String, required: true },
        order: { type: [Number], required: true },
    },
    { _id: false }
);

const ResponseSchema = new Schema(
    {
        questionId: { type: String, required: true },
        selectedIndex: { type: Number, required: true, min: 0, max: 3 },
        selectedAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const QuizSchema = new Schema(
    {
        status: { type: String, enum: ['not_started', 'in_progress', 'submitted'], default: 'not_started' },
        startedAt: { type: Date },
        submittedAt: { type: Date },
        questionIds: { type: [String], default: [] },
        choiceOrders: { type: [ChoiceOrderSchema], default: [] },
        responses: { type: [ResponseSchema], default: [] },
        score: { type: Number, default: 0, min: 0, max: 40 },
        locked: { type: Boolean, default: false },
    },
    { _id: false }
);

const EssayAttemptSchema = new Schema(
    {
        content: { type: String, required: true },
        submittedAt: { type: Date, default: Date.now },
        score: { type: Number, default: 0, min: 0, max: 60 },
        comment: { type: String },
    },
    { _id: false }
);

const EssaySchema = new Schema(
    {
        attempts: { type: [EssayAttemptSchema], default: [] },
        bestScore: { type: Number, default: 0, min: 0, max: 60 },
    },
    { _id: false }
);

/* ========== Account schema (tối giản) ========== */
const AccountSchema = new Schema(
    {
        fullName: { type: String, required: true, trim: true },
        email: {
            type: String, required: true, lowercase: true, trim: true, unique: true, index: true,
            validate: { validator: isValidEmail, message: 'Email không hợp lệ.' },
        },
        passwordHash: { type: String, required: true, select: false },
        dob: { type: Date, required: true },
        nationalId: {
            type: String, required: true, trim: true, unique: true, index: true,
            validate: { validator: isValidCCCD, message: 'CCCD phải gồm 12 chữ số.' },
        },
        phone: {
            type: String, required: true, unique: true, index: true,
            set: (v) => normalizePhone(v),
            validate: { validator: isValidVNPhone, message: 'Số điện thoại không hợp lệ.' },
        },

        exam: {
            quiz: { type: QuizSchema, default: () => ({}) },
            essay: { type: EssaySchema, default: () => ({}) },
            totalScore: { type: Number, default: 0, min: 0, max: 100 },
        },
    },
    { timestamps: true }
);

// Giới hạn 3 bài tự luận
AccountSchema.path('exam.essay.attempts').validate(function (arr) {
    return !arr || arr.length <= 3;
}, 'Phần tự luận chỉ được nộp tối đa 3 lần.');

AccountSchema.pre('save', function (next) {
    if (this.exam?.quiz?.score > 40) this.exam.quiz.score = 40;
    if (this.exam?.essay?.bestScore > 60) this.exam.essay.bestScore = 60;
    const quiz = this.exam?.quiz?.score ?? 0;
    const essay = this.exam?.essay?.bestScore ?? 0;
    this.exam.totalScore = Math.max(0, Math.min(100, quiz + essay));
    next();
});

/* ========== Statics (tối giản) ========== */
AccountSchema.statics.findByEmailOrNationalId = function (identifier, withPassword = false) {
    const raw = String(identifier || '').trim();
    const isCccd = isValidCCCD(raw);
    const query = isCccd ? { nationalId: raw } : { email: raw.toLowerCase() };
    const q = this.findOne(query);
    if (withPassword) q.select('+passwordHash');
    return q.exec();
};

AccountSchema.statics.createAccountStrict = async function (p) {
    if (!p.fullName?.trim()) throw new Error('Vui lòng nhập Họ tên.');
    if (!isValidEmail(p.email)) throw new Error('Email không hợp lệ.');
    if (!isValidCCCD(p.nationalId)) throw new Error('CCCD phải gồm 12 chữ số.');
    if (!isValidVNPhone(p.phone)) throw new Error('Số điện thoại không hợp lệ.');
    if (!p.password || p.password.length < 8) throw new Error('Mật khẩu tối thiểu 8 ký tự.');
    if (!p.dob) throw new Error('Vui lòng nhập Ngày sinh.');
    const dob = new Date(p.dob);
    if (isNaN(dob.getTime())) throw new Error('Ngày sinh không hợp lệ.');
    if (dob > new Date()) throw new Error('Ngày sinh không được ở tương lai.');

    const email = String(p.email).toLowerCase().trim();
    const nationalId = String(p.nationalId).trim();
    const phone = normalizePhone(p.phone);

    const dup = await Account.findOne({ $or: [{ email }, { nationalId }, { phone }] }).lean();
    if (dup) {
        if (dup.email === email) throw new Error('Email đã được sử dụng.');
        if (dup.nationalId === nationalId) throw new Error('CCCD đã được sử dụng.');
        if (dup.phone === phone) throw new Error('Số điện thoại đã được sử dụng.');
        throw new Error('Thông tin đã tồn tại.');
    }

    const passwordHash = await bcrypt.hash(p.password, 10);

    return Account.create({
        fullName: p.fullName.trim(),
        email,
        passwordHash,
        dob,
        nationalId,
        phone,
        exam: { quiz: { status: 'not_started' }, essay: { attempts: [], bestScore: 0 }, totalScore: 0 },
    });
};

AccountSchema.statics.verifyPassword = async function (raw, storedHash) {
    if (storedHash?.startsWith?.('scrypt$')) {
        const parts = storedHash.split('$');
        const salt = Buffer.from(parts[4], 'base64');
        const hash = Buffer.from(parts[5], 'base64');
        const params = { N: parseInt(parts[1]), r: parseInt(parts[2]), p: parseInt(parts[3]) };
        const derived = crypto.scryptSync(raw, salt, hash.length, { N: params.N, r: params.r, p: params.p });
        return crypto.timingSafeEqual(hash, derived);
    }
    return bcrypt.compare(raw, storedHash);
};

export const Account = mongoose.models.Account || mongoose.model('Account', AccountSchema);

/* ========== Helper exports cho actions ========== */
export async function createAccount(p) { return Account.createAccountStrict(p); }
export function getByEmailOrNationalId(identifier, withPassword = true) {
    return Account.findByEmailOrNationalId(identifier, withPassword);
}
export function verifyPassword(raw, storedHash) { return Account.verifyPassword(raw, storedHash); }
