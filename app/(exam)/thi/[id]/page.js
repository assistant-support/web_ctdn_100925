export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { getExamEntry, startQuiz } from './actions';
import ExamClient from './ExamClient';
import FormPendingOverlay, { SubmitButton } from './FormPendingOverlay';
import { redirect } from 'next/navigation';

export default async function Page({ params, searchParams }) {
    const userId = params.id;
    const mode = (searchParams?.mode === 'essay') ? 'essay' : 'quiz';
    const entry = await getExamEntry({ userId, mode });

    if (!entry?.ok && entry?.redirect) {
        return <meta httpEquiv="refresh" content={`0;url=${entry.redirect}`} />;
    }

    // Server action bao form: start → redirect ngay
    async function startAndGo() {
        'use server';
        await startQuiz({ userId });     // lưu Mongo trước
        redirect(`/thi/${userId}`);      // điều hướng tức thì, không chờ re-render trang hiện tại
    }

    if (entry.ok && entry.stage === 'rules' && entry.mode === 'quiz') {
        const { config } = entry;
        const deadlineStr = config.deadlineISO ? new Date(config.deadlineISO).toLocaleString() : '—';

        const Check = (
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-brand" fill="none" stroke="currentColor" aria-hidden="true">
                <path d="M20 6L9 17l-5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        );

        return (
            <main className="min-h-[calc(100vh-64px)] bg-[var(--surface-2,#f8fafc)]">
                <div className="mx-auto max-w-4xl px-4 py-8 md:py-12">
                    <header className="mb-5">
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Nội quy thi trắc nghiệm</h1>
                        <p className="mt-2 text-sm text-slate-600">
                            Vui lòng đọc kỹ trước khi bắt đầu. Khi bấm <b>Bắt đầu làm bài</b>, bạn đồng ý tuân thủ toàn bộ nội quy.
                        </p>
                    </header>

                    <section className="info-card md:p-7 ring-brand/20">
                        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Quy định làm bài</h2>
                        <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
                            <li className="flex items-start gap-3"><span className="mt-1">{Check}</span>Mỗi thí sinh chỉ được làm <b className="tabular-nums">01</b> phần trắc nghiệm.</li>
                            <li className="flex items-start gap-3"><span className="mt-1">{Check}</span>Thời lượng <b className="tabular-nums">{config.durationMinutes} phút</b> kể từ lúc xác nhận bắt đầu.</li>
                            <li className="flex items-start gap-3"><span className="mt-1">{Check}</span>Gồm <b className="tabular-nums">{config.perAttemptCount}</b> câu hỏi, chọn <b>01</b> đáp án đúng nhất cho mỗi câu.</li>
                            {config.deadlineISO && (
                                <li className="flex items-start gap-3">
                                    <span className="mt-1">{Check}</span>Hạn chót hệ thống: <b>{deadlineStr}</b> (GMT+7).
                                </li>
                            )}
                            <li className="flex items-start gap-3"><span className="mt-1">{Check}</span>Hết giờ hoặc thoát giữa chừng, hệ thống sẽ <b className="text-brand">tự động nộp</b> bài hiện có.</li>
                        </ul>

                        <form action={startAndGo} className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <FormPendingOverlay />
                            <p className="text-xs text-slate-500">Bằng việc bấm <b>Bắt đầu làm bài</b>, bạn xác nhận đã đọc và đồng ý nội quy.</p>
                            <div className="flex gap-3">
                                <a href="/thi" className="btn-outline">Quay về</a>
                                <SubmitButton> Tôi đã đọc và đồng ý — Bắt đầu làm bài </SubmitButton>
                            </div>
                        </form>
                    </section>
                </div>
            </main>
        );
    }

    return <ExamClient entry={entry} userId={userId} mode={mode} />;
}
