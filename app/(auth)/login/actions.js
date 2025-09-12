"use server";

import { signIn, signOut } from "@/auth";

export async function loginAction(prevState, formData) {
  const email = String(formData.get("email") || "").toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { ok: false, error: "Vui lòng nhập email và mật khẩu." };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false, // tránh auto-redirect
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "Email/CCCD hoặc mật khẩu không đúng." };
  }
}


export async function signOutAction() {
    await signOut({ redirectTo: '/' })
}