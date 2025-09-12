// components/sections/ObjectivesSection.jsx
import { Lightbulb, Handshake, Shield } from 'lucide-react'

export default function ObjectivesSection() {
    const items = [
        {
            Icon: Lightbulb,
            title: 'Tuyên truyền đường lối đối ngoại',
            desc: 'Lan tỏa chủ trương, chính sách đối ngoại; nâng cao nhận thức về vai trò đối ngoại nhân dân.',
        },
        {
            Icon: Handshake,
            title: 'Tăng cường đoàn kết – hữu nghị',
            desc: 'Phát huy trách nhiệm mỗi cá nhân; quảng bá hình ảnh Đồng Nai thân thiện, hiện đại.',
        },
        {
            Icon: Shield,
            title: 'Thi trực tuyến nghiêm túc – minh bạch',
            desc: 'Tổ chức chặt chẽ, đánh giá khách quan; thu hút đông đảo cán bộ, đoàn viên, HSSV tham gia.',
        },
    ]

    return (
        <section id="muc-tieu" className="relative overflow-hidden bg-brand text-white">
            {/* Décor mềm – theo màu thương hiệu */}
            <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

            <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
                {/* Heading tự thiết kế để hiển thị tốt trên nền brand */}
                <div className="text-center">
                    <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold ring-1 ring-white/30">
                        Mục tiêu cuộc thi
                    </span>
                    <h2 className="mt-3 text-2xl font-bold md:text-4xl text-white">
                        Lan tỏa hiểu biết, kết nối cộng đồng
                    </h2>
                    <p className="mx-auto mt-3 max-w-2xl text-sm md:text-base text-white/90">
                        Đưa đối ngoại nhân dân đến gần hơn với mọi người dân trên địa bàn tỉnh – đặc biệt là thế hệ trẻ.
                    </p>
                    <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-white/70" />
                </div>

                {/* Cards: đồng chiều cao, tinh tế, nổi bật trên nền brand */}
                <div className="mt-10 grid gap-5 md:grid-cols-3">
                    {items.map(({ Icon, title, desc }) => (
                        <div
                            key={title}
                            className="group h-full rounded-2xl border border-black/5 bg-white p-6 shadow-sm ring-1 ring-black/5 transition
                         hover:-translate-y-0.5 hover:shadow-md"
                        >
                            <div className="flex h-full flex-col">
                                {/* Icon lớn, tinh tế */}
                                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 ring-1 ring-brand/20">
                                    <Icon className="h-7 w-7 text-brand" />
                                </div>

                                <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
                                <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>

                                {/* Đường nhấn nhẹ khi hover */}
                                <div className="mt-4 h-px w-10 rounded bg-black/5 transition-all group-hover:w-16" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Viền phân tách rất nhạt phía dưới section */}
            <div className="absolute inset-x-0 bottom-0 border-b border-black/5" />
        </section>
    )
}
