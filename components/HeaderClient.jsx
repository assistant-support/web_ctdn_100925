'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

// Actions (giữ nguyên import như bạn yêu cầu)
import { loginAction, signOutAction } from '@/app/(auth)/login/actions'
import { registerAction } from '@/app/(auth)/register/actions'

import { useActionFeedback } from '@/hooks/useAction'
import {
  Menu, X, LogIn, LogOut, UserPlus, ChevronDown, ChevronRight,
  FileText, HelpCircle, FlagTriangleRight, Trophy
} from 'lucide-react'

function maskCCCD(cccd) {
  const s = String(cccd || '').replace(/\D/g, '')
  if (s.length !== 12) return ''
  return `${s.slice(0, 4)}******${s.slice(-2)}`
}

export default function HeaderClient({ user }) {
  const router = useRouter()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authTab, setAuthTab] = useState('login')
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const loginAF = useActionFeedback({ successMessage: 'Đăng nhập thành công.' })
  const registerAF = useActionFeedback({ successMessage: 'Tạo tài khoản thành công.' })

  // hash #dang-nhap
  useEffect(() => {
    const openFromHash = () => {
      if (location.hash === '#dang-nhap') {
        setAuthTab('login'); setAuthOpen(true)
        history.replaceState(null, '', location.pathname + location.search)
      }
    }
    openFromHash()
    window.addEventListener('hashchange', openFromHash)
    const onOpen = (e) => { setAuthTab(e.detail?.tab || 'login'); setAuthOpen(true) }
    window.addEventListener('open-auth-modal', onOpen)
    return () => {
      window.removeEventListener('hashchange', openFromHash)
      window.removeEventListener('open-auth-modal', onOpen)
    }
  }, [])

  // ESC
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setAuthOpen(false); setMobileOpen(false); setUserMenuOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // click outside để đóng popup user
  const userMenuRef = useRef(null)
  const userChipRef = useRef(null)
  useEffect(() => {
    function onClickOutside(e) {
      if (!userMenuOpen) return
      const menu = userMenuRef.current
      const chip = userChipRef.current
      if (menu && !menu.contains(e.target) && chip && !chip.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }
    window.addEventListener('pointerdown', onClickOutside)
    return () => window.removeEventListener('pointerdown', onClickOutside)
  }, [userMenuOpen])

  const modalRef = useRef(null)
  useEffect(() => {
    if (authOpen && modalRef.current) {
      const first = modalRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      first?.focus()
    }
  }, [authOpen])

  // ===== Nav (Desktop) =====
  const NavLinksDesktop = () => (
    <ul className="flex items-center gap-1 md:gap-2">
      <li>
        <Link href="/#timeline" className="nav-link">
          <FlagTriangleRight className="h-4 w-4 md:mr-1" /> <span className="hidden md:inline">Lịch trình</span>
        </Link>
      </li>
      <li>
        <Link href="/#the-le" className="nav-link">
          <FileText className="h-4 w-4 md:mr-1" /> <span className="hidden md:inline">Thể lệ</span>
        </Link>
      </li>
      <li>
        <Link href="/#giai-thuong" className="nav-link">
          <Trophy className="h-4 w-4 md:mr-1" /> <span className="hidden md:inline">Giải thưởng</span>
        </Link>
      </li>
      <li>
        <Link href="/#faq" className="nav-link">
          <HelpCircle className="h-4 w-4 md:mr-1" /> <span className="hidden md:inline">FAQ</span>
        </Link>
      </li>
    </ul>
  )

  // ===== Nav (Mobile – dạng list dọc) =====
  const NavItemMobile = ({ href, Icon, label, onClick }) => (
    <Link
      href={href}
      onClick={onClick}
      className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 transition hover:bg-slate-50 active:bg-slate-100"
    >
      <span className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
          <Icon className="h-5 w-5 text-slate-700" />
        </span>
        <span className="text-[15px] font-medium text-slate-800">{label}</span>
      </span>
      <ChevronRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5" />
    </Link>
  )

  const NavLinksMobile = ({ onClick }) => (
    <div className="space-y-2">
      <NavItemMobile href="/#timeline" Icon={FlagTriangleRight} label="Lịch trình" onClick={onClick} />
      <NavItemMobile href="/#the-le" Icon={FileText} label="Thể lệ" onClick={onClick} />
      <NavItemMobile href="/#giai-thuong" Icon={Trophy} label="Giải thưởng" onClick={onClick} />
      <NavItemMobile href="/#faq" Icon={HelpCircle} label="FAQ" onClick={onClick} />
    </div>
  )

  // ===== Actions =====
  async function onSubmitLogin(e) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const res = await loginAF.run(
      loginAction,
      [null, fd],
      { errorMessage: (r) => r?.error || 'Đăng nhập thất bại.' }
    )
    if (res?.ok) { setAuthOpen(false); router.refresh() }
  }

  async function onSubmitRegister(e) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const res = await registerAF.run(
      registerAction,
      [null, fd],
      { errorMessage: (r) => r?.error || 'Đăng ký thất bại.' }
    )
    if (res?.ok) { setAuthOpen(false); router.refresh() }
  }

  // user info
  const displayName = user?.name || 'Người dùng'
  const displayEmail = user?.email || ''
  const maskedCCCD = user?.nationalIdMasked || maskCCCD(user?.nationalId || user?.cccd)

  return (
    <>
      {/* HEADER */}
      <header className="fixed top-0 z-50 w-full border-b border-slate-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/90">
        <div className="mx-auto max-w-6xl px-3 md:px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Left: Logo + title */}
            <div className="flex items-center gap-3">
              <button
                aria-label="Mở menu"
                className="md:hidden rounded-md p-2 hover:bg-slate-100"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </button>

              <Link href="/" className="group inline-flex items-center gap-3">
                <div className="relative h-10 w-10">
                  <Image
                    src="https://lh3.googleusercontent.com/d/1N_KQ47tMsf-UalKOQaGQLT3NcL9Fc3vK"
                    alt="Đồng Nai"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
                <div className="leading-tight hidden md:block">
                  <div className="text-sm font-semibold text-brand">Đồng Nai – Cuộc thi 2025</div>
                  <div className="text-xs text-slate-500">Đối ngoại nhân dân</div>
                </div>
              </Link>
            </div>

            {/* Center: Nav desktop */}
            <nav className="hidden md:block">
              <NavLinksDesktop />
            </nav>

            {/* Right actions */}
            <div className="hidden md:flex items-center gap-2">
              {user ? (
                // === CHIP: chỉ tên + email, có truncate ===
                <div className="relative" ref={userChipRef}>
                  <button
                    onClick={() => setUserMenuOpen(v => !v)}
                    className="flex max-w-[280px] items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-left shadow-sm hover:bg-slate-50"
                    aria-haspopup="dialog"
                    aria-expanded={userMenuOpen}
                    title={`${displayName} — ${displayEmail}`}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-800">{displayName}</div>
                      <div className="truncate text-xs text-slate-500">{displayEmail}</div>
                    </div>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
                  </button>

                  {/* === POPUP: right-0, ngay dưới button === */}
                  <div
                    ref={userMenuRef}
                    className={`absolute right-0 top-full mt-2 w-80 origin-top-right rounded-xl border border-slate-200 bg-white shadow-2xl transition ${userMenuOpen ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
                      }`}
                    role="dialog"
                    aria-label="Thông tin tài khoản"
                  >
                    <div className="p-4">

                      <p className='mb-2 text-sm'>Thông tin cá nhân</p>
                      <div className="my-3 h-px w-full bg-slate-200" />
                      <div className="text-sm text-slate-600  truncate"><b>Họ và tên:</b> {displayName}</div>
                      <div className="text-sm text-slate-600 truncate"><b>CCCD:</b> {maskedCCCD}</div>
                      <div className="text-sm text-slate-600 truncate"><b>Ngày sinh:</b> {user?.dob}</div>
                      <div className="text-sm text-slate-600 truncate"><b>Email:</b> {displayEmail}</div>

                      <div className="text-sm text-slate-600 truncate"><b>Liên hệ:</b> {user?.phone}</div>

                      {/* đường kẻ ngang ở giữa */}
                      <div className="my-3 h-px w-full bg-slate-200" />
                      {/* nút hành động */}
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <Link href="/thi" className="btn-brand w-full justify-center">
                          Vào thi
                        </Link>
                        <form action={signOutAction}>
                          <button className="btn-outline w-full justify-center">
                            Đăng xuất
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setAuthTab('register'); setAuthOpen(true) }}
                  className="btn-brand"
                >
                  <UserPlus className="mr-2 h-4 w-4" /> Tham gia / Đăng ký
                </button>
              )}
            </div>

            {/* Mobile right (giữ nguyên) */}
            <div className="flex md:hidden items-center gap-2">
              {user ? (
                <Link href="/thi" className="btn-brand h-9 px-3 text-sm">
                  <Trophy className="mr-1.5 h-4 w-4" /> Vào thi
                </Link>
              ) : (
                <button
                  onClick={() => { setAuthTab('register'); setAuthOpen(true) }}
                  className="btn-brand h-9 px-3 text-sm"
                >
                  <UserPlus className="mr-1.5 h-4 w-4" /> Tham gia
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ===== MOBILE DRAWER (giữ nguyên) ===== */}
      <div className={`fixed inset-0 z-[60] md:hidden ${mobileOpen ? '' : 'pointer-events-none'}`} aria-hidden={!mobileOpen}>
        <div className={`absolute inset-0 bg-black/40 transition-opacity ${mobileOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setMobileOpen(false)} />
        <div className={`absolute right-0 top-0 h-full w-[82%] max-w-sm bg-white shadow-2xl transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`} role="dialog" aria-label="Menu" aria-modal="true">
          <div className="flex h-16 items-center justify-between border-b px-4">
            <div className='flex gap-3 items-center'>
              <div className="relative h-10 w-10">
                <Image
                  src="https://lh3.googleusercontent.com/d/1N_KQ47tMsf-UalKOQaGQLT3NcL9Fc3vK"
                  alt="Đồng Nai"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="leading-tight md:block">
                <div className="text-sm font-semibold text-brand">Đồng Nai – Cuộc thi 2025</div>
                <div className="text-xs text-slate-500">Đối ngoại nhân dân</div>
              </div>
            </div>
            <button aria-label="Đóng menu" className="rounded-md p-2 hover:bg-slate-100" onClick={() => setMobileOpen(false)}>
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="px-4 py-4">
            <NavLinksMobile onClick={() => setMobileOpen(false)} />
          </div>

          <div className="mt-4 border-t px-4 py-4">
            {user ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-semibold">
                    {(displayName[0] || 'U').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{displayName}</div>
                    <div className="truncate text-xs text-slate-500">{displayEmail}</div>
                  </div>
                </div>
                <form action={signOutAction}>
                  <button className="btn-brand">Đăng xuất</button>
                </form>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <button onClick={() => { setMobileOpen(false); setAuthTab('login'); setAuthOpen(true) }} className="btn-outline w-full">
                  <LogIn className="mr-2 h-4 w-4" /> Đăng nhập
                </button>
                <button onClick={() => { setMobileOpen(false); setAuthTab('register'); setAuthOpen(true) }} className="btn-brand w-full">
                  <UserPlus className="mr-2 h-4 w-4" /> Tham gia / Đăng ký
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== AUTH MODAL (giữ nguyên) ===== */}
      <div className={`fixed inset-0 z-[70] ${authOpen ? '' : 'pointer-events-none'}`} aria-hidden={!authOpen}>
        <div className={`absolute inset-0 bg-black/45 backdrop-blur-sm transition-opacity ${authOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setAuthOpen(false)} />
        <div
          ref={modalRef}
          className={`absolute left-1/2 top-1/2 w-[95%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl transition-all ${authOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
          role="dialog" aria-modal="true" aria-labelledby="auth-title"
        >
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="relative h-9 w-9">
                <Image src="https://lh3.googleusercontent.com/d/1N_KQ47tMsf-UalKOQaGQLT3NcL9Fc3vK" alt="Đồng Nai" fill className="object-contain" />
              </div>
              <div className="leading-tight">
                <div id="auth-title" className="text-base font-semibold">
                  {authTab === 'login' ? 'Đăng nhập' : 'Đăng ký tài khoản'}
                </div>
                <p className="text-xs text-slate-500">Đồng Nai – Cuộc thi 2025</p>
              </div>
            </div>
            <button aria-label="Đóng" className="rounded-md p-2 hover:bg-slate-100" onClick={() => setAuthOpen(false)}>
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="px-5 pt-4">
            <div className="grid grid-cols-2 rounded-lg bg-slate-100 p-1 text-sm font-medium">
              <button className={`rounded-md px-3 py-2 transition ${authTab === 'login' ? 'bg-white shadow' : 'opacity-70 hover:opacity-100'}`} onClick={() => setAuthTab('login')}>
                Đăng nhập
              </button>
              <button className={`rounded-md px-3 py-2 transition ${authTab === 'register' ? 'bg-white shadow' : 'opacity-70 hover:opacity-100'}`} onClick={() => setAuthTab('register')}>
                Đăng ký
              </button>
            </div>
          </div>

          <div className="px-5 pb-5 pt-4">
            {authTab === 'login' ? (
              <form onSubmit={onSubmitLogin} className="space-y-4">
                <div>
                  <label htmlFor="login-email" className="mb-1 block text-sm font-medium">Email hoặc CCCD</label>
                  <input id="login-email" name="email" type="text" required className="inp" placeholder="you@example.com hoặc 012345678901" />
                </div>
                <div>
                  <label htmlFor="login-password" className="mb-1 block text-sm font-medium">Mật khẩu</label>
                  <input id="login-password" name="password" type="password" required className="inp" placeholder="••••••••" />
                </div>
                {loginAF.status === 'error' && loginAF.message && (
                  <p role="alert" className="alert-error">{loginAF.message}</p>
                )}
                <button disabled={loginAF.loading} className="btn-brand w-full flex justify-center">
                  {loginAF.loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
                </button>
              </form>
            ) : (
              <form onSubmit={onSubmitRegister} className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="reg-fullName" className="mb-1 block text-sm font-medium">Họ tên</label>
                    <input id="reg-fullName" name="fullName" required className="inp" placeholder="Nguyễn Văn A" />
                  </div>
                  <div>
                    <label htmlFor="reg-email" className="mb-1 block text-sm font-medium">Email</label>
                    <input id="reg-email" name="email" type="email" required className="inp" placeholder="you@example.com" />
                  </div>
                  <div>
                    <label htmlFor="reg-password" className="mb-1 block text-sm font-medium">Mật khẩu</label>
                    <input id="reg-password" name="password" type="password" minLength={8} required className="inp" placeholder="Tối thiểu 8 ký tự" />
                  </div>
                  <div>
                    <label htmlFor="reg-dob" className="mb-1 block text-sm font-medium">Ngày sinh</label>
                    <input id="reg-dob" name="dob" type="date" required className="inp" />
                  </div>
                  <div>
                    <label htmlFor="reg-cccd" className="mb-1 block text-sm font-medium">CCCD (12 số)</label>
                    <input id="reg-cccd" name="nationalId" pattern="^\d{12}$" required className="inp" placeholder="012345678901" />
                  </div>
                  <div>
                    <label htmlFor="reg-phone" className="mb-1 block text-sm font-medium">Số điện thoại</label>
                    <input
                      id="reg-phone"
                      name="phone"
                      inputMode="numeric"
                      pattern="^(0)(3|5|7|8|9)\d{8}$"
                      required
                      className="inp"
                      placeholder="0xxxxxxxxx"
                      title="Số di động 10 số, bắt đầu 03/05/07/08/09"
                    />
                  </div>
                </div>

                <p className="text-[13px] leading-snug rounded-md bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2">
                  Lưu ý: Khi có kết quả, bạn phải <b>xuất trình CCCD trùng khớp</b> với thông tin đã đăng ký để nhận thưởng.
                  Vui lòng đảm bảo thông tin là <b>chính xác</b>.
                </p>

                {registerAF.status === 'error' && registerAF.message && (
                  <p role="alert" className="alert-error">{registerAF.message}</p>
                )}
                <button disabled={registerAF.loading} className=" btn-brand w-full flex justify-center">
                  <span className='text-center'>{registerAF.loading ? 'Đang tạo tài khoản…' : 'Đăng ký & Vào thi'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
