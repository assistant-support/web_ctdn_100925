import Image from "next/image";
import Link from "next/link";
import { Info, Mail, Phone, Users } from "lucide-react";

export default function Footer() {
    return (
        <footer
            className="relative text-white"
            // chuẩn màu: --color-brand-700 (fallback --brand-700)
            style={{ backgroundColor: "var(--color-brand-700, var(--brand-700))" }}
        >
            {/* tiêu đề kiểu banner (theo ảnh tham chiếu) */}
            <div className="mx-auto max-w-6xl p-4">
                <h3 className="text-center text-xl font-extrabold tracking-wide md:text-2xl">
                    CUỘC THI TÌM HIỂU VỀ CÔNG TÁC ĐỐI NGOẠI NHÂN DÂN TỈNH ĐỒNG NAI 2025
                </h3>
            </div>

            {/* nội dung chính */}
            <div className="mx-auto w-full border-t border-white/15">
                <div className="mx-auto max-w-6xl px-4 pt-12 pb-6">
                    <div className="grid gap-10 md:grid-cols-3">
                        {/* VỀ CUỘC THI */}
                        <section>
                            <h4 className="mb-3 text-2xl font-extrabold uppercase tracking-wide">
                                Về cuộc thi
                            </h4>
                            <div className="mb-5 h-0.5 w-24 bg-white/60" />
                            <p className="max-w-prose text-[15px] leading-7 text-white/90">
                                Cuộc thi trực tuyến gồm <b>Trắc nghiệm</b> (01 lần) và <b>Tự luận</b> (lưu tối đa 03 lần, tối đa 3.000 từ) nhằm tuyên truyền đường lối đối ngoại của Đảng, Nhà nước; lan tỏa vai trò đối ngoại nhân dân; quảng bá hình ảnh Đồng Nai hiện đại – trang trọng.
                            </p>
                        </section>

                        {/* ĐƠN VỊ TỔ CHỨC */}
                        <section>
                            <div className="flex items-center gap-3">
                                <div className="relative h-16 w-16 shrink-0 rounded-[6px] p-1">
                                    <Image
                                        src="https://lh3.googleusercontent.com/d/1N_KQ47tMsf-UalKOQaGQLT3NcL9Fc3vK"
                                        alt="Đơn vị tổ chức"
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                                <h4 className="text-2xl font-extrabold uppercase tracking-wide">
                                    Đơn vị tổ chức
                                </h4>
                            </div>
                            <div className="mt-3 h-0.5 w-full bg-white/60" />

                            <ul className="mt-5 space-y-3 text-[15px] leading-7">
                                <li className="flex items-start gap-3 my-1">
                                    {/* icon tối giản, không viền/ô nền */}
                                    <Users className="mt-1 h-5 w-5 text-white/90" />
                                    <span>Liên hiệp các tổ chức hữu nghị tỉnh Đồng Nai</span>
                                </li>
                                <li className="flex items-start gap-3 my-1">
                                    <Mail className="mt-1 h-5 w-5 text-white/90" />
                                    <span>tochuchuunghidn@gmail.com</span>
                                </li>
                                <li className="flex items-start gap-3 my-1">
                                    <Phone className="mt-1 h-5 w-5 text-white/90" />
                                    <span>(0251) 3843909</span>
                                </li>
                            </ul>
                        </section>

                        {/* ĐƠN VỊ ĐỒNG HÀNH / ĐỒNG TỔ CHỨC */}
                        <section>
                            <div className="flex items-center gap-3">
                                <div className="relative h-16 w-16 shrink-0 rounded-[6px] p-1">
                                    <Image
                                        src="https://lh3.googleusercontent.com/d/1_Rpuv4qggEwsY2JpcHrI4eERiYBji5ni" // thay bằng logo thực tế
                                        alt="Đơn vị đồng tổ chức"
                                        fill
                                        sizes="48px"
                                        className="object-contain"
                                    />
                                </div>
                                <h4 className="text-2xl font-extrabold uppercase tracking-wide">
                                    Đơn vị đồng hành
                                </h4>
                            </div>
                            <div className="mt-3 h-0.5 w-full bg-white/60" />

                            <ul className="mt-5 space-y-3 text-[15px] leading-7">
                                <li className="flex items-start gap-3 my-1">
                                    {/* icon tối giản, không viền/ô nền */}
                                    <Users className="mt-1 h-5 w-5 text-white/90" />
                                    <span>Đại học Lạc Hồng</span>
                                </li>
                                <li className="flex items-start gap-3 my-1">
                                    <Mail className="mt-1 h-5 w-5 text-white/90" />
                                    <span>lachong@lhu.edu.vn</span>
                                </li>
                                <li className="flex items-start gap-3 my-1">
                                    <Phone className="mt-1 h-5 w-5 text-white/90" />
                                    <span>0251 3952 778</span>
                                </li>
                            </ul>
                        </section>
                    </div>

                    {/* đường kẻ mảnh */}
                    <div className="mt-10 h-px w-full bg-white/15" />

                    {/* bar cuối */}
                    <div className="mt-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                        <div className="text-xs text-white/80">
                            © {new Date().getFullYear()} Liên hiệp các tổ chức hữu nghị tỉnh Đồng Nai.
                        </div>
                        <ul className="flex flex-wrap items-center gap-4 text-xs">
                            <li><Link href="#muc-tieu" className="hover:underline underline-offset-4">Mục tiêu</Link></li>
                            <li><Link href="#timeline" className="hover:underline underline-offset-4">Timeline</Link></li>
                            <li><Link href="#the-le" className="hover:underline underline-offset-4">Thể lệ</Link></li>
                            <li><Link href="#faq" className="hover:underline underline-offset-4">FAQ</Link></li>
                        </ul>
                    </div>
                </div>
            </div>
        </footer>
    );
}