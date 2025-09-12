// components/sections/FAQSection.jsx
import SectionHeading from "../SectionHeading";
import RevealOnScroll from "../RevealOnScroll";
import {
    Users,
    ClipboardList,
    BookOpenCheck,
    CalendarRange,
    Scale,
    Phone,
    ChevronDown
} from "lucide-react";

const faqs = [
    {
        q: "Ai được tham gia?",
        a: "Công dân Việt Nam đang sinh sống, học tập, làm việc tại Đồng Nai; học sinh từ THCS trở lên. Thành viên BTC/BGK/Tổ thư ký/biên soạn không dự thi.",
        Icon: Users,
    },
    {
        q: "Thi gồm những phần nào?",
        a: "Trắc nghiệm (1 lần duy nhất) và Tự luận (tối đa 3 lần lưu, tối đa 3000 từ).",
        Icon: BookOpenCheck,
    },
    {
        q: "Cách đăng ký thi?",
        a: "Quét QR hoặc truy cập website Cuộc thi, tạo 1 tài khoản duy nhất và điền đủ thông tin theo hướng dẫn.",
        Icon: ClipboardList,
    },
    {
        q: "Thời gian thi?",
        a: "Từ 15/09/2025 đến hết 31/10/2025.",
        Icon: CalendarRange,
    },
    {
        q: "Tính điểm như thế nào?",
        a: "Tổng 100 điểm: 20 câu trắc nghiệm × 2 = 40 điểm; Tự luận 60 điểm; lấy trung bình điểm của BGK.",
        Icon: Scale,
    },
    {
        q: "Liên hệ hỗ trợ kỹ thuật?",
        a: "Xem mục Liên hệ ở chân trang (điện thoại và email hỗ trợ).",
        Icon: Phone,
    },
];

export default function FAQSection() {
    return (
        <section id="faq" className="relative border-b border-black/5 bg-white">
            <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
                <SectionHeading
                    eyebrow="Câu hỏi thường gặp"
                    title="Những thắc mắc hay gặp"
                    subtitle="Nếu cần thêm hỗ trợ, vui lòng liên hệ ở chân trang."
                />

                <div className="mt-10 grid gap-4 md:grid-cols-2">
                    {faqs.map(({ q, a, Icon }, i) => (
                        <RevealOnScroll key={q} delay={i * 60}>
                            <details className="group rounded-2xl border border-black/5 bg-white p-0 shadow-sm ring-1 ring-black/5 transition open:shadow-md">
                                {/* Header */}
                                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-5 py-4">
                                    <div className="flex items-center gap-3">
                                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand ring-1 ring-brand/20">
                                            <Icon className="h-5 w-5" />
                                        </span>
                                        <h3 className="text-base font-semibold text-slate-900">{q}</h3>
                                    </div>
                                    <ChevronDown className="h-5 w-5 text-slate-500 transition-transform group-open:rotate-180" />
                                </summary>

                                {/* Body */}
                                <div className="border-t border-black/5 px-5 pb-5 pt-3">
                                    <p className="text-sm leading-6 text-slate-600">{a}</p>
                                </div>
                            </details>
                        </RevealOnScroll>
                    ))}
                </div>
            </div>
        </section>
    );
}
