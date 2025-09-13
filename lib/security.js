// lib/security.js
import { cookies as nextCookies, headers as nextHeaders } from "next/headers";

const DEVICE_COOKIE = "did";
const ONE_YEAR = 60 * 60 * 24 * 365;

// Dùng Web Crypto ở Edge; fallback Node khi chạy Node.js
async function hmacSha256Hex(message, secret) {
    const enc = new TextEncoder();
    if (globalThis.crypto?.subtle) {
        const key = await crypto.subtle.importKey(
            "raw",
            enc.encode(secret),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
        );
        const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
        return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, "0")).join("");
    }
    // Node fallback
    const { createHmac } = await import("node:crypto");
    return createHmac("sha256", secret).update(message).digest("hex");
}

async function uuid() {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    const { randomUUID } = await import("node:crypto");
    return randomUUID();
}

async function sign(seed) {
    const secret = process.env.DEVICE_SECRET || process.env.NEXTAUTH_SECRET || "fallback-device-secret";
    const hex = await hmacSha256Hex(seed, secret);
    return hex.slice(0, 16);
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
    const seed = `${await uuid()}:${ua}`;
    const did = `${seed}:${await sign(seed)}`;

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
