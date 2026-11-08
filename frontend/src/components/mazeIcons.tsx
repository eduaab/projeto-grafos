import type { Direction } from '../lib/parseMaze'

type IconProps = {
  className?: string
}

/**
 * Small authored icons for the maze legend/grid, in the same stroke-based
 * line-art style as components/icons.tsx — not emoji, not plain letters.
 * viewBox 0 0 24 24, meant to sit inside a ~20px tile.
 */

const CONVEYOR_ROTATION: Record<Direction, number> = { E: 0, S: 90, W: 180, N: 270 }

/** A single chevron, rotated to the conveyor's direction — not four glyphs stacked. */
export function ConveyorArrowIcon({ className, direction }: IconProps & { direction: Direction }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      style={{ transform: `rotate(${CONVEYOR_ROTATION[direction]}deg)` }}
    >
      <path
        d="M5 12 H17 M12 6 L18 12 L12 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function BonusIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M12 4 L18 10 L12 20 L6 10 Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M6 10 H18 M9.5 10 L12 4 M14.5 10 L12 4" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}

export function SourceIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 3 C9 7 7 9 7 13 A5 5 0 0 0 17 13 C17 10 15 9 14 7 C14 9 13 9.5 12 9 C11.5 7 12 5 12 3 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function StartFlagIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <line x1="6" y1="4" x2="6" y2="20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M6 5 H17 L13 9 L17 13 H6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  )
}

export function GoalFlagIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <line x1="6" y1="4" x2="6" y2="20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M6 5 H17 V13 H6 Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M6 5 H9.5 V8.5 H6 Z M13.5 5 H17 V8.5 H13.5 Z M9.5 8.5 H13.5 V13 H9.5 Z" fill="currentColor" />
    </svg>
  )
}
