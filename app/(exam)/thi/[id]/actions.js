// app/(exam)/thi/[id]/actions.js
'use server'

import { auth } from '@/auth'
import connectDB from '@/lib/mongodb'
import { Account } from '@/model/account.model'
import { getExamConfig } from '@/lib/examConfig'
import { QUIZ } from '@/data/mcq'

// ===== helpers =====
function shuffle(arr) {
    const a = arr.slice()
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
            ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}
function sampleIds(allIds, n) {
    return shuffle(allIds).slice(0, n)
}
function getOrderFor(questionId, choiceOrders) {
    const x = (choiceOrders || []).find(o => o.questionId === questionId)
    return x?.order || [0, 1, 2, 3]
}
function canUseQuiz(quiz, deadline, maxStarts = 1) {
    const used = quiz?.status === 'submitted' ? 1 : 0
    const overStart = used >= maxStarts || quiz?.locked
    const deadlinePassed = deadline ? (Date.now() > deadline.getTime()) : false
    const alreadySubmitted = quiz?.status === 'submitted'
    return {
        allowed: !overStart && !deadlinePassed && !alreadySubmitted,
        reason: alreadySubmitted ? 'Bạn đã nộp bài trắc nghiệm.'
            : overStart ? 'Đã hết lượt làm trắc nghiệm.'
                : deadlinePassed ? 'Đã quá hạn trắc nghiệm.' : ''
    }
}
function canUseEssay(essay, deadline, maxAttempts = 3) {
    const attempts = Array.isArray(essay?.attempts) ? essay.attempts.length : 0
    const over = attempts >= maxAttempts
    const deadlinePassed = deadline ? (Date.now() > deadline.getTime()) : false
    return {
        allowed: !over && !deadlinePassed,
        reason: over ? 'Đã hết lượt nộp tự luận.'
            : deadlinePassed ? 'Đã quá hạn tự luận.' : ''
    }
}

function ensureAuth(session, userId) {
    if (!session?.user?.id) throw new Error('UNAUTHORIZED')
    if (String(session.user.id) !== String(userId)) throw new Error('FORBIDDEN')
}

function assemblePack(questionIds, choiceOrders) {
    const qmap = new Map(QUIZ.questions.map(q => [q.id, q]))
    return questionIds.map((qid, idx) => {
        const q = qmap.get(qid)
        const order = getOrderFor(qid, choiceOrders)
        const displayed = order.map(i => q.choices[i])
        return {
            idx: idx + 1,
            questionId: q.id,
            text: q.text,
            choices: displayed,      // đã xáo trộn
        }
    })
}

function scoreFromStored(quizDoc) {
    const qmap = new Map(QUIZ.questions.map(q => [q.id, q]))
    const orders = quizDoc.choiceOrders || []
    const responses = quizDoc.responses || []
    let pts = 0
    for (const r of responses) {
        const q = qmap.get(r.questionId)
        if (!q) continue
        const order = getOrderFor(r.questionId, orders)
        const originalIndex = order[r.selectedIndex] // chuyển từ vị trí hiển thị về chỉ số gốc
        if (originalIndex === q.answerIndex) pts += QUIZ.pointsPerCorrect
    }
    // Giới hạn theo schema (tối đa 40)
    return Math.min(40, Math.max(0, pts))
}

// ===== actions =====
export async function getExamEntry({ userId, mode }) {
    const session = await auth()
    ensureAuth(session, userId)

    await connectDB()
    const cfg = getExamConfig()

    const doc = await Account.findById(userId, {
        _id: 1, fullName: 1, email: 1,
        'exam.quiz': 1,
        'exam.essay.attempts': 1,
    }).lean()

    if (!doc) throw new Error('NOT_FOUND')
    const quiz = doc.exam?.quiz || {}
    const essay = doc.exam?.essay || { attempts: [] }

    if (mode === 'quiz') {
        const gate = canUseQuiz(quiz, cfg.quiz.deadline, cfg.quiz.maxStarts)
        // Nếu chưa bắt đầu, vẫn cho vào trang để bấm "Bắt đầu", nếu đã nộp thì chặn ở trang /thi
        if (!gate.allowed && quiz?.status !== 'in_progress') {
            return { ok: false, redirect: '/thi' }
        }

        // Nếu chưa có bộ đề => tạo
        let questionIds = quiz.questionIds || []
        let choiceOrders = quiz.choiceOrders || []
        let startedAt = quiz.startedAt || null

        if (!questionIds?.length || !choiceOrders?.length) {
            const allIds = QUIZ.questions.map(q => q.id)
            questionIds = sampleIds(allIds, QUIZ.perAttemptCount)
            choiceOrders = questionIds.map(qid => ({
                questionId: qid, order: shuffle([0, 1, 2, 3]),
            }))
            // không lưu ở đây để tránh bắt đầu khi chưa bấm "Bắt đầu"
        }

        // pack xem trước (không lộ đáp án)
        const pack = assemblePack(questionIds, choiceOrders)

        // nếu đã in_progress thì endAt có giá trị
        const durationMs = (getExamConfig().quiz.durationMinutes || 20) * 60_000
        const endAt = startedAt ? new Date(new Date(startedAt).getTime() + durationMs) : null

        // ghép đáp án đã chọn (nếu có)
        const selectedMap = new Map((quiz.responses || []).map(r => [r.questionId, r.selectedIndex]))

        return {
            ok: true,
            mode: 'quiz',
            userId: String(doc._id),
            name: doc.fullName,
            email: doc.email,
            deadline: cfg.quiz.deadline?.toISOString() || null,
            status: quiz.status || 'not_started',
            durationMinutes: cfg.quiz.durationMinutes || 20,
            startedAt: startedAt ? new Date(startedAt).toISOString() : null,
            endAt: endAt ? endAt.toISOString() : null,
            pack,
            selected: Object.fromEntries(selectedMap),
            // Mang theo để "bắt đầu" chính xác (gắn vào DB khi bấm Bắt đầu)
            seed: { questionIds, choiceOrders },
            gateReason: gate.reason,
        }
    }

    if (mode === 'essay') {
        const gate = canUseEssay(essay, cfg.essay.deadline, cfg.essay.maxAttempts)
        if (!gate.allowed) return { ok: false, redirect: '/thi' }

        return {
            ok: true,
            mode: 'essay',
            userId: String(doc._id),
            name: doc.fullName,
            email: doc.email,
            deadline: cfg.essay.deadline?.toISOString() || null,
            usedAttempts: Array.isArray(essay.attempts) ? essay.attempts.length : 0,
            maxAttempts: cfg.essay.maxAttempts || 3,
        }
    }

    return { ok: false, redirect: '/thi' }
}

