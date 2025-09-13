// components/Hero.jsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback } from "react";
import { Timer, FileText, Trophy } from "lucide-react";

export default function Hero() {
    // Mở modal auth qua hash #dang-nhap (giữ nguyên cơ chế bạn đang dùng)
    const openAuth = useCallback((tab = "login") => {
        if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.hash = "dang-nhap";
            window.history.pushState({}, "", url);
            window.dispatchEvent(new CustomEvent("open-auth-modal", { detail: { tab } }));
        }
    }, []);

    // Ảnh dùng URL gốc (đã đề xuất), cần cấu hình remotePatterns trong next.config.js
    const photos = {
        main: {
            src: "https://lh3.googleusercontent.com/d/1mW37L5kMG2P9jxCGxV1uzsXWnGnAPMC5",
            alt: "Sông Đồng Nai & cây cầu bắc qua sông nhìn từ trên cao",
        },
        card1: {
            src: "https://lh3.googleusercontent.com/d/16Ax1NWzRBbjHE36ozKU3V4CvmuYvjnR1",
            alt: "Phát biểu tại chương trình giao lưu Việt–Nhật 2024 (LHU)",
        },
        card2: {
            src: "https://lh3.googleusercontent.com/d/1PszbkcaEzty8F3ub87YEkIcZC6ozwsOG",
            alt: "Trao giải tại chương trình giao lưu Việt–Nhật 2024",
        },
    };

    return (
        <section className="relative overflow-hidden border-b border-black/5 bg-gradient-to-b from-brand/10 to-white">
            {/* Decorative blobs tinh tế theo màu thương hiệu */}
            <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-brand/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-brand/20 blur-3xl" />

            <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
                {/* Left: text */}
                <div>
                    <span className="inline-flex items-center rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand ring-1 ring-brand/20">
                        Cuộc thi Tỉnh Đồng Nai
                    </span>

                    <h1 className="mt-4 text-3xl font-bold leading-tight md:text-5xl">
                        Cuộc thi “Tìm hiểu về công tác đối ngoại nhân dân tỉnh Đồng Nai 2025”
                    </h1>

                    <p className="mt-4 text-base text-slate-700 md:text-lg">
                        Thi trực tuyến gồm 2 phần: <strong>Trắc nghiệm</strong> (1 lần, 45 phút) và{" "}
                        <strong>Tự luận</strong> (lưu tối đa 3 lần). Tham gia để lan tỏa hiểu biết &amp; nhận nhiều giải thưởng.
                    </p>

                    {/* CTA – GIỮ NGUYÊN NÚT CHÍNH như bạn yêu cầu */}
                    <div className="mt-6 flex flex-wrap gap-3">
                        <button
                            onClick={() => openAuth("login")}
                            className="inline-flex items-center rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90 active:scale-[.99] transition"
                        >
                            Đăng nhập / Tham gia thi
                        </button>

                        {/* CTA phụ tinh gọn, dùng outline nhẹ */}
                        <Link href="#the-le" className="btn-outline">
                            Xem thể lệ
                        </Link>
                        <Link href="#lien-he" className="btn-outline">
                            Liên hệ
                        </Link>
                        <Link href="#faq" className="btn-outline">
                            FAQ
                        </Link>
                    </div>

                    {/* Meta badges với icon Lucide + viền rất nhạt */}
                    <ul className="mt-6 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                        <li className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 ring-1 ring-black/5">
                            <Timer className="h-4 w-4 text-brand" /> 45 phút trắc nghiệm
                        </li>
                        <li className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 ring-1 ring-black/5">
                            <FileText className="h-4 w-4 text-brand" /> Tự luận lưu 3 lần
                        </li>
                        <li className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 ring-1 ring-black/5">
                            <Trophy className="h-4 w-4 text-brand" /> Giải thưởng hấp dẫn
                        </li>
                    </ul>
                </div>

                {/* Right: image mosaic (border/ring nhẹ hơn) */}
                <div className="relative hidden md:block">
                    {/* Main card */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-white ring-1 ring-black/5 shadow-sm">
                        <Image
                            src={photos.main.src}
                            alt={photos.main.alt}
                            fill
                            sizes="(min-width: 768px) 560px, 100vw"
                            className="object-cover"
                            priority
                        />
                    </div>

                    {/* Floating cards */}
                    <div className="pointer-events-none absolute -left-6 -bottom-8 hidden lg:block">
                        <div className="relative h-40 w-64 overflow-hidden rounded-xl bg-white ring-1 ring-black/5 shadow-md">
                            <Image src={photos.card1.src} alt={photos.card1.alt} fill sizes="256px" className="object-cover" />
                        </div>
                    </div>
                    <div className="pointer-events-none absolute -right-6 -top-8 hidden lg:block">
                        <div className="relative h-44 w-72 overflow-hidden rounded-xl bg-white ring-1 ring-black/5 shadow-md">
                            <Image src={photos.card2.src} alt={photos.card2.alt} fill sizes="288px" className="object-cover" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
