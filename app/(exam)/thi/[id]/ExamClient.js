'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { heartbeatQuiz, recordQuizResponse, submitEssay, submitQuiz } from './actions';
import { useActionFeedback } from '@/hooks/useAction';

export default function ExamClient({ entry, userId, mode }) {
    const router = useRouter();

    if (mode === 'quiz') {
        if (entry.stage === 'submitted') {
            return (
                <main className="mx-auto max-w-2xl p-6">
                    <h1 className="text-2xl font-semibold">Bạn đã nộp bài trắc nghiệm</h1>
                    <p className="mt-4">Điểm phần trắc nghiệm: <b>{entry.score}</b> / 40</p>
                    <div className="mt-6">
                        <a href="/thi" className="text-brand hover:underline">Quay về trang thi</a>
                    </div>
                </main>
            );
        }
        if (entry.stage === 'in_progress') return <QuizScreen userId={userId} data={entry.quiz} />;
        return null;
    }

    if (mode === 'essay') {
        // TỰ LUẬN: cho phép chuyển tab, không ép fullscreen
        if (entry.stage === 'essay_closed') {
            return (
                <main className="mx-auto max-w-2xl p-6">
                    <h1 className="text-2xl font-semibold">Phần tự luận đã kết thúc</h1>
                    <p className="mt-4">Hạn chót đã qua.</p>
                </main>
            );
        }
        return (
            <main className="mx-auto max-w-4xl p-6">
                <h1 className="text-2xl font-bold">Bài tự luận</h1>
                <p className="mt-2 text-sm">
                    Còn lại <b>{entry.essay.attemptsLeft}</b> lượt nộp.
                    {entry.essay.deadlineISO && <> Hạn chót: <b>{new Date(entry.essay.deadlineISO).toLocaleString()}</b>.</>}
                </p>
                <EssayForm
                    userId={userId}
                    defaultValue={entry.essay.lastContent || ''}
                    disabled={entry.essay.attemptsLeft <= 0}
                />
            </main>
        );
    }

    return null;
}

/* =========================
 * QUIZ — 1 câu hỏi/màn hình + fixed card height (theo câu dài nhất)
 * ========================= */
