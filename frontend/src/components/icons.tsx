type IconProps = {
  className?: string
}

/** Seal used as the project wordmark badge. */
export function SealIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="16.5" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 3" />
      <path
        d="M24 10 L27.5 20.5 L38.5 20.5 L29.6 27 L33 37.5 L24 31 L15 37.5 L18.4 27 L9.5 20.5 L20.5 20.5 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function MapIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        d="M6 12 L18 7 L30 12 L42 7 V36 L30 41 L18 36 L6 41 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M18 7 V36 M30 12 V41" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="13" cy="20" r="2" fill="currentColor" />
      <path d="M22 28 L34 20" stroke="currentColor" strokeWidth="1.2" strokeDasharray="1 3" />
    </svg>
  )
}

export function KeyIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <circle cx="16" cy="24" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M24 24 H41 M34 24 V31 M39 24 V29" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function ScrollIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        d="M14 8 H34 V34 Q34 40 28 40 H14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14 8 Q8 8 8 14 Q8 20 14 20" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M14 40 Q8 40 8 34 Q8 29 13 28" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M18 16 H29 M18 22 H29 M18 28 H25" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

export function ArrowIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M4 12 H19 M13 6 L19 12 L13 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
