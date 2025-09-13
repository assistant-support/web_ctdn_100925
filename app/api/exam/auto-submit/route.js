// app/api/exam/auto-submit/route.js
export const runtime = 'nodejs';

import { auth } from '@/auth';
import { submitQuiz } from '@/app/(exam)/thi/[id]/actions';

export async function POST() {
    const s = await auth();
    if (!s?.user?.id) return new Response('Unauthorized', { status: 401 });

    const userId = String(s.user.id);
    try {
        // An toàn: nếu chưa tới hạn hoặc đã nộp rồi, action sẽ không lỗi
        await submitQuiz({ userId });
    } catch (e) {
        // không lộ chi tiết, trả 200 để beacon không retry lung tung
        console.error('auto-submit failed:', e?.message || e);
    }
    return new Response('OK', { status: 200 });
}
