import { useEffect, useRef, useCallback } from 'react'
import { useNGO } from '../context/NGOContext'
import { animateToastIn, animateToastOut } from '../animations/ngoAnimations'

const TOAST_ICONS = {
    success: '✓',
    error: '✕',
    new_donation: '↓',
    info: 'ℹ',
    warning: '⚠',
}

const TOAST_DURATION = 5000

export default function NotificationToast() {
    const { notifications, removeNotification } = useNGO()
    const toastRefs = useRef({})
    const timerRefs = useRef({})

    /* Start auto-dismiss timer & animate in */
    useEffect(() => {
        notifications.forEach((n) => {
            if (timerRefs.current[n.id]) return

            // Animate in
            setTimeout(() => {
                const el = toastRefs.current[n.id]
                if (el) animateToastIn(el)
            }, 50)

            // Auto-dismiss
            timerRefs.current[n.id] = setTimeout(() => {
                dismiss(n.id)
            }, TOAST_DURATION)
        })

        // Cleanup expired timers
        const activeIds = new Set(notifications.map((n) => n.id))
        Object.keys(timerRefs.current).forEach((id) => {
            if (!activeIds.has(parseFloat(id))) {
                clearTimeout(timerRefs.current[id])
                delete timerRefs.current[id]
            }
        })
    }, [notifications])

    const dismiss = useCallback(
        async (id) => {
            const el = toastRefs.current[id]
            if (el) {
                await animateToastOut(el)
            }
            removeNotification(id)
            clearTimeout(timerRefs.current[id])
            delete timerRefs.current[id]
            delete toastRefs.current[id]
        },
        [removeNotification]
    )

    /* Show only latest 4 */
    const visible = notifications.slice(0, 4)

    if (visible.length === 0) return null

    return (
        <div className="ngo-toast-container">
            {visible.map((n) => (
                <div
                    key={n.id}
                    ref={(el) => { toastRefs.current[n.id] = el }}
                    className={`ngo-toast ngo-toast--${n.type}`}
                >
                    <span className="ngo-toast__icon">
                        {TOAST_ICONS[n.type] || 'ℹ'}
                    </span>
                    <div className="ngo-toast__body">
                        <p className="ngo-toast__message">{n.message}</p>
                        <span className="ngo-toast__time">
                            {new Date(n.time).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </span>
                    </div>
                    <button
                        className="ngo-toast__close"
                        onClick={() => dismiss(n.id)}
                        aria-label="Dismiss"
                    >
                        ✕
                    </button>
                </div>
            ))}
        </div>
    )
}
