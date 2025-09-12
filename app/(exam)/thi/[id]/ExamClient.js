// app/(exam)/thi/[id]/ExamClient.js
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { startQuizAction, saveQuizResponseAction, submitQuizAction, submitEssayAction } from './actions'
import { ShieldAlert, Clock, FileText, PenSquare } from 'lucide-react'

function fmtCountdown(ms) {
    const s = Math.max(0, Math.floor(ms / 1000))
    const mm = String(Math.floor(s / 60)).padStart(2, '0')
    const ss = String(s % 60).padStart(2, '0')
    return `${mm}:${ss}`
}

export default function ExamClient({ entry }) {
    const router = useRouter()

    const [started, setStarted] = useState(entry.mode === 'quiz' ? entry.status === 'in_progress' : true)
    const [endAtISO, setEndAtISO] = useState(entry.endAt || null)
    const [now, setNow] = useState(Date.now())
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const essayRef = useRef(null)
    const submittedRef = useRef(false)

    // lưu đáp án local để phản hồi nhanh
    const [answers, setAnswers] = useState(() => entry.selected || {})

    // chống sao chép / phím tắt phổ biến
    useEffect(() => {
        const prevent = e => { e.preventDefault(); return false }
        const onKey = (e) => {
            const k = (e.key || '').toLowerCase()
            if (k === 'printscreen') e.preventDefault()
            if ((e.ctrlKey || e.metaKey) && ['c', 'u', 's', 'p', 'a', 'x'].includes(k)) e.preventDefault()
        }
        window.addEventListener('contextmenu', prevent, { capture: true })
        window.addEventListener('copy', prevent, { capture: true })
        window.addEventListener('cut', prevent, { capture: true })
        window.addEventListener('paste', prevent, { capture: true })
        window.addEventListener('keydown', onKey, { capture: true })
        return () => {
            window.removeEventListener('contextmenu', prevent, { capture: true })
            window.removeEventListener('copy', prevent, { capture: true })
            window.removeEventListener('cut', prevent, { capture: true })
            window.removeEventListener('paste', prevent, { capture: true })
            window.removeEventListener('keydown', onKey, { capture: true })
        }
    }, [])

    // auto submit on exit
    useEffect(() => {
        const beacon = (mode, userId, content = '') => {
            try {
                const payload = JSON.stringify({ mode, userId, content })
                navigator.sendBeacon('/api/exam/force-submit', payload)
            } catch { }
        }
        const onPageHide = () => { if (!submittedRef.current) beacon(entry.mode, entry.userId, essayRef.current?.value) }
        const onBeforeUnload = () => { if (!submittedRef.current) beacon(entry.mode, entry.userId, essayRef.current?.value) }
        const onVisibility = () => { if (document.visibilityState === 'hidden' && !submittedRef.current) beacon(entry.mode, entry.userId, essayRef.current?.value) }

        window.addEventListener('pagehide', onPageHide)
        window.addEventListener('beforeunload', onBeforeUnload)
        document.addEventListener('visibilitychange', onVisibility)
        return () => {
            window.removeEventListener('pagehide', onPageHide)
            window.removeEventListener('beforeunload', onBeforeUnload)
            document.removeEventListener('visibilitychange', onVisibility)
        }
    }, [entry?.mode, entry?.userId])

    // đếm ngược
    useEffect(() => {
        if (!endAtISO) return
        const t = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(t)
    }, [endAtISO])
    const timeLeft = useMemo(() => {
        if (!endAtISO) return 0
        const end = new Date(endAtISO).getTime()
        return Math.max(0, end - now)
    }, [endAtISO, now])
    useEffect(() => {
        if (entry.mode === 'quiz' && endAtISO && timeLeft <= 0 && !submittedRef.current) {
            onSubmit()
        }
    }, [timeLeft, endAtISO, entry.mode])

    async function onStartQuiz() {
        setError('')
        const fd = new FormData()
        fd.set('userId', entry.userId)
        fd.set('seed', JSON.stringify(entry.seed || {}))
        const res = await startQuizAction(null, fd)
        if (res?.ok) {
            setEndAtISO(res.endAt)
            setStarted(true)
        } else {
            setError(res?.error || 'Không thể bắt đầu bài thi.')
        }
    }

    async function onChangeAnswer(qid, idx) {
        setAnswers(prev => ({ ...prev, [qid]: idx }))
        const fd = new FormData()
        fd.set('userId', entry.userId)
        fd.set('questionId', qid)
        fd.set('selectedIndex', String(idx))
        await saveQuizResponseAction(null, fd)
    }

    async function onSubmit() {
        if (submittedRef.current) return
        setSubmitting(true)
        try {
            if (entry.mode === 'quiz') {
                const fd = new FormData(); fd.set('userId', entry.userId)
                await submitQuizAction(null, fd)
            } else {
                const fd = new FormData()
                fd.set('userId', entry.userId)
                fd.set('content', essayRef.current?.value || '')
                await submitEssayAction(null, fd)
            }
            submittedRef.current = true
            router.replace('/thi')
        } catch {
            // giữ yên trang nếu lỗi
        } finally {
            setSubmitting(false)
        }
    }

    const deadlineText = entry.deadline
        ? new Date(entry.deadline).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })
        : '—'

    return (
        <div className="min-h-screen select-none bg-slate-50 p-4 md:p-6">
            <div className="mx-auto w-full max-w-5xl">
                {/* Header nhỏ */}
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200">
                            {entry.mode === 'quiz' ? <FileText className="h-5 w-5 text-slate-700" /> : <PenSquare className="h-5 w-5 text-slate-700" />}
                        </span>
                        <div>
                            <div className="text-lg font-semibold text-slate-900">
                                {entry.mode === 'quiz' ? 'Bài thi Trắc nghiệm' : 'Bài thi Tự luận'}
                            </div>
                            <div className="text-xs text-slate-500">Hạn chót: {deadlineText}</div>
                        </div>
                    </div>
                    {entry.mode === 'quiz' && (
                        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-slate-500" />
                                <span>Thời gian còn lại: {endAtISO ? fmtCountdown(timeLeft) : `${entry.durationMinutes}:00`}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Quy định */}
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    <div className="mb-1 font-semibold">Quy định phòng thi</div>
                    <ul className="list-inside list-disc space-y-1">
                        <li>Không sao chép nội dung, không chụp màn hình dưới mọi hình thức.</li>
                        <li>Nếu thoát trang/tắt trình duyệt, hệ thống sẽ <b>nộp bài ngay</b> cho lượt thi này.</li>
                        <li>Trắc nghiệm có giới hạn thời gian; tự luận không có đếm giờ.</li>
                    </ul>
                </div>

                {error && (
                    <div className="mb-4 inline-flex items-center gap-2 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
                        <ShieldAlert className="h-4 w-4" /> {error}
                    </div>
                )}

                {/* Nội dung */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    {entry.mode === 'quiz' ? (
                        !started ? (
                            <div className="text-center">
                                <p className="mb-4 text-slate-700">
                                    Bấm &quot;Bắt đầu&quot; để vào làm bài. Thời gian: {entry.durationMinutes} phút.
                                </p>
                                <button type="button" onClick={onStartQuiz} className="btn-brand px-6">Bắt đầu</button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {entry.pack.map((q) => (
                                    <div key={q.questionId} className="rounded-lg border border-slate-200 p-3">
                                        <div className="mb-2 text-sm font-semibold text-slate-800">
                                            {q.idx}. {q.text}
                                        </div>
                                        <div className="grid gap-2">
                                            {q.choices.map((ch, i) => {
                                                const sel = answers[q.questionId] === i
                                                return (
                                                    <label key={i} className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition ${sel ? 'border-brand/60 bg-brand/5' : 'border-slate-200 hover:bg-slate-50'}`}>
                                                        <input
                                                            type="radio"
                                                            name={q.questionId}
                                                            className="accent-brand"
                                                            checked={sel || false}
                                                            onChange={() => onChangeAnswer(q.questionId, i)}
                                                        />
                                                        <span className="select-text">{ch}</span>
                                                    </label>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}

                                <div className="flex justify-end pt-2">
                                    <button onClick={onSubmit} disabled={submitting} className="btn-brand px-6">
                                        {submitting ? 'Đang nộp…' : 'Nộp bài'}
                                    </button>
                                </div>
                            </div>
                        )
                    ) : (
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Bài làm (tối đa ~3000 từ)
                            </label>
                            <textarea ref={essayRef} className="inp h-64 select-text" placeholder="Nhập bài tự luận của bạn…" />
                            <div className="mt-4 flex justify-end">
                                <button onClick={onSubmit} disabled={submitting} className="btn-brand px-6">
                                    {submitting ? 'Đang nộp…' : 'Nộp bài'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mx-auto mt-6 text-center text-sm text-slate-500">
                    <Link href="/thi" className="underline">Quay lại Trang thi</Link>
                </div>
            </div>
        </div>
    )
}
