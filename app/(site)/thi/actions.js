// app/thi/actions.js
'use server'

import { auth } from '@/auth'
import connectDB from '@/lib/mongodb'
import { Account } from '@/model/account.model'
import { getExamConfig } from '@/lib/examConfig'

function canUseQuiz(quiz, deadline, maxStarts = 1) {
    const used = quiz?.status === 'submitted' ? 1 : 0;
    const overStart = used >= maxStarts || quiz?.locked;
    const deadlinePassed = deadline ? (Date.now() > deadline.getTime()) : false;
    const alreadySubmitted = quiz?.status === 'submitted';
    return {
        allowed: !overStart && !deadlinePassed && !alreadySubmitted,
        reason: alreadySubmitted ? 'Bạn đã nộp bài trắc nghiệm.'
            : overStart ? 'Đã hết lượt làm trắc nghiệm.'
                : deadlinePassed ? 'Đã quá hạn trắc nghiệm.' : ''
    };
}

function canUseEssay(essay, deadline, maxAttempts = 3) {
    const attempts = Array.isArray(essay?.attempts) ? essay.attempts.length : 0;
    const over = attempts >= maxAttempts;
    const deadlinePassed = deadline ? (Date.now() > deadline.getTime()) : false;
    return {
        allowed: !over && !deadlinePassed,
        reason: over ? 'Đã hết lượt nộp tự luận.'
            : deadlinePassed ? 'Đã quá hạn tự luận.' : ''
    };
}

export async function getExamDashboard() {
    const session = await auth()
    if (!session?.user?.id) throw new Error('UNAUTHORIZED')

    await connectDB()
    const cfg = getExamConfig()

    const doc = await Account.findById(session.user.id, {
        _id: 1,
        fullName: 1,
        email: 1,
        'exam.quiz.status': 1,
        'exam.quiz.submittedAt': 1,
        'exam.quiz.score': 1,
        'exam.quiz.locked': 1,
        'exam.essay.attempts': 1,
    }).lean()

    if (!doc) throw new Error('NOT_FOUND')

    const quiz = doc.exam?.quiz || {}
    const essay = doc.exam?.essay || { attempts: [] }

    const quizGate = canUseQuiz(quiz, cfg.quiz.deadline, cfg.quiz.maxStarts)
    const essayGate = canUseEssay(essay, cfg.essay.deadline, cfg.essay.maxAttempts)

    // thời gian nộp gần nhất
    const quizLast = quiz.submittedAt || null
    const essayLast = (Array.isArray(essay.attempts) ? essay.attempts : [])
        .map(a => a.submittedAt).filter(Boolean)
        .sort((a, b) => new Date(b) - new Date(a))[0] || null

    return {
        userId: String(doc._id),
        name: doc.fullName,
        email: doc.email,

        quiz: {
            status: quiz.status || 'not_started',
            usedStarts: quiz.status === 'submitted' ? 1 : 0,
            maxStarts: cfg.quiz.maxStarts, // = 1
            deadline: cfg.quiz.deadline?.toISOString() || null,
            lastSubmittedAt: quizLast,
            canStart: quizGate.allowed,
            reason: quizGate.reason,
        },

        essay: {
            usedAttempts: Array.isArray(essay.attempts) ? essay.attempts.length : 0,
            maxAttempts: cfg.essay.maxAttempts, // = 3
            deadline: cfg.essay.deadline?.toISOString() || null,
            lastSubmittedAt: essayLast,
            canAttempt: essayGate.allowed,
            reason: essayGate.reason,
        },
    }
}
