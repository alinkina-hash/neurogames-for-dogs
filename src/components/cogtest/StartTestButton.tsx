import { useState } from "react";
import { useNavigate } from "react-router";
import { daysBetween } from "../../cogtest/compare";
import { useCogStoreContext } from "../../cogtest/CogStoreContext";
import { latestFinished, unfinishedTest } from "../../cogtest/reducer";

/** Starts or continues a dog's test; warns inline when the last finished test is under 30 days old. */
function StartTestButton({ dogId }: { dogId: string }) {
  const { store, startTest } = useCogStoreContext();
  const navigate = useNavigate();
  const [warning, setWarning] = useState(false);

  const unfinished = unfinishedTest(store, dogId);
  const lastFinished = latestFinished(store, dogId);

  function go() {
    navigate(`/profile/run/${startTest(dogId)}`);
  }

  function onClick() {
    if (unfinished) return go();
    if (
      !warning &&
      lastFinished &&
      daysBetween(lastFinished.startedAt, new Date().toISOString()) < 30
    ) {
      setWarning(true);
      return;
    }
    go();
  }

  return (
    <>
      <button type="button" className="button" onClick={onClick}>
        {unfinished ? "Продолжить тест" : "Пройти тест"}
      </button>
      {warning && !unfinished && (
        <div className="profile-warning" role="alert">
          <p>
            С прошлого теста этой собаки прошло меньше 30 дней. Результаты будут
            менее надёжными.
          </p>
          <div className="profile-actions">
            <button type="button" className="button" onClick={go}>
              Всё равно пройти
            </button>
            <button
              type="button"
              className="chip"
              onClick={() => setWarning(false)}
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default StartTestButton;
