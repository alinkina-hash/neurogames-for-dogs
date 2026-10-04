import TypeIcon from '../TypeIcon'
import { GAME_TYPE_LABELS, type GameType } from '../../content/schema'
import type { TestSummary } from '../../cogtest/types'
import Delta from './Delta'

interface Props {
  skill: GameType
  entry: TestSummary['skills'][GameType]
  change?: { before: number; delta: number }
  /** Show the previous value next to the arrow. */
  showBefore?: boolean
}

/** One skill line: icon, name, bar of score/max, score, «неполный» marker and the change vs the previous test. */
function SkillRow({ skill, entry, change, showBefore = false }: Props) {
  return (
    <li className={showBefore ? 'skill-row skill-row-detail' : 'skill-row'} data-type={skill}>
      <span className="skill-name">
        <TypeIcon type={skill} />
        {GAME_TYPE_LABELS[skill]}
      </span>
      <span
        className="skill-bar"
        role="img"
        aria-label={`${entry.score} из ${entry.max}`}
      >
        <i style={{ width: `${(entry.score / entry.max) * 100}%` }} />
      </span>
      <span className="skill-score">
        {entry.score} из {entry.max}
      </span>
      {!entry.complete && <span className="tag skill-incomplete">неполный</span>}
      {change && (
        <span className="skill-change">
          {showBefore && <span className="skill-before">было {change.before}</span>}
          <Delta delta={change.delta} />
        </span>
      )}
    </li>
  )
}

export default SkillRow
