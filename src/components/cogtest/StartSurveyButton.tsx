import { useState } from 'react'
import { useNavigate } from 'react-router'
import { daysBetween } from '../../cogtest/compare'
import { useCogStoreContext } from '../../cogtest/CogStoreContext'
import { formatDate } from '../../cogtest/format'
import { latestFinishedSurvey, unfinishedSurvey } from '../../cogtest/reducer'

/** Starts or continues a dog's survey; warns inline when the last finished survey is under 60 days old. */
function StartSurveyButton({ dogId }: { dogId: string }) {
  const { store, startSurvey } = useCogStoreContext()
  const navigate = useNavigate()
  const [warning, setWarning] = useState(false)

  const unfinished = unfinishedSurvey(store, dogId)
  const lastFinished = latestFinishedSurvey(store, dogId)

  function go() {
    navigate(`/profile/survey/${startSurvey(dogId)}`)
  }

  function onClick() {
    if (unfinished) return go()
    if (
      !warning &&
      lastFinished &&
      daysBetween(lastFinished.startedAt, new Date().toISOString()) < 60
    ) {
      setWarning(true)
      return
    }
    go()
  }

  return (
    <>
      <button type="button" className="button" onClick={onClick}>
        {unfinished ? 'Продолжить анкету' : 'Заполнить анкету'}
      </button>
      {warning && !unfinished && lastFinished && (
        <div className="profile-warning" role="alert">
          <p>
            Последняя анкета была {formatDate(lastFinished.startedAt)}. Вопросы сравнивают с
            тем, что было полгода назад, поэтому лучше заполнять её раз в полгода.
          </p>
          <div className="profile-actions">
            <button type="button" className="button" onClick={go}>
              Всё равно заполнить
            </button>
            <button type="button" className="chip" onClick={() => setWarning(false)}>
              Отмена
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default StartSurveyButton
