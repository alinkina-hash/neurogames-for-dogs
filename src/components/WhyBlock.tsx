import { useRef, type MouseEvent } from 'react'
import { WHY } from '../content/why'

/** Teaser on the catalogue page that opens a modal explaining why brain games matter. */
function WhyBlock() {
  const dialogRef = useRef<HTMLDialogElement>(null)

  // The dialog element itself only receives clicks that land on its backdrop.
  function closeOnBackdrop(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current) dialogRef.current.close()
  }

  return (
    <>
      <section className="why-teaser">
        <span className="why-badge" aria-hidden="true">
          ?
        </span>
        <div className="why-teaser-text">
          <h2>{WHY.title}</h2>
          <p>{WHY.teaser}</p>
          <button type="button" className="button" onClick={() => dialogRef.current?.showModal()}>
            Почему это важно →
          </button>
        </div>
      </section>

      <dialog ref={dialogRef} className="why-dialog" aria-labelledby="why-title" onClick={closeOnBackdrop}>
        <div className="why-dialog-body">
          <form method="dialog">
            <button className="dialog-close" aria-label="Закрыть">
              ✕
            </button>
          </form>

          <h2 id="why-title">{WHY.title}</h2>
          <p className="why-lead">{WHY.lead}</p>

          <ol className="why-points">
            {WHY.points.map((point) => (
              <li key={point.title}>
                <h3>{point.title}</h3>
                <p>{point.text}</p>
              </li>
            ))}
          </ol>

          <div className="why-caveat">
            <h3>{WHY.caveat.title}</h3>
            <p>{WHY.caveat.text}</p>
          </div>

          <h3>Источники</h3>
          <ul className="why-sources">
            {WHY.sources.map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noreferrer">
                  {source.title}
                </a>
              </li>
            ))}
          </ul>

          <form method="dialog">
            <button className="button">Понятно, к играм!</button>
          </form>
        </div>
      </dialog>
    </>
  )
}

export default WhyBlock
