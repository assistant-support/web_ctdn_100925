// components/sections/PrizesSection.jsx
import RevealOnScroll from "../RevealOnScroll";
import { Trophy, Medal, Award, Crown } from "lucide-react";

export default function PrizesSection() {
    const prizes = [
        { name: "Giải Nhất", money: "5.000.000đ", note: "Giấy khen + tiền thưởng" },
        { name: "Giải Nhì", money: "3.000.000đ", note: "Giấy khen + tiền thưởng" },
        { name: "Giải Ba", money: "2.000.000đ", note: "Giấy khen + tiền thưởng" },
        { name: "Khuyến khích", money: "1.000.000đ", note: "Giấy khen + tiền thưởng" },
        { name: "Giải tập thể", money: "2.000.000đ", note: "Đơn vị có thí sinh tham gia đông nhất" },
    ];

    // Hàng trên (trái→phải): Nhì – Nhất – Ba
    const top3 = [
        { ...prizes[1], rank: 2, variant: "silver" },
        { ...prizes[0], rank: 1, variant: "gold" },
        { ...prizes[2], rank: 3, variant: "bronze" },
    ];
    const others = prizes.slice(3);

    // Bảng màu mới — nền nhạt “đẹp mắt”, icon đậm hơn nền để nổi bật
    // LƯU Ý: chỉ dùng biến cho brand ở nền section; còn lại dùng HEX
    const palette = {
        gold: {
            bg: "bg-gradient-to-b from-[#FFF4CC] to-[#F6C453]", // vàng kem → vàng mật ong
            textMain: "text-[#0B1220]",
            textSub: "text-[#364152]",
            icon: "#7A5800",            // vàng đậm (tối hơn nền)
            border: "border-2 border-[#ffffff]",
        },
        silver: {
            bg: "bg-gradient-to-b from-[#F7F8FB] to-[#DDE3EC]", // bạc kem → xám lam nhạt
            textMain: "text-[#0B1220]",
            textSub: "text-[#364152]",
            icon: "#4B5563",            // slate-600 đậm hơn nền
            border: "border-2 border-[#ffffff]",
        },
        bronze: {
            bg: "bg-gradient-to-b from-[#FBE6D4] to-[#E5AE7B]", // đồng kem → nâu cam nhạt
            textMain: "text-[#0B1220]",
            textSub: "text-[#364152]",
            icon: "#8A4B14",            // nâu đồng đậm
            border: "border-2 border-[#ffffff]",
        },
        gray: {
            bg: "bg-gradient-to-b from-[#F6F7F9] to-[#E7EAF0]", // xám rõ ràng hơn
            textMain: "text-[#0B1220]",
            textSub: "text-[#364152]",
            icon: "#1F2937",            // xám rất đậm (không dùng đen thuần)
            border: "border-2 border-[#ffffff]",
        },
    };

    function TopCard({ item, delay }) {
        const { name, money, note, rank, variant } = item;
        const Icon = rank === 1 ? Crown : rank === 2 ? Medal : Trophy;
        const chip = rank === 1 ? "Hạng Nhất" : rank === 2 ? "Hạng Nhì" : "Hạng Ba";
        const c = palette[variant];

        return (
            <RevealOnScroll delay={delay}>
                <div
                    className={`relative rounded-3xl ${c.bg} ${c.border} shadow-md ring-1 ring-black/5
                      px-7 py-8 transition hover:shadow-lg`}
                    style={{ transform: rank === 1 ? "translateY(-6px) scale(1.03)" : undefined }}
                    aria-label={chip}
                >
                    {/* Chip hạng (trắng mờ để tương phản đều với mọi nền) */}
                    <span className="absolute right-5 top-5 rounded-full bg-[#ffffff]/75 px-3 py-1 text-[10px] font-bold text-[#0B1220] ring-1 ring-[#ffffff]/90">
                        {chip}
                    </span>

                    {/* Icon lớn: màu đậm hơn nền để nổi bật */}
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ffffff]/65 ring-1 ring-[#ffffff]/80">
                        <Icon className="h-9 w-9" style={{ color: c.icon }} />
                    </div>

                    <div className={`mt-3 text-lg font-semibold ${c.textMain}`}>{name}</div>
                    <div className={`mt-1 text-3xl font-extrabold tracking-tight ${c.textMain}`}>{money}</div>
                    <p className={`mt-2 text-sm ${c.textSub}`}>{note}</p>
                </div>
            </RevealOnScroll>
        );
    }

    function OtherCard({ item, delay }) {
        const c = palette.gray;
        return (
            <RevealOnScroll delay={delay}>
                <div className={`rounded-2xl ${c.bg} ${c.border} p-6 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow`}>
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#ffffff]/65 ring-1 ring-[#ffffff]/80">
                        <Award className="h-7 w-7" style={{ color: c.icon }} />
                    </div>
                    <div className={`mt-3 text-base font-medium ${c.textMain}`}>{item.name}</div>
                    <div className={`mt-1 text-2xl font-bold ${c.textMain}`}>{item.money}</div>
                    <div className={`mt-2 text-xs ${c.textSub}`}>{item.note}</div>
                </div>
            </RevealOnScroll>
        );
    }

    return (
        <section id="giai-thuong" className="relative border-b bg-brand text-white">
            {/* décor nhẹ trên nền brand */}
            <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

            <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
                {/* heading dành cho nền tối/brand */}
                <div className="text-center">
                    <span className="inline-flex items-center rounded-full bg-[#ffffff]/10 px-3 py-1 text-xs font-semibold ring-1 ring-[#ffffff]/30">
                        Giải thưởng
                    </span>
                    <h2 className="mt-3 text-2xl font-bold md:text-4xl text-[#ffffff]">
                        Vinh danh xứng đáng – lan tỏa rộng rãi
                    </h2>
                    <p className="mx-auto mt-3 max-w-2xl text-sm md:text-base text-[#ffffff]/90">
                        Cơ cấu giải thưởng & hình thức khen thưởng theo Thể lệ.
                    </p>
                    <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-[#ffffff]/70" />
                </div>

                {/* Hàng trên: Nhì – Nhất – Ba (card nền nhạt, icon đậm, viền trắng) */}
                <div className="mt-10 grid gap-5 md:grid-cols-3">
                    <TopCard item={top3[0]} delay={60} />
                    <TopCard item={top3[1]} delay={0} />
                    <TopCard item={top3[2]} delay={120} />
                </div>

                {/* Hàng dưới: các giải còn lại (xám rõ + viền trắng) */}
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    {others.map((item, i) => (
                        <OtherCard key={item.name} item={item} delay={i * 60} />
                    ))}
                </div>
            </div>
        </section>
    );
}
