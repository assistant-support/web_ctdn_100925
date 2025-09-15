// lib/examConfig.js
function parseDeadline(v) {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
}

// Hạn chót tự luận theo yêu cầu: 23:59 31/10/2025 (GMT+7)
const FIXED_DEADLINE = '2025-10-31T23:59:00+07:00';

export function getExamConfig() {
    const essayDeadline = parseDeadline(FIXED_DEADLINE);

    return {
        quiz: {
            maxStarts: 1,
            deadline: essayDeadline,
            durationMinutes: null,
        },
        essay: {
            maxAttempts: 3,
            deadline: essayDeadline,
        },
    };
}
