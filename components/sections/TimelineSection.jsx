// components/sections/TimelineSection.jsx
"use client";

import { useMemo } from "react";
import { CalendarClock, PencilLine, PlayCircle, CheckCircle2, Award } from "lucide-react";
import SectionHeading from "../SectionHeading";
import RevealOnScroll from "../RevealOnScroll";

// Mốc thời gian theo Thể lệ/Kế hoạch
const PHASES = [
    { start: "2025-08-01", end: "2025-08-31", date: "08/2025", title: "Ban hành Kế hoạch, thành lập BTC", desc: "Hoàn tất công tác chuẩn bị: BTC, Tổ Thư ký, Tổ biên soạn.", Icon: CalendarClock },
    { start: "2025-09-01", end: "2025-09-15", date: "01–15/09/2025", title: "Hoàn thiện câu hỏi & phát động", desc: "Xây dựng bộ câu hỏi – đáp án; nâng cấp phần mềm; truyền thông phát động.", Icon: PencilLine },
    { start: "2025-09-15", end: "2025-10-31", date: "15/09–31/10/2025", title: "Thi trực tuyến (trắc nghiệm & tự luận)", desc: "Mở cổng thi trên website/QR. Trắc nghiệm 1 lần; tự luận lưu tối đa 3 lần.", Icon: PlayCircle },
    { start: "2025-11-01", end: "2025-11-14", date: "01–14/11/2025", title: "Chấm thi", desc: "BGK chấm độc lập, tổng hợp điểm.", Icon: CheckCircle2 },
    { start: "2025-11-01", end: "2025-11-30", date: "Tháng 11/2025", title: "Tổng kết & Trao giải", desc: "Tổ chức Lễ tổng kết và trao giải.", Icon: Award },
];

function getStatus(now, s, e) {
    const start = new Date(`${s}T00:00:00`);
    const end = new Date(`${e}T23:59:59`);
    if (now > end) return "past";
    if (now < start) return "future";
    return "current";
}

function StatusChip({ status }) {
    const map = {
        past: { label: "ĐÃ QUA", cls: "bg-slate-100 text-slate-700 ring-slate-200" },
        current: { label: "ĐANG DIỄN RA", cls: "bg-emerald-100 text-emerald-700 ring-emerald-200" },
        future: { label: "SẮP TỚI", cls: "bg-amber-100 text-amber-700 ring-amber-200" },
    };
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${map[status].cls}`}>
            {map[status].label}
        </span>
    );
}

export default function TimelineSection() {
    const now = new Date();
    const phases = useMemo(
        () => PHASES.map((p) => ({ ...p, status: getStatus(now, p.start, p.end) })),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [now.toDateString()]
    );

    // Khoảng cách card so với trục (px)
    const CARD_GAP = 64;

    return (
        <section id="timeline" className="relative bg-white scroll-mt-24 overflow-hidden">
            <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
                <SectionHeading
                    eyebrow="Lộ trình"
                    title="Timeline triển khai Cuộc thi 2025"
                    subtitle="Các mốc thời gian chính thức theo Kế hoạch/Thể lệ."
                />

                {/* DESKTOP: timeline ngang */}
                <div className="relative mt-12 hidden md:block">
                    {/* Trục full-viewport: nằm đúng giữa, kéo dài max màn hình */}
                    <div className="pointer-events-none absolute left-1/2 top-1/2 h-1 w-screen -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-brand/20 via-brand/60 to-brand/20" />

                    {/* Grid có padding đối xứng để trục khớp tâm */}
                    <ol className="relative grid grid-cols-5 gap-8 pt-32 pb-32">
                        {phases.map(({ date, title, desc, Icon, status }, i) => {
                            const up = i % 2 === 0; // zig-zag
                            return (
                                <li key={title} className="relative h-[320px]">
                                    {/* Chấm tròn đúng giữa trục */}
                                    <div className="absolute left-1/2 top-1/2 z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white ring-2 ring-brand" />

                                    {/* Connector từ trục tới card (không đè vào card) */}
                                    <div
                                        className={`absolute left-1/2 w-0.5 bg-brand/40 ${up ? "top-1/2 -translate-y-full" : "top-1/2"}`}
                                        style={{ height: CARD_GAP }}
                                    />

                                    <div
                                        className="absolute left-1/2 z-0 w-[min(88vw,340px)] -translate-x-1/2 rounded-2xl bg-brand p-5 text-white shadow-md ring-1 ring-black/5"
                                        style={
                                            up
                                                ? { bottom: `calc(50% + ${CARD_GAP}px)` }
                                                : { top: `calc(50% + ${CARD_GAP}px)` }
                                        }
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/30">
                                                    <Icon className="h-7 w-7" />
                                                </div>
                                                <div className="text-sm font-semibold text-white/90">{date}</div>
                                            </div>
                                            <StatusChip status={status} />
                                        </div>
                                        <h3 className="mt-3 text-base font-semibold leading-6">{title}</h3>
                                        <p className="mt-2 text-sm text-white/90">{desc}</p>
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                </div>

                {/* MOBILE: timeline dọc (ổn, giữ nguyên) */}
                <div className="mt-10 md:hidden">
                    <ol className="relative space-y-6 pl-6">
                        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-brand/30" />
                        {phases.map(({ date, title, desc, Icon, status }, i) => (
                            <RevealOnScroll key={title} delay={i * 60}>
                                <li className="relative">
                                    <div className="absolute left-0 top-5 h-3 w-3 -translate-x-1/2 rounded-full bg-white ring-2 ring-brand" />
                                    <div className="rounded-2xl bg-brand p-5 text-white shadow-md ring-1 ring-black/5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/30">
                                                    <Icon className="h-6 w-6" />
                                                </div>
                                                <div className="text-sm font-semibold text-white/90">{date}</div>
                                            </div>
                                            <StatusChip status={status} />
                                        </div>
                                        <h3 className="mt-2 text-base font-semibold">{title}</h3>
                                        <p className="mt-1 text-sm text-white/90">{desc}</p>
                                    </div>
                                </li>
                            </RevealOnScroll>
                        ))}
                    </ol>
                </div>
            </div>
        </section>
    );
}
