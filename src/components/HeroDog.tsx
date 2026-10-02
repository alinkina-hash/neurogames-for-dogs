/** Decorative dog peeking over the bottom edge of the hero; animated in CSS. */
function HeroDog() {
  return (
    <svg className="hero-dog" viewBox="0 0 240 190" aria-hidden="true">
      <g className="dog-head">
        <path className="dog-ear dog-ear-left" d="M70 62C40 50 12 78 18 124c3 22 18 30 30 12 10-16 22-40 30-60Z" />
        <path className="dog-ear dog-ear-right" d="M170 62c30-12 58 16 52 62-3 22-18 30-30 12-10-16-22-40-30-60Z" />
        <path className="dog-face" d="M44 200c-6-80 26-146 76-146s82 66 76 146Z" />
        <path className="dog-blaze" d="M120 56c-10 16-14 40-12 66h24c2-26-2-50-12-66Z" />
        <ellipse className="dog-muzzle" cx="120" cy="150" rx="46" ry="38" />
        <g className="dog-eyes">
          <circle className="dog-eye" cx="90" cy="108" r="9" />
          <circle className="dog-eye" cx="150" cy="108" r="9" />
          <circle className="dog-glint" cx="93" cy="105" r="3" />
          <circle className="dog-glint" cx="153" cy="105" r="3" />
        </g>
        <path className="dog-tongue" d="M108 164h24v14a12 12 0 0 1-24 0Z" />
        <path className="dog-mouth" d="M96 156c8 10 18 10 24 2 6 8 16 8 24-2" />
        <path className="dog-nose" d="M104 128c0-7 32-7 32 0 0 9-9 15-16 15s-16-6-16-15Z" />
      </g>
    </svg>
  )
}

const PAW = (
  <>
    <ellipse cx="12" cy="16" rx="5" ry="4" />
    <ellipse cx="5" cy="10.500" rx="2.100" ry="2.800" />
    <ellipse cx="9.500" cy="6" rx="2.100" ry="2.900" />
    <ellipse cx="14.500" cy="6" rx="2.100" ry="2.900" />
    <ellipse cx="19" cy="10.500" rx="2.100" ry="2.800" />
  </>
)

// Alternating left/right prints walking diagonally across the hero.
const STEPS = [
  { x: 4, y: 74, r: 38 },
  { x: 30, y: 60, r: 52 },
  { x: 48, y: 36, r: 38 },
  { x: 74, y: 24, r: 52 },
  { x: 92, y: 0, r: 38 },
]

export function PawTrail() {
  return (
    <svg className="paw-trail" viewBox="0 0 120 100" fill="currentColor" aria-hidden="true">
      {STEPS.map((step, index) => (
        <g key={index} transform={`translate(${step.x} ${step.y}) rotate(${step.r} 12 12)`}>
          <g className="paw-step" style={{ animationDelay: `${index * 0.45}s` }}>
            {PAW}
          </g>
        </g>
      ))}
    </svg>
  )
}

export default HeroDog
