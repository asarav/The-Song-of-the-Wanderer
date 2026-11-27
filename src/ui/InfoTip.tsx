/**
 * A small, keyboard-operable explanation popover.
 *
 * The trigger is a real button with `aria-expanded`; the content is portalled to the body,
 * announced politely, and dismissed with Escape or a pointer outside. It is deliberately
 * click-open rather than hover-only so it also works on touch and for keyboard readers.
 *
 * The popover is measured against the viewport rather than its animated panel. That lets it
 * shift away from an edge and flip above the trigger instead of being clipped or scrolled
 * out of sight.
 */

import { createPortal } from 'react-dom'
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

const MARGIN = 8
const GAP = 8

interface Placement {
  left: number
  top: number
  maxHeight: number
}

export function InfoTip({
  label,
  children,
  align = 'start',
}: {
  label: string
  children: ReactNode
  align?: 'start' | 'end'
}) {
  const [open, setOpen] = useState(false)
  const [placement, setPlacement] = useState<Placement | null>(null)
  const id = useId()
  const root = useRef<HTMLSpanElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const popover = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      trigger.current?.focus()
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (root.current?.contains(target) || popover.current?.contains(target)) return
      setOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

  useLayoutEffect(() => {
    if (!open) {
      setPlacement(null)
      return
    }

    const place = () => {
      const anchor = trigger.current?.getBoundingClientRect()
      const panel = popover.current?.getBoundingClientRect()
      if (!anchor || !panel) return

      const availableWidth = Math.max(160, window.innerWidth - MARGIN * 2)
      const width = Math.min(panel.width, availableWidth)
      const preferredLeft = align === 'end' ? anchor.right - width : anchor.left
      const left = Math.min(
        Math.max(MARGIN, preferredLeft),
        Math.max(MARGIN, window.innerWidth - width - MARGIN),
      )

      let top = anchor.bottom + GAP
      if (top + panel.height > window.innerHeight - MARGIN) {
        top = anchor.top - panel.height - GAP
      }
      top = Math.max(MARGIN, top)

      setPlacement({
        left,
        top,
        maxHeight: Math.max(120, window.innerHeight - MARGIN * 2),
      })
    }

    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [align, open])

  return (
    <span className={`info-tip info-tip-${align}`} ref={root}>
      <button
        ref={trigger}
        type="button"
        className="info-tip-trigger"
        aria-label={`About ${label}`}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        <span aria-hidden="true">i</span>
      </button>
      {open && typeof document !== 'undefined'
        ? createPortal(
            <span
              ref={popover}
              id={id}
              className="info-popover"
              role="note"
              aria-live="polite"
              style={{
                left: placement?.left ?? 0,
                top: placement?.top ?? 0,
                maxHeight: placement?.maxHeight,
                visibility: placement ? 'visible' : 'hidden',
              }}
            >
              {children}
            </span>,
            document.body,
          )
        : null}
    </span>
  )
}
