/** Change vs the previous test: colour plus text, never colour alone. */
function Delta({ delta }: { delta: number }) {
  if (delta > 0) {
    return (
      <span className="delta delta-up" aria-label={`выросло на ${delta}`}>
        ↑ +{delta}
      </span>
    )
  }
  if (delta < 0) {
    return (
      <span className="delta delta-down" aria-label={`снизилось на ${-delta}`}>
        ↓ −{-delta}
      </span>
    )
  }
  return (
    <span className="delta delta-eq" aria-label="без изменений">
      =
    </span>
  )
}

export default Delta
