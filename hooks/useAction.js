'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

const OVERLAY_ID = 'action-overlay-root';
const TOAST_ROOT_ID = 'action-toast-root';

let _overlayCounter = 0;

/* =========================
 * Helpers (CSS var fallbacks)
 * ========================= */
const FALLBACK = {
    brand: '#0ea5e9',     // cyan-500-ish
    success: '#16a34a',   // green-600
    danger: '#b91c1c',    // red-700
    text: '#0f172a',      // slate-900
    surface: '#ffffff',
    surface2: '#f8fafc',
    border: '#e2e8f0',    // slate-200
};
const VAR = {
    brand: '--color-brand-700',
    success: '--color-success-600',
    danger: '--color-danger-700',
    text: '--text',
    surface: '--surface',
    surface2: '--surface-2',
    border: '--border',
};
const css = (token, fb) => `var(${token}, ${fb})`;

/* =========================
 * Overlay
 * ========================= */
function ensureOverlayRoot() {
    if (typeof document === 'undefined') return null;
    let el = document.getElementById(OVERLAY_ID);
    if (el) return el;

    el = document.createElement('div');
    el.id = OVERLAY_ID;
    el.className =
        'fixed inset-0 z-[10000] grid place-items-center bg-black/40 backdrop-blur-[2px] ' +
        'transition-opacity duration-150 opacity-0 pointer-events-none';
    el.setAttribute('aria-hidden', 'true');

    const panel = document.createElement('div');
    panel.className = 'rounded-xl border shadow-xl p-5 flex items-center justify-center';
    panel.style.background = css(VAR.surface, `${FALLBACK.surface}E6`); // 90% opacity
    panel.style.borderColor = css(VAR.border, FALLBACK.border);
    panel.innerHTML = `
    <div class="flex items-center gap-3">
      <svg class="animate-spin h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"
           style="color:${css(VAR.brand, FALLBACK.brand)}">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke-width="4"></circle>
        <path class="opacity-75" d="M4 12a8 8 0 018-8" stroke-width="4" stroke-linecap="round"></path>
      </svg>
    </div>
  `;
    el.appendChild(panel);
    document.body.appendChild(el);
    return el;
}
function showOverlay() {
    const root = ensureOverlayRoot();
    if (!root) return;
    _overlayCounter++;
    root.classList.remove('pointer-events-none', 'opacity-0');
    root.classList.add('opacity-100');
}
function hideOverlay() {
    if (typeof document === 'undefined') return;
    const root = document.getElementById(OVERLAY_ID);
    if (!root) return;
    _overlayCounter = Math.max(0, _overlayCounter - 1);
    if (_overlayCounter === 0) {
        root.classList.add('pointer-events-none', 'opacity-0');
        root.classList.remove('opacity-100');
    }
}

/* =========================
 * Toast
 * ========================= */
function ensureToastRoot() {
    if (typeof document === 'undefined') return null;
    let el = document.getElementById(TOAST_ROOT_ID);
    if (el) return el;

    el = document.createElement('div');
    el.id = TOAST_ROOT_ID;
    el.className = 'fixed top-3 right-3 z-[10001] flex flex-col items-end gap-2 pointer-events-none';
    el.setAttribute('aria-live', 'polite');
    document.body.appendChild(el);
    return el;
}

function iconFor(type) {
    const base = 'w-5 h-5';
    if (type === 'success')
        return `<svg class="${base}" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M9 12l2 2 4-4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="9" stroke-width="2"/></svg>`;
    if (type === 'error')
        return `<svg class="${base}" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke-width="2"/><path d="M15 9l-6 6M9 9l6 6" stroke-width="2" stroke-linecap="round"/></svg>`;
    return `<svg class="${base}" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke-width="2"/><path d="M12 8v4m0 4h.01" stroke-width="2" stroke-linecap="round"/></svg>`;
}
function colorToken(type) {
    if (type === 'success') return [VAR.success, FALLBACK.success];
    if (type === 'error') return [VAR.danger, FALLBACK.danger];
    return [VAR.brand, FALLBACK.brand];
}

