// app/thi/page.js
import { getExamDashboard } from './actions'
import Link from 'next/link'
import { FileText, PenSquare, ShieldAlert, Timer } from 'lucide-react'
import { getSession } from '@/app/session'

function fmt(dt) {
    if (!dt) return 'Chưa có'
    try {
        return new Date(dt).toLocaleString('vi-VN', {
            hour: '2-digit', minute: '2-digit',
            day: '2-digit', month: '2-digit', year: 'numeric'
        })
    } catch { return '—' }
}

// Hạn chót hiển thị dạng yêu cầu
function fmtDeadline(dt) {
    if (!dt) return '—'
    const d = new Date(dt)
    const dd = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const hh = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    return `${hh} ${dd}` // ví dụ: 23:59 31/10/2025
}

function StatusPill({ value }) {
    const map = {
        not_started: { label: 'Chưa bắt đầu', cls: 'bg-slate-100 text-slate-700' },
        in_progress: { label: 'Đang làm', cls: 'bg-amber-100 text-amber-800' },
        submitted: { label: 'Đã nộp', cls: 'bg-emerald-100 text-emerald-800' },
    }
    const m = map[value] || map.not_started
    return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${m.cls}`}>
        {m.label}
    </span>
}

function Card({ icon: Icon, title, subtitle, children, footer }) {
    return (
        <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b px-4 py-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
                    <Icon className="h-5 w-5 text-slate-700" />
                </span>
                <div className="leading-tight">
                    <div className="text-base font-semibold text-slate-800">{title}</div>
                    <div className="text-xs text-slate-500">{subtitle}</div>
                </div>
            </div>

            <div className="flex flex-1 flex-col p-4">
                <div className="space-y-2 text-sm">{children}</div>
                <div className="mt-auto pt-3">{footer}</div>
            </div>
        </div>
    )
}

export default async function Page() {
    const auth = await getSession()
    if (!auth) {
        return (<p>Bạn không có quyền truy cập trang này</p>)
    }

    const data = await getExamDashboard()

    const quizDisabled = !data.quiz.canStart
    const essayDisabled = !data.essay.canAttempt

    return (
        <div className="mx-auto max-w-5xl px-3 md:px-4 py-8">
            <h1 className="mb-5 text-2xl font-bold">Trang thi</h1>

            <div className="grid gap-4 md:grid-cols-2 items-stretch">
                {/* ===== Card TRẮC NGHIỆM ===== */}
                <Card
                    icon={FileText}
                    title="Bài thi Trắc nghiệm"
                    subtitle="40 điểm – 20 câu hỏi"
                    footer={
                        quizDisabled ? (
                            <button className="btn-brand w-full opacity-50 cursor-not-allowed" aria-disabled="true">
                                Vào thi trắc nghiệm
                            </button>
                        ) : (
                            <Link href={`/thi/${data.userId}?mode=quiz`} className="btn-brand w-full justify-center" prefetch={false}>
                                Vào thi trắc nghiệm
                            </Link>
                        )
                    }
                >
                    <div className="flex items-center justify-between">
                        <span className="text-slate-600">Trạng thái</span>
                        <StatusPill value={data.quiz.status} />
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-slate-600">Hạn chót</span>
                        <span className="inline-flex items-center gap-1 text-slate-800">
                            <Timer className="h-4 w-4 text-slate-400" /> {fmtDeadline(data.quiz.deadline)}
                        </span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-slate-600">Lượt thi</span>
                        <span className="font-medium text-slate-800">1</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-slate-600">Thời gian thực hiện gần nhất</span>
                        <span className="text-slate-800">{fmt(data.quiz.lastSubmittedAt)}</span>
                    </div>

                    {quizDisabled && data.quiz.reason && (
                        <div className="mt-2 inline-flex items-center gap-2 rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700">
                            <ShieldAlert className="h-4 w-4" /> {data.quiz.reason}
                        </div>
                    )}
                </Card>

                {/* ===== Card TỰ LUẬN ===== */}
                <Card
                    icon={PenSquare}
                    title="Bài thi Tự luận"
                    subtitle="60 điểm – tối đa 3 lượt nộp"
                    footer={
                        essayDisabled ? (
                            <button className="btn-brand w-full opacity-50 cursor-not-allowed" aria-disabled="true">
                                Làm bài tự luận
                            </button>
                        ) : (
                            <Link href={`/thi/${data.userId}?mode=essay`} className="btn-brand w-full justify-center" prefetch={false}>
                                Làm bài tự luận
                            </Link>
                        )
                    }
                >
                    <div className="flex items-center justify-between">
                        <span className="text-slate-600">Trạng thái</span>
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                            {data.essay.usedAttempts > 0 ? `${data.essay.usedAttempts}/3 lượt đã nộp` : 'Chưa nộp'}
                        </span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-slate-600">Hạn chót</span>
                        <span className="inline-flex items-center gap-1 text-slate-800">
                            <Timer className="h-4 w-4 text-slate-400" /> {fmtDeadline(data.essay.deadline)}
                        </span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-slate-600">Lượt thi</span>
                        <span className="font-medium text-slate-800">3</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-slate-600">Thời gian thực hiện gần nhất</span>
                        <span className="text-slate-800">{fmt(data.essay.lastSubmittedAt)}</span>
                    </div>

                    {essayDisabled && data.essay.reason && (
                        <div className="mt-2 inline-flex items-center gap-2 rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700">
                            <ShieldAlert className="h-4 w-4" /> {data.essay.reason}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    )
}