function QuizScreen({ userId, data }) {
    const router = useRouter();
    const { run } = useActionFeedback();

    const MAX_TAB_VIOLATIONS = 3;           // cho phép 3 lần; lần thứ 4 auto-submit
    const autoSubmitRef = useRef(false);     // chống submit trùng

    const total = data.questions.length;
    const [answers, setAnswers] = useState(
        () => new Map((data.responses || []).map(r => [r.questionId, r.selectedIndex]))
    );
    const [idx, setIdx] = useState(() => {
        const firstUn = data.questions.findIndex(q => !answers.has(q.id));
        return firstUn >= 0 ? firstUn : 0;
    });
    const active = data.questions[idx];

    const endsAt = useMemo(() => (data.endsAtISO ? new Date(data.endsAtISO) : null), [data.endsAtISO]);
    const [now, setNow] = useState(() => new Date());

    // Fullscreen gate
    const [fsRequired, setFsRequired] = useState(() => (typeof document !== 'undefined' && !document.fullscreenElement));

    // Popup trung tâm (chuyển tab/printscreen)
    const [popup, setPopup] = useState({ open: false, title: '', message: '' });

    // Đếm vi phạm chuyển tab
    const [violations, setViolations] = useState(0);

    // ===== Fixed card height theo câu dài nhất =====
    const panelRef = useRef(null);
    const sizerRef = useRef(null);
    const [panelWidth, setPanelWidth] = useState(0);
    const [panelMinH, setPanelMinH] = useState(420);

    // Quan sát độ rộng panel để đo lại chiều cao tối đa
    useEffect(() => {
        if (!panelRef.current) return;
        const updateW = () => setPanelWidth(panelRef.current.offsetWidth || 0);
        updateW();
        const ro = new ResizeObserver(updateW);
        ro.observe(panelRef.current);
        return () => ro.disconnect();
    }, []);

    // Đo chiều cao tối đa dựa trên câu dài nhất (tại width hiện tại)
    useEffect(() => {
        if (!sizerRef.current || !panelWidth) return;
        let maxH = 0;
        const items = sizerRef.current.querySelectorAll('[data-sizer-item]');
        items.forEach(el => { maxH = Math.max(maxH, el.offsetHeight); });
        if (maxH) setPanelMinH(maxH);
    }, [panelWidth, data.questions]);

    // Tick + heartbeat
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        const hb = setInterval(() => { heartbeatQuiz({ userId }); }, 15000);
        return () => { clearInterval(t); clearInterval(hb); };
    }, [userId]);

    // Hết thời gian -> tự nộp
    useEffect(() => {
        if (endsAt && now >= endsAt) {
            run(submitQuiz, [{ userId }], {
                onSuccess: () => router.replace('/thi'),
                successMessage: 'Đã tự động nộp bài khi hết thời gian.',
            });
        }
    }, [now, endsAt, run, router, userId]);

    // Anti-copy + phát hiện chuyển tab + theo dõi fullscreen
    useEffect(() => {
        const onCopy = (e) => { e.preventDefault(); };
        const onCtx = (e) => { e.preventDefault(); };
        const onKey = (e) => {
            if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) e.preventDefault();
            if (e.key?.toLowerCase() === 'printscreen') {
                setPopup({
                    open: true,
                    title: 'Nội dung tạm ẩn',
                    message: 'Bạn vừa thao tác chụp màn hình. Nhấn tiếp tục để làm bài.'
                });
            }
        };
        const onVis = () => {
            if (document.hidden) {
                setViolations(v => {
                    const nv = v + 1;
                    const left = Math.max(0, MAX_TAB_VIOLATIONS - nv);
                    setPopup({
                        open: true,
                        title: 'Cảnh báo chuyển tab',
                        message: nv <= MAX_TAB_VIOLATIONS
                            ? `Phát hiện chuyển tab (${nv}/${MAX_TAB_VIOLATIONS}). Còn ${left} lần trước khi tự động nộp.`
                            : 'Bạn đã vượt quá số lần cho phép. Hệ thống sẽ tự động nộp bài.'
                    });
                    if (nv > MAX_TAB_VIOLATIONS && !autoSubmitRef.current) {
                        autoSubmitRef.current = true;
                        run(submitQuiz, [{ userId }], {
                            onSuccess: () => router.replace('/thi'),
                            successMessage: 'Đã tự động nộp bài do vi phạm chuyển tab quá số lần cho phép.',
                            toast: false,
                        });
                    }
                    return nv;
                });
            }
        };
        const onFsChange = () => setFsRequired(!document.fullscreenElement);

        document.addEventListener('copy', onCopy);
        document.addEventListener('contextmenu', onCtx);
        document.addEventListener('keydown', onKey);
        document.addEventListener('visibilitychange', onVis);
        document.addEventListener('fullscreenchange', onFsChange);

        const onUnload = () => { try { navigator.sendBeacon('/api/exam/auto-submit'); } catch { } };
        window.addEventListener('beforeunload', onUnload);

        return () => {
            document.removeEventListener('copy', onCopy);
            document.removeEventListener('contextmenu', onCtx);
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('visibilitychange', onVis);
            document.removeEventListener('fullscreenchange', onFsChange);
            window.removeEventListener('beforeunload', onUnload);
        };
    }, [run, router, userId]);

    const timeLeftSec = endsAt ? Math.max(0, Math.floor((endsAt.getTime() - now.getTime()) / 1000)) : 0;
    const mm = String(Math.floor(timeLeftSec / 60)).padStart(2, '0');
    const ss = String(timeLeftSec % 60).padStart(2, '0');

    const answeredCount = Array.from(answers.values()).filter(v => typeof v === 'number').length;

    const choose = (qid, selectedIndex) => {
        setAnswers(m => {
            const mm = new Map(m);
            mm.set(qid, selectedIndex);
            return mm;
        });
        run(recordQuizResponse, [{ userId, questionId: qid, selectedIndex }], {
            toast: false, overlay: false, autoRefresh: false, silent: true,
        });
    };

    const goPrev = () => setIdx(i => Math.max(0, i - 1));
    const goNext = () => setIdx(i => Math.min(total - 1, i + 1));
    const jumpTo = (i) => setIdx(Math.min(Math.max(0, i), total - 1));

    return (
        <main className="relative min-h-screen bg-[var(--surface-2,#f8fafc)] md:pb-0 pb-24 flex justify-center items-center">
            <div className="h-full max-w-6xl px-3 sm:px-4 md:px-6 py-4 md:py-6">
                {/* Grid: content + right panel */}
                <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                    {/* Question card */}
                    <section className="info-card md:p-6">
                        {/* Header row */}
                        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-sm text-slate-600">
                                Câu <b className="tabular-nums">{idx + 1}</b>/<span className="tabular-nums">{total}</span>
                                <span className="mx-2 hidden sm:inline">•</span>
                                <span className="sm:inline hidden">Đã trả lời <b className="tabular-nums">{answeredCount}</b></span>
                            </div>
                            <div className="text-xs text-slate-500">
                                Vi phạm chuyển tab: <b className="tabular-nums">{violations}</b>/{MAX_TAB_VIOLATIONS}
                            </div>
                        </div>

                        {/* Question body — GIỮ CHIỀU CAO CỐ ĐỊNH */}
                        <article
                            ref={panelRef}
                            className="rounded-xl ring-1 ring-black/5 border border-black/5 p-4 md:p-5"
                            style={{ minHeight: panelMinH }}
                        >
                            <h2 className="mb-4 font-medium leading-6">Câu {idx + 1}. {active.text}</h2>
                            <div className="grid gap-1">
                                {active.choices.map((c, ci) => {
                                    const checked = answers.get(active.id) === ci;
                                    return (
                                        <label
                                            key={ci}
                                            className={[
                                                'group flex items-start gap-3 rounded-xl p-3 cursor-pointer transition',
                                                'bg-white/70 hover:bg-slate-50 ring-1 ring-transparent',
                                                checked ? 'ring-2 ring-brand bg-brand/5' : ''
                                            ].join(' ')}
                                        >
                                            <input
                                                type="radio"
                                                name={`q_${active.id}`}
                                                className="mt-1"
                                                checked={checked || false}
                                                onChange={() => choose(active.id, ci)}
                                            />
                                            <span className="text-sm leading-6">{c}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </article>

                        {/* Navigation buttons */}
                        <div className="mt-4 flex items-center justify-between gap-3">
                            <button onClick={goPrev} disabled={idx === 0} className="btn-outline disabled:opacity-50">
                                ← Câu trước
                            </button>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => {
                                        run(submitQuiz, [{ userId }], {
                                            onSuccess: () => router.replace('/thi'),
                                            successMessage: 'Đã nộp bài trắc nghiệm.',
                                        });
                                    }}
                                    className="btn-brand"
                                >
                                    Nộp bài
                                </button>
                                <button onClick={goNext} disabled={idx === total - 1} className="btn-outline disabled:opacity-50">
                                    Câu tiếp →
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Right sticky panel (desktop / tablet) */}
                    <aside className="hidden md:block md:sticky md:top-4">
                        <div className="info-card p-4 md:p-5 h-full">
                            {/* Timer */}
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-semibold">Thời gian còn lại</div>
                                <div className="rounded-md ring-1 ring-black/10 px-2 py-1 text-sm tabular-nums">
                                    {mm}:{ss}
                                </div>
                            </div>

                            {/* Submit */}
                            <div className="mt-3 flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        run(submitQuiz, [{ userId }], {
                                            onSuccess: () => router.replace('/thi'),
                                            successMessage: 'Đã nộp bài trắc nghiệm.',
                                        });
                                    }}
                                    className="btn-brand flex-1"
                                >
                                    Nộp bài
                                </button>
                            </div>

                            {/* Grid question numbers */}
                            <div className="mt-5">
                                <div className="mb-2 text-sm font-semibold">Bảng câu hỏi</div>
                                <div className="grid grid-cols-5 gap-2">
                                    {data.questions.map((q, i) => {
                                        const isAnswered = answers.has(q.id);
                                        const isActive = i === idx;
                                        return (
                                            <button
                                                key={q.id}
                                                onClick={() => jumpTo(i)}
                                                className={[
                                                    'h-9 rounded-md text-sm font-medium ring-1 transition',
                                                    isActive
                                                        ? 'bg-brand text-white ring-brand'
                                                        : isAnswered
                                                            ? 'bg-brand/10 text-brand ring-brand/30'
                                                            : 'ring-slate-300 hover:bg-slate-50'
                                                ].join(' ')}
                                                title={isAnswered ? 'Đã trả lời' : 'Chưa trả lời'}
                                            >
                                                {i + 1}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="py-2">
                                <p className="mt-4 text-xs text-slate-500">
                                    Chú ý: Chuyển tab quá nhiều lần sẽ bị hệ thống coi là gian lận và tự động nộp bài.
                                </p>
                            </div>
                        </div>
                    </aside>
                </div>

                {/* Hidden sizer để đo chiều cao tối đa theo width thực tế */}
                <div
                    ref={sizerRef}
                    className="absolute -left-[9999px] -top-[9999px]"
                    style={{ width: panelWidth || 800 }}
                    aria-hidden="true"
                >
                    {data.questions.map((q, i) => (
                        <div key={q.id} data-sizer-item className="rounded-xl ring-1 ring-black/5 border border-black/5 p-5 mb-4">
                            <div className="mb-4 font-medium leading-6">Câu {i + 1}. {q.text}</div>
                            <div className="grid gap-2">
                                {q.choices.map((_, ci) => (
                                    <div key={ci} className="rounded-xl p-3 bg-white/70" />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom bar (mobile) */}
            <div className="md:hidden fixed inset-x-0 bottom-0 z-30 border-t bg-white/95 backdrop-blur px-3 py-2">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-2 flex items-center justify-between">
                        <div className="rounded-md ring-1 ring-black/10 px-2 py-1 text-sm tabular-nums">{mm}:{ss}</div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    run(submitQuiz, [{ userId }], {
                                        onSuccess: () => router.replace('/thi'),
                                        successMessage: 'Đã nộp bài trắc nghiệm.',
                                    });
                                }}
                                className="btn-brand px-4 py-1.5"
                            >
                                Nộp bài
                            </button>
                            <button onClick={goNext} disabled={idx === total - 1} className="btn-outline px-3 py-1.5 disabled:opacity-50">→</button>
                        </div>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {data.questions.map((q, i) => {
                            const isAnswered = answers.has(q.id);
                            const isActive = i === idx;
                            return (
                                <button
                                    key={q.id}
                                    onClick={() => jumpTo(i)}
                                    className={[
                                        'min-w-9 h-9 px-2 rounded-md text-sm font-medium ring-1',
                                        isActive
                                            ? 'bg-brand text-white ring-brand'
                                            : isAnswered
                                                ? 'bg-brand/10 text-brand ring-brand/30'
                                                : 'ring-slate-300'
                                    ].join(' ')}
                                >
                                    {i + 1}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Fullscreen required gate */}
            {fsRequired && (
                <div className="fixed inset-0 z-[100] grid place-items-center bg-white/90 backdrop-blur-sm">
                    <div className="max-w-md rounded-2xl border p-6 shadow-lg text-center bg-white">
                        <h2 className="text-lg font-semibold">Vui lòng bật Toàn màn hình</h2>
                        <p className="mt-2 text-sm text-slate-600">
                            Để đảm bảo trải nghiệm và công bằng, chế độ toàn màn hình là bắt buộc trong suốt quá trình làm bài.
                        </p>
                        <button
                            className="btn-brand mt-4"
                            onClick={async () => {
                                try { await document.documentElement.requestFullscreen(); } catch { }
                                // trạng thái cập nhật bởi fullscreenchange
                            }}
                        >
                            Bật Toàn màn hình
                        </button>
                    </div>
                </div>
            )}

            {/* Popup cảnh báo trung tâm */}
            {popup.open && !fsRequired && (
                <div className="fixed inset-0 z-[95] grid place-items-center bg-black/20 backdrop-blur-[2px]">
                    <div className="max-w-md rounded-2xl border bg-white p-6 text-center shadow-xl">
                        <h2 className="text-lg font-semibold">{popup.title || 'Thông báo'}</h2>
                        <p className="mt-2 text-sm text-slate-600">{popup.message}</p>
                        <button className="btn-brand mt-4" onClick={() => setPopup(p => ({ ...p, open: false }))}>
                            Tiếp tục làm bài
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}

/* =========================
 * ESSAY
 * ========================= */
function EssayForm({ userId, defaultValue, disabled }) {
    const router = useRouter();
    const { run } = useActionFeedback();
    const [content, setContent] = useState(defaultValue || '');
    useEffect(() => { setContent(defaultValue || ''); }, [defaultValue]);

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                run(submitEssay, [{ userId, content }], {
                    successMessage: 'Đã lưu/chốt phiên bản bài tự luận.',
                    onSuccess: () => {
                        // chờ 1s rồi về /thi
                        setTimeout(() => router.replace('/thi'), 1000);
                    },
                });
            }}
            className="mt-4 space-y-4"
        >
            <div className="info-card">
                <div className="border-b px-4 py-2 text-xs text-slate-500">Soạn bài (tối đa 3000 ký tự)</div>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={disabled}
                    placeholder="Viết bài (≤ 3000 ký tự)…"
                    rows={14}
                    className="w-full rounded-b-2xl p-4 outline-none"
                    style={{ resize: 'vertical' }}
                />
            </div>
            <div className="flex items-center gap-3">
                <button disabled={disabled || !content.trim()} className="btn-brand disabled:opacity-60">
                    Lưu / Nộp phiên bản
                </button>
                {disabled && <span className="text-sm text-slate-600">Bạn đã hết lượt chỉnh sửa/nộp.</span>}
            </div>
        </form>
    );
}
