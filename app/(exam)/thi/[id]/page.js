// app/(exam)/thi/[id]/page.js
import { getExamEntry } from './actions'
import ExamClient from './ExamClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Page({ params, searchParams }) {
    const userId = params.id
    const mode = (searchParams?.mode === 'essay') ? 'essay' : 'quiz'
    const entry = await getExamEntry({ userId, mode })
    if (!entry?.ok && entry?.redirect) {
        // Trả về RSC redirect nhẹ
        return (
            <meta httpEquiv="refresh" content={`0;url=${entry.redirect}`} />
        )
    }
    return <ExamClient entry={entry} />
}