/** A nicer toast with left accent + progress bar */
function showToastDom({ message, type = 'success', duration = 2500 }) {
    const root = ensureToastRoot();
    if (!root) return;

    const [token, fb] = colorToken(type);
    const accent = css(token, fb);

    const toast = document.createElement('div');
    toast.className =
        'group pointer-events-auto w-full max-w-[420px] overflow-hidden rounded-xl border shadow-lg ' +
        'opacity-0 translate-y-2 transition-all duration-150 relative';
    toast.style.background = css(VAR.surface, FALLBACK.surface);
    toast.style.color = css(VAR.text, FALLBACK.text);
    toast.style.borderColor = css(VAR.border, FALLBACK.border);

    // left accent
    const accentEl = document.createElement('div');
    accentEl.className = 'absolute inset-y-0 left-0 w-1';
    accentEl.style.background = accent;
    accentEl.setAttribute('aria-hidden', 'true');

    // body
    const body = document.createElement('div');
    body.className = 'flex items-start gap-3 p-3 pl-4';

    const iconWrap = document.createElement('div');
    iconWrap.className = 'mt-0.5';
    iconWrap.style.color = accent;
    iconWrap.innerHTML = iconFor(type);

    const textWrap = document.createElement('div');
    textWrap.className = 'flex-1 text-sm';
    textWrap.textContent = message ?? '';

    const btn = document.createElement('button');
    btn.className = 'ml-2 rounded-[8px] border px-2 py-1 text-xs hover:opacity-80';
    btn.style.borderColor = css(VAR.border, FALLBACK.border);
    btn.style.background = css(VAR.surface2, FALLBACK.surface2);
    btn.textContent = 'Đóng';

    body.appendChild(iconWrap);
    body.appendChild(textWrap);
    body.appendChild(btn);

    // progress bar
    const barWrap = document.createElement('div');
    barWrap.className = 'absolute bottom-0 left-0 right-0 h-1 overflow-hidden';
    const bar = document.createElement('div');
    bar.className = 'h-full';
    bar.style.background = accent;
    bar.style.width = '100%';
    bar.style.transition = `width ${Math.max(200, duration)}ms linear`;
    // append
    barWrap.appendChild(bar);

    toast.appendChild(accentEl);
    toast.appendChild(body);
    toast.appendChild(barWrap);

    // close helpers
    const close = () => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 160);
    };
    btn.addEventListener('click', close);

    root.appendChild(toast);

    // animate in
    requestAnimationFrame(() => {
        toast.classList.remove('opacity-0', 'translate-y-2');
        toast.classList.add('opacity-100', 'translate-y-0');
        // start progress drain
        requestAnimationFrame(() => { bar.style.width = '0%'; });
    });

    if (duration > 0) setTimeout(close, duration + 40);
}
export { showOverlay, hideOverlay };
/* =========================
 * Hook
 * ========================= */
export function useActionFeedback(defaults = {}) {
    const router = useRouter();
    const [status, setStatus] = useState('idle');
    const [message, setMessage] = useState('');
    const [isPending, startTransition] = useTransition();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        ensureOverlayRoot();
        ensureToastRoot();
    }, []);

    const run = useCallback(
        async (actionFn, args = [], options = {}) => {
            const {
                autoRefresh = defaults.autoRefresh ?? true,
                successMessage = defaults.successMessage,
                errorMessage = defaults.errorMessage,
                onSuccess = defaults.onSuccess,
                onError = defaults.onError,
                silent = false,
                toast = options.toast ?? true,
                overlay = options.overlay ?? true,
                duration = options.duration ?? 2500,
            } = options;

            setStatus('loading');
            setLoading(true);
            setMessage('');
            if (overlay) showOverlay();

            try {
                const res = await actionFn(...(Array.isArray(args) ? args : [args]));
                // ok logic: nếu không có res => fail; nếu có, ưu tiên res.ok, fallback success/error
                const ok = !!res && (typeof res.ok !== 'undefined'
                    ? !!res.ok
                    : (res.success !== false && !res.error));

                if (ok) {
                    setStatus('success');
                    const msg = typeof successMessage === 'function'
                        ? successMessage(res)
                        : (successMessage || 'Thao tác thành công.');
                    if (!silent) setMessage(msg);
                    onSuccess?.(res);
                    if (toast && !silent) showToastDom({ message: msg, type: 'success', duration });
                    if (autoRefresh) startTransition(() => router.refresh());
                } else {
                    setStatus('error');
                    const msg = typeof errorMessage === 'function'
                        ? errorMessage(res)
                        : (res?.error || errorMessage || 'Thao tác thất bại.');
                    if (!silent) setMessage(msg);
                    onError?.(res);
                    if (toast && !silent) showToastDom({ message: msg, type: 'error', duration });
                }

                return res;
            } catch (err) {
                setStatus('error');
                const msg = typeof options.errorMessage === 'function'
                    ? options.errorMessage(err)
                    : (err?.message || defaults.errorMessage || 'Có lỗi xảy ra.');
                if (!silent) setMessage(msg);
                onError?.(err);
                if (toast && !silent) showToastDom({ message: msg, type: 'error', duration });
                return { success: false, error: msg };
            } finally {
                setLoading(false);
                if (overlay) hideOverlay();
            }
        },
        [defaults, router]
    );

    return useMemo(
        () => ({
            run,
            loading: loading || isPending,
            status,
            message,
            clearMessage: () => setMessage(''),
            toast: (msg, type = 'info', duration = 2500) => showToastDom({ message: msg, type, duration }),
            showOverlay,
            hideOverlay,
        }),
        [run, loading, isPending, status, message]
    );
}
