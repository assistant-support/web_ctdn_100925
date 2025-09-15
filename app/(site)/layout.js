import '../globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Cuộc thi Đối ngoại nhân dân Đồng Nai 2025',
  description: 'Thi trực tuyến: trắc nghiệm & tự luận',
}
export default function RootLayout({ children }) {
  return (
    <html lang="vi" className="scroll-smooth">
      <body className="antialiased text-slate-800 bg-gradient-to-b from-white to-slate-50">
        {/* Header cố định, blur mờ, tối ưu paint */}
        <Header />
        {/* Đệm cho header cố định */}
        <main className="pt-16 overflow-hidden">{children}</main>
        <Footer />
      </body>
    </html>
  )
}