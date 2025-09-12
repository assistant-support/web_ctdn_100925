// auth.js
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config.js";
import connectDB from "./lib/mongodb.js";

function maskNationalId(n) {
  const s = String(n || "").replace(/\D/g, "");
  if (s.length !== 12) return "";
  return `${s.slice(0, 4)}******${s.slice(-2)}`;
}

const nextAuth = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  trustHost: true,

  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email hoặc CCCD", type: "text" },
        password: { label: "Mật khẩu", type: "password" },
      },
      async authorize({ email, password }) {
        if (!email || !password) return null;
        await connectDB();

        const [
          { getByEmailOrNationalId, verifyPassword },
          { LoginAttempt },
          secMod,
        ] = await Promise.all([
          import("./model/account.model.js"),
          import("./model/security.model.js"),
          import("./lib/security.js"),
        ]);

        const ip = await secMod.getClientIP();
        const identifier = String(email).toLowerCase();

        // chặn brute-force 10'
        const since = new Date(Date.now() - 10 * 60 * 1000);
        const [ipFails, idFails] = await Promise.all([
          LoginAttempt.countDocuments({ ip, ok: false, at: { $gte: since } }),
          LoginAttempt.countDocuments({ identifier, ok: false, at: { $gte: since } }),
        ]);
        if (ipFails >= 20 || idFails >= 7) return null;

        // tìm theo email HOẶC CCCD (kèm passwordHash để verify)
        const user = await getByEmailOrNationalId(identifier, true);
        if (!user) {
          await LoginAttempt.create({ ip, identifier, ok: false });
          return null;
        }

        let ok = false;
        if (user.passwordHash) {
          ok = await verifyPassword(password, user.passwordHash);
        } else if (user.password) {
          const bcrypt = (await import("bcryptjs")).default;
          ok = await bcrypt.compare(password, user.password || "");
        }
        if (!ok) {
          await LoginAttempt.create({ ip, identifier, ok: false });
          return null;
        }

        // LƯU Ý: KHÔNG trả CCCD thô cho NextAuth
        const nationalIdMasked = maskNationalId(user.nationalId);

        return {
          id: String(user._id),
          name: user.fullName || user.name || (user.email?.split?.("@")[0]) || "User",
          email: user.email,
          image: user.avatar,
          username: user.username,
          role: "user",
          provider: "credentials",
          status: "active",
          dob: user.dob ? user.dob.toISOString().split('T')[0] : null,
          // các thông tin thêm cho JWT/session (an toàn)
          phone: user.phone || null,
          nationalIdMasked,
        };
      },
    }),
  ],

  callbacks: {
    async signIn() { return true; },

    async jwt({ token, user }) {
      // Lần đăng nhập đầu tiên: merge thông tin từ "user" (đã che CCCD)
      if (user) {
        token.uid = user.id;
        token.username = user.username;
        token.role = user.role ?? "user";
        token.status = user.status ?? "active";
        token.dob = user.dob ?? null;
        // bổ sung để đưa lên session
        token.name = user.name || token.name;
        token.email = user.email || token.email;
        token.phone = user.phone ?? null;
        token.nationalIdMasked = user.nationalIdMasked ?? "";
      }
      return token;
    },

    async session({ session, token }) {
      // luôn đảm bảo tồn tại session.user
      session.user = session.user || {};

      // các trường cơ bản
      session.user.id = token.uid;
      session.user.username = token.username;
      session.user.role = token.role || "user";
      session.user.status = token.status || "active";

      // thông tin hiển thị
      session.user.name = token.name || session.user.name || "";
      session.user.email = token.email || session.user.email || "";
      session.user.phone = token.phone ?? null;
      session.user.dob = token.dob ?? null;
      // CHỈ trả về bản che của CCCD
      session.user.nationalIdMasked = token.nationalIdMasked || "";

      return session;
    },

    // Không ép redirect sau sign-in
    async redirect({ url, baseUrl }) {
      try {
        const u = new URL(url);
        if (u.origin === baseUrl) return url;
      } catch { }
      return baseUrl;
    },
  },
});

export const { handlers, auth, signIn, signOut } = nextAuth;