export async function startQuizAction(prev, formData) {
    const userId = formData.get('userId')
    const seed = JSON.parse(formData.get('seed') || '{}') // { questionIds, choiceOrders }
    const durationMs = (getExamConfig().quiz.durationMinutes || 20) * 60_000

    const session = await auth()
    ensureAuth(session, userId)
    await connectDB()

    const doc = await Account.findById(userId).select('exam.quiz').exec()
    if (!doc) return { ok: false, error: 'Không tìm thấy tài khoản.' }

    const qz = doc.exam?.quiz || {}
    if (qz.status === 'submitted') return { ok: false, error: 'Bạn đã nộp bài.' }

    if (qz.status !== 'in_progress') {
        // Lưu seed được tạo ở getExamEntry
        qz.status = 'in_progress'
        qz.startedAt = new Date()
        qz.questionIds = seed.questionIds
        qz.choiceOrders = seed.choiceOrders
        qz.responses = []
        doc.exam.quiz = qz
        await doc.save()
    }

    const endAt = new Date(new Date(qz.startedAt).getTime() + durationMs)
    return { ok: true, endAt: endAt.toISOString() }
}

export async function saveQuizResponseAction(prev, formData) {
    const userId = formData.get('userId')
    const questionId = formData.get('questionId')
    const selectedIndex = Number(formData.get('selectedIndex'))

    const session = await auth()
    ensureAuth(session, userId)
    await connectDB()

    const doc = await Account.findById(userId).select('exam.quiz').exec()
    if (!doc) return { ok: false }
    const qz = doc.exam?.quiz || {}
    if (qz.status !== 'in_progress') return { ok: false }

    if (!Array.isArray(qz.responses)) qz.responses = []
    const i = qz.responses.findIndex(r => r.questionId === questionId)
    if (i >= 0) {
        qz.responses[i].selectedIndex = selectedIndex
        qz.responses[i].selectedAt = new Date()
    } else {
        qz.responses.push({ questionId, selectedIndex, selectedAt: new Date() })
    }
    doc.exam.quiz = qz
    await doc.save()
    return { ok: true }
}

export async function submitQuizAction(prev, formData) {
    const userId = formData.get('userId')

    const session = await auth()
    ensureAuth(session, userId)
    await connectDB()

    const doc = await Account.findById(userId).select('exam.quiz').exec()
    if (!doc) return { ok: false }
    const qz = doc.exam?.quiz || {}

    if (qz.status !== 'submitted') {
        const score = scoreFromStored(qz)
        qz.status = 'submitted'
        qz.submittedAt = new Date()
        qz.locked = true
        qz.score = score
        doc.exam.quiz = qz
        await doc.save()
    }
    return { ok: true }
}

export async function submitEssayAction(prev, formData) {
    const userId = formData.get('userId')
    const content = String(formData.get('content') || '').trim() || '[AUTO-SUBMIT]'

    const session = await auth()
    ensureAuth(session, userId)
    await connectDB()

    const cfg = getExamConfig()
    const doc = await Account.findById(userId).select('exam.essay').exec()
    if (!doc) return { ok: false, error: 'Không tìm thấy tài khoản.' }

    const e = doc.exam?.essay || { attempts: [], bestScore: 0 }
    if (!Array.isArray(e.attempts)) e.attempts = []
    if (e.attempts.length >= (cfg.essay.maxAttempts || 3)) {
        return { ok: false, error: 'Đã hết lượt nộp.' }
    }
    e.attempts.push({ content, submittedAt: new Date(), score: 0 })
    doc.exam.essay = e
    await doc.save()
    return { ok: true }
}
