import { formatShortDate } from '../../cogtest/format'

interface Point {
  date: string
  value: number
}

interface Props {
  points: Point[]
  max: number
  min?: number
  bands?: { from: number; to: number; color: string }[]
  label: string
  color?: string
  compact?: boolean
}

/** Inline-SVG line chart: full variant labels dates and values, compact draws the line and last dot. */
function TrendChart({ points, max, min = 0, bands, label, color = 'var(--sun)', compact = false }: Props) {
  if (points.length === 0) return <p className="trend-empty">Нет данных</p>
  if (points.length < 2) return <p className="trend-empty">Пока мало данных</p>

  const summary = `${label}: ${points.map((p) => `${formatShortDate(p.date)} — ${p.value}`).join(', ')}`
  const width = compact ? 100 : 260
  const height = compact ? 36 : 96
  const left = compact ? 10 : 30
  const right = width - left
  const top = compact ? 5 : 26
  const bottom = compact ? 31 : 68
  const x = (i: number) => left + ((right - left) * i) / (points.length - 1)
  const y = (value: number) =>
    bottom - ((bottom - top) * (Math.min(Math.max(value, min), max) - min)) / (max - min)
  const line = points.map((p, i) => `${x(i)},${y(p.value)}`).join(' ')
  const lastIndex = points.length - 1
  const showLabel = (i: number) => points.length <= 6 || (lastIndex - i) % 2 === 0

  return (
    <svg
      className={compact ? 'trend trend-compact' : 'trend'}
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      role="img"
      aria-label={summary}
    >
      {!compact && <line x1={left - 10} y1={bottom + 6} x2={right + 10} y2={bottom + 6} className="trend-axis" />}
      {!compact &&
        bands?.map((b, i) => (
          <rect key={i} x={left - 10} y={y(b.to)} width={right - left + 20} height={y(b.from) - y(b.to)} fill={b.color} />
        ))}
      <polyline points={line} fill="none" className="trend-outline" strokeWidth={5} />
      <polyline points={line} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
      {points.map((p, i) =>
        compact && i !== lastIndex ? null : (
          <circle
            key={i}
            cx={x(i)}
            cy={y(p.value)}
            r={compact ? 3.5 : 6}
            fill={color}
            className="trend-dot"
            strokeWidth={compact ? 1.5 : 2.5}
          />
        ),
      )}
      {!compact &&
        points.map((p, i) =>
          showLabel(i) ? (
            <g key={i}>
              <text x={x(i)} y={y(p.value) - 11} textAnchor="middle" className="trend-value">
                {p.value}
              </text>
              <text x={x(i)} y={height - 6} textAnchor="middle" className="trend-date">
                {formatShortDate(p.date)}
              </text>
            </g>
          ) : null,
        )}
    </svg>
  )
}

export default TrendChart
