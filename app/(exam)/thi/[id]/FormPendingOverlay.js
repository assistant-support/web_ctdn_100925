'use client';

import { useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { showOverlay, hideOverlay } from '@/hooks/useAction';

export default function FormPendingOverlay() {
    const { pending } = useFormStatus();
    useEffect(() => {
        if (pending) showOverlay();
        else hideOverlay();
        return () => hideOverlay();
    }, [pending]);
    return null; // chỉ điều khiển overlay, không render gì
}

/** Nút submit “thông minh” (disabled + đổi nhãn khi pending) */
export function SubmitButton({ children }) {
    const { pending } = useFormStatus();
    return (
        <button type="submit" className="btn-brand" disabled={pending}>
            {pending ? 'Đang bắt đầu…' : children}
        </button>
    );
}
