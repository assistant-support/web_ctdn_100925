import SectionHeading from "../SectionHeading";
import RevealOnScroll from "../RevealOnScroll";
import {
    Users, ClipboardList, FilePenLine, Scale,
    CalendarRange, Gift, Phone, ShieldAlert, Info
} from "lucide-react";

export default function RulesSection() {
    const sections = [
        {
            Icon: Users,
            title: "Đối tượng & phạm vi",
            body: (
                <ul className="space-y-2 text-sm text-slate-700">
                    <li>• Công dân Việt Nam đang sinh sống, học tập, làm việc tại tỉnh Đồng Nai (bao gồm học sinh từ bậc THCS hoặc tương đương trở lên).</li>
                    <li>• <span className="font-medium">Không dự thi</span>: Thành viên Ban Tổ chức, Ban Giám khảo, Tổ Thư ký, Tổ biên soạn câu hỏi – đáp án và cán bộ tham gia tổ chức Cuộc thi.</li>
                </ul>
            ),
        },
        {
            Icon: ClipboardList,
            title: "Cách đăng ký tham gia",
            body: (
                <ul className="space-y-2 text-sm text-slate-700">
                    <li>• Mỗi thí sinh <span className="font-medium">01 tài khoản duy nhất</span> trên hệ thống.</li>
                    <li>• Thông tin cần khai báo: Họ tên, ngày sinh, đơn vị/trường, <span className="whitespace-nowrap">CCCD (12 số)</span>, số điện thoại, email.</li>
                    <li>• Đăng ký và dự thi qua website Cuộc thi hoặc quét mã QR.</li>
                </ul>
            ),
        },
        {
            Icon: FilePenLine,
            title: "Hình thức thi",
            body: (
                <ul className="space-y-2 text-sm text-slate-700">
                    <li>• <span className="font-medium">Phần Trắc nghiệm</span>: làm <span className="font-semibold">01 lần duy nhất</span>.</li>
                    <li>• <span className="font-medium">Phần Tự luận</span>: tối đa <span className="font-semibold">3 lần lưu</span>, độ dài tối đa <span className="font-semibold">3.000 từ</span>; bố cục 3 phần, lập luận rõ ràng và có đề xuất giải pháp.</li>
                </ul>
            ),
        },
        {
            Icon: Scale,
            title: "Cách chấm điểm",
            body: (
                <ul className="space-y-2 text-sm text-slate-700">
                    <li>• Tổng điểm: <span className="font-semibold">100 điểm</span>.</li>
                    <li>• Trắc nghiệm: <span className="font-semibold">40 điểm</span> (20 câu × 2 điểm).</li>
                    <li>• Tự luận: <span className="font-semibold">60 điểm</span> (Ban Giám khảo chấm, lấy điểm trung bình các thành viên).</li>
                </ul>
            ),
            badge: "Quy định",
        }
    ];

    return (
        <section id="the-le" className="relative bg-white">
            <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
                <SectionHeading
                    eyebrow="Thể lệ tóm tắt"
                    title="Cách tham gia & cách tính điểm"
                    subtitle="Toàn bộ quy định quan trọng được hiển thị trực tiếp bên dưới."
                />

                {/* Accordions */}
                <div className="mt-10 grid gap-4 md:grid-cols-2">
                    {sections.map(({ Icon, title, body, badge }, i) => (
                        <RevealOnScroll key={title} delay={i * 60}>
                            <details className="group rounded-2xl border border-black/5 bg-white p-0 shadow-sm ring-1 ring-black/5 open:shadow transition">
                                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-5 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 ring-1 ring-brand/20">
                                            <Icon className="h-6 w-6 text-brand" />
                                        </div>
                                        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {badge && (
                                            <span className="hidden rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200 sm:inline-flex">
                                                {badge}
                                            </span>
                                        )}
                                        <svg className="h-4 w-4 text-slate-500 transition group-open:rotate-180" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 011.08 1.04l-4.25 4.4a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" />
                                        </svg>
                                    </div>
                                </summary>
                                <div className="px-5 pb-5">{body}</div>
                            </details>
                        </RevealOnScroll>
                    ))}
                </div>
                <div className="mt-6 rounded-2xl bg-brand/5 p-4 ring-1 ring-black/5">
                    <div className="flex items-start gap-3 text-sm text-slate-700">
                        <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 ring-1 ring-brand/20">
                            <Info className="h-5 w-5 text-brand" />
                        </div>
                        <p className="flex-1">
                            <span className="font-medium">Thể lệ Cuộc thi</span> và <span className="font-medium">Kế hoạch triển khai</span> do Liên hiệp các tổ chức hữu nghị tỉnh Đồng Nai ban hành (thời gian thi: 15/09/2025–31/10/2025; chấm thi 01–14/11/2025; tổng kết & trao giải tháng 11/2025).
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
