import type { ReactNode } from 'react'
import type { GameType } from '../content/schema'

const ICONS: Record<GameType, ReactNode> = {
  // Magnifying glass: searching
  scent: (
    <path
      fillRule="evenodd"
      d="M10.5 3a7.5 7.5 0 1 0 4.55 13.46l4.24 4.25a1.5 1.5 0 0 0 2.12-2.12l-4.25-4.24A7.5 7.5 0 0 0 10.5 3Zm0 3a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z"
    />
  ),
  // Bone: dogs remember where they buried it
  memory: (
    <g transform="rotate(-35 12 12)">
      <rect x="6" y="10" width="12" height="4" rx="1" />
      <circle cx="5.500" cy="9.500" r="2.700" />
      <circle cx="5.500" cy="14.500" r="2.700" />
      <circle cx="18.500" cy="9.500" r="2.700" />
      <circle cx="18.500" cy="14.500" r="2.700" />
    </g>
  ),
  // Light bulb
  thinking: (
    <>
      <path d="M12 2.500a6.300 6.300 0 0 0-3.800 11.300c.700.500 1.100 1.300 1.200 2.200h5.200c.1-.9.500-1.700 1.200-2.200A6.300 6.300 0 0 0 12 2.500Z" />
      <rect x="9.300" y="17.200" width="5.400" height="1.900" rx=".95" />
      <rect x="10.200" y="20" width="3.600" height="1.700" rx=".85" />
    </>
  ),
  // Hourglass: waiting
  'self-control': (
    <path d="M6.500 2.500h11a1 1 0 0 1 1 1v1.200c0 3-2.300 5-3.900 7.300 1.600 2.300 3.900 4.300 3.900 7.300v1.200a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-1.200c0-3 2.300-5 3.900-7.300C7.800 9.700 5.500 7.700 5.500 4.700V3.500a1 1 0 0 1 1-1Z" />
  ),
}

function TypeIcon({ type }: { type: GameType }) {
  return (
    <svg className="type-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {ICONS[type]}
    </svg>
  )
}

export default TypeIcon
