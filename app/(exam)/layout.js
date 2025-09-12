export const dynamic = 'force-dynamic'
export const revalidate = 0
import '../globals.css'
export default function ExamLayout({ children }) {
    return (
        <html>
            <body className="min-h-screen bg-slate-50">
                {children}
            </body>
        </html>
    )
}