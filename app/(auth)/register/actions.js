"use server";

import connectDB from "@/lib/mongodb";
import { signIn } from "@/auth";
import { createAccount } from "@/model/account.model";
import { RegisterLog } from "@/model/security.model";
import { getClientIP, getOrSetDeviceId } from "@/lib/security";

export async function registerAction(prevState, formData) {
    await connectDB();

    const ip = await getClientIP();            // ⬅️ await
    const deviceId = await getOrSetDeviceId(); // ⬅️ await

    const now = new Date();
    const windowStart = new Date(now.getTime() - 60 * 60 * 1000);

    const [ipCount, deviceCount] = await Promise.all([
        RegisterLog.countDocuments({ ip, at: { $gte: windowStart } }),
        RegisterLog.countDocuments({ deviceId, at: { $gte: windowStart } }),
    ]);

    const IP_MAX_PER_HOUR = 5;
    const DEVICE_MAX_PER_HOUR = 3;

    if (ipCount >= IP_MAX_PER_HOUR) {
        return { ok: false, error: `Mỗi địa chỉ IP chỉ được đăng ký tối đa ${IP_MAX_PER_HOUR} tài khoản trong 1 giờ.` };
    }
    if (deviceCount >= DEVICE_MAX_PER_HOUR) {
        return { ok: false, error: `Trình duyệt này đã đăng ký quá nhiều tài khoản trong 1 giờ. Vui lòng thử lại sau.` };
    }

    const payload = {
        fullName: String(formData.get("fullName") || ""),
        email: String(formData.get("email") || "").toLowerCase(),
        password: String(formData.get("password") || ""),
        dob: String(formData.get("dob") || ""),
        nationalId: String(formData.get("nationalId") || ""),
        phone: String(formData.get("phone") || ""),
    };

    try {
        const acc = await createAccount(payload);

        await RegisterLog.create({ ip, deviceId, email: acc.email, at: new Date() });

        // Đăng nhập NGAY nhưng KHÔNG redirect — để Header tự cập nhật sau router.refresh()
        await signIn("credentials", {
            email: acc.email,
            password: payload.password,
            // với NextAuth v5, bỏ redirectTo; nếu cần có thể thêm redirect: false
            redirect: false,
        });

        return { ok: true };
    } catch (err) {
        const msg =
            err?.code === 11000
                ? "Thông tin đã tồn tại."
                : (err?.message || "Đăng ký không thành công.");
        return { ok: false, error: msg };
    }
}
