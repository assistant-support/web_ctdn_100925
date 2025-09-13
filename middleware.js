import { auth } from "@/auth";

export default auth((req) => {
    const { pathname } = req.nextUrl;
    // Cho phép truy cập trang chủ "/"
    if (!req.auth && pathname !== "/") {
        return Response.redirect(new URL("/", req.nextUrl));
    }
});

// Chạy middleware cho mọi route, trừ asset/static mặc định
export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};