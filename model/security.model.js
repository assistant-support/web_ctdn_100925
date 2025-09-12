// model/security.model.js
import mongoose, { Schema } from "mongoose";

// ĐĂNG KÝ: log để giới hạn trong 1 giờ
const RegLogSchema = new Schema(
    {
        ip: { type: String, index: true },
        deviceId: { type: String, index: true },
        email: String,
        at: { type: Date, default: Date.now, index: true },
    },
    { versionKey: false }
);
// TTL 1 giờ
RegLogSchema.index({ at: 1 }, { expireAfterSeconds: 3600 });

export const RegisterLog =
    mongoose.models.RegisterLog || mongoose.model("RegisterLog", RegLogSchema);

// ĐĂNG NHẬP: đếm lần thất bại để chặn brute-force 10 phút
const LoginAttemptSchema = new Schema(
    {
        ip: { type: String, index: true },
        identifier: { type: String, index: true }, // email hoặc CCCD
        ok: { type: Boolean, default: false },
        at: { type: Date, default: Date.now, index: true },
    },
    { versionKey: false }
);
// TTL 10 phút
LoginAttemptSchema.index({ at: 1 }, { expireAfterSeconds: 600 });

export const LoginAttempt =
    mongoose.models.LoginAttempt || mongoose.model("LoginAttempt", LoginAttemptSchema);
