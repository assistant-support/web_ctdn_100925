// auth.config.js
export const authConfig = {
    pages: { signIn: "/login" },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const { pathname } = nextUrl;
            if (pathname.startsWith("/thi")) return isLoggedIn;
            if (pathname === "/login" && isLoggedIn) {
                return Response.redirect(new URL("/", nextUrl));
            }
            return true;
        },
    },
};
