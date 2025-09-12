// lib/security.js
import { cookies as nextCookies, headers as nextHeaders } from "next/headers";
import crypto from "crypto";

const DEVICE_COOKIE = "did";
const ONE_YEAR = 60 * 60 * 24 * 365;

function sign(seed) {
    const secret = process.env.DEVICE_SECRET || process.env.NEXTAUTH_SECRET || "fallback-device-secret";
    return crypto.createHmac("sha256", secret).update(seed).digest("hex").slice(0, 16);
}

// Next.js 15: PHẢI await
export async function getClientIP() {
    const h = await nextHeaders();
    const xff = h.get("x-forwarded-for");
    if (xff) return xff.split(",")[0].trim();
    return h.get("x-real-ip") || "0.0.0.0";
}

// Next.js 15: PHẢI await
export async function getOrSetDeviceId() {
    const jar = await nextCookies();
    const cur = jar.get(DEVICE_COOKIE)?.value;
    if (cur) return cur;

    const h = await nextHeaders();
    const ua = h.get("user-agent") || "";
    const seed = `${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}:${ua}`;
    const did = `${seed}:${sign(seed)}`;

    // Được phép set trong Server Action / Route Handler
    jar.set(DEVICE_COOKIE, did, {
        httpOnly: true,
        sameSite: "lax",
        secure: true,
        path: "/",
        maxAge: ONE_YEAR,
    });

    return did;
}
