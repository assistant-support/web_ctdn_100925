export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import connectDB from '@/lib/mongodb';
import { Account } from '@/model/account.model';

// Validate payload
const BodySchema = z.object({
    cccd: z.string().regex(/^\d{12}$/, 'CCCD phải gồm 12 chữ số.'),
    scopes: z.array(z.enum(['quiz', 'essay'])).optional().default(['quiz', 'essay']),
});

// Ẩn CCCD trong response
function mask(n) {
    const s = String(n || '').replace(/\D/g, '');
    return s.length === 12 ? `${s.slice(0, 4)}******${s.slice(-2)}` : '';
}

export async function POST(req) {


    // 2) Parse + validate input
    let body;
    try {
        const json = await req.json();
        body = BodySchema.parse(json);
    } catch (e) {
        const msg = e?.errors?.[0]?.message || 'Invalid payload';
        return NextResponse.json({ ok: false, error: msg }, { status: 400 });
    }

    const { cccd, scopes } = body;

    // 3) DB
    await connectDB();
    const acc = await Account.findOne({ nationalId: cccd });
    if (!acc) {
        return NextResponse.json({ ok: false, error: 'Không tìm thấy tài khoản' }, { status: 404 });
    }

    // Snapshot trước khi reset (để audit/hiển thị cho admin)
    const previous = {
        quiz: {
            status: acc.exam?.quiz?.status ?? null,
            score: acc.exam?.quiz?.score ?? 0,
            startedAt: acc.exam?.quiz?.startedAt ?? null,
            submittedAt: acc.exam?.quiz?.submittedAt ?? null,
        },
        essay: {
            bestScore: acc.exam?.essay?.bestScore ?? 0,
            attempts: acc.exam?.essay?.attempts?.length ?? 0,
        },
        totalScore: acc.exam?.totalScore ?? 0,
    };

    // 4) Reset theo scopes
    if (scopes.includes('quiz')) {
        acc.exam.quiz = {
            status: 'not_started',
            startedAt: null,
            submittedAt: null,
            questionIds: [],
            choiceOrders: [],
            responses: [],
            score: 0,
            locked: false,
        };
    }
    if (scopes.includes('essay')) {
        acc.exam.essay = {
            attempts: [],
            bestScore: 0,
        };
    }

    // pre('save') trong model sẽ tự cập nhật exam.totalScore
    await acc.save();

    // 5) Response
    return NextResponse.json({
        ok: true,
        reset: { scopes },
        user: {
            id: String(acc._id),
            email: acc.email,
            fullName: acc.fullName,
            nationalIdMasked: mask(acc.nationalId),
        },
        previous,
        now: {
            quiz: {
                status: acc.exam?.quiz?.status ?? null,
                score: acc.exam?.quiz?.score ?? 0,
            },
            essay: {
                bestScore: acc.exam?.essay?.bestScore ?? 0,
                attempts: acc.exam?.essay?.attempts?.length ?? 0,
            },
            totalScore: acc.exam?.totalScore ?? 0,
        },
    });
}
