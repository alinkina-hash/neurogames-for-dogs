/** Total went up = worse (red), down = better (green); text for screen readers, never colour alone. */
function SurveyChange({ delta }: { delta: number }) {
  if (delta > 0) {
    return (
      <span className="survey-up">
        <span aria-hidden="true">↑ +{delta}</span>
        <span className="visually-hidden">хуже на {delta}</span>
      </span>
    )
  }
  if (delta < 0) {
    return (
      <span className="survey-down">
        <span aria-hidden="true">↓ −{-delta}</span>
        <span className="visually-hidden">лучше на {-delta}</span>
      </span>
    )
  }
  return (
    <span className="survey-eq">
      <span aria-hidden="true">=</span>
      <span className="visually-hidden">без изменений</span>
    </span>
  )
}

export default SurveyChange
