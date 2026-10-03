import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router'
import StartTestButton from '../../components/cogtest/StartTestButton.tsx'
import { useCogStoreContext } from '../../cogtest/CogStoreContext'
import { latestFinished, type DogInput } from '../../cogtest/reducer'
import { exportStore, parseImport } from '../../cogtest/storage'
import { formatDate } from '../../cogtest/format'
import { summarizeTest } from '../../cogtest/scoring'
import type { Dog, Store } from '../../cogtest/types'

function localDay(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

function download(name: string, text: string) {
  const url = URL.createObjectURL(
    new Blob([text], { type: 'application/json' }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

const EMPTY_DOG: DogInput = { name: '', breed: '', birthMonth: '' }

function DogFields({
  value,
  onChange,
  label,
}: {
  value: DogInput
  onChange: (v: DogInput) => void
  label?: string
}) {
  return (
    <fieldset className="profile-fields">
      {label && <legend>{label}</legend>}
      <label>
        Кличка
        <input
          type="text"
          required
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
        />
      </label>
      <label>
        Порода (необязательно)
        <input
          type="text"
          value={value.breed ?? ''}
          onChange={(e) => onChange({ ...value, breed: e.target.value })}
        />
      </label>
      <label>
        Месяц рождения (необязательно)
        <input
          type="month"
          value={value.birthMonth ?? ''}
          onChange={(e) => onChange({ ...value, birthMonth: e.target.value })}
        />
      </label>
    </fieldset>
  )
}

function Onboarding({ onSave }: { onSave: (dogs: DogInput[]) => void }) {
  const [raw, setRaw] = useState('1')
  const [count, setCount] = useState(1)
  const [dogs, setDogs] = useState<DogInput[]>(() =>
    Array.from({ length: 10 }, () => EMPTY_DOG),
  )

  // The raw text stays editable; the number of forms follows the last value in 1..10.
  function changeCount(event: ChangeEvent<HTMLInputElement>) {
    const text = event.target.value
    setRaw(text)
    const n = Math.floor(Number(text))
    if (text.trim() !== '' && n >= 1 && n <= 10) setCount(n)
  }

  function normalizeCount() {
    setRaw(String(count))
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    onSave(dogs.slice(0, count))
  }

  return (
    <form className="block profile-form" onSubmit={submit}>
      <h2>Сколько у вас собак?</h2>
      <label className="profile-count">
        Количество (от 1 до 10)
        <input
          type="number"
          min={1}
          max={10}
          value={raw}
          onChange={changeCount}
          onBlur={normalizeCount}
        />
      </label>
      {dogs.slice(0, count).map((dog, i) => (
        <DogFields
          key={i}
          label={count > 1 ? `Собака ${i + 1}` : undefined}
          value={dog}
          onChange={(v) =>
            setDogs((prev) => prev.map((d, j) => (j === i ? v : d)))
          }
        />
      ))}
      <button type="submit" className="button">
        Сохранить
      </button>
    </form>
  )
}

function DogEditForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: DogInput
  submitLabel: string
  onSubmit: (dog: DogInput) => void
  onCancel: () => void
}) {
  const [dog, setDog] = useState(initial)
  function submit(event: FormEvent) {
    event.preventDefault()
    onSubmit(dog)
  }
  return (
    <form className="block profile-form" onSubmit={submit}>
      <DogFields value={dog} onChange={setDog} />
      <div className="profile-actions">
        <button type="submit" className="button">
          {submitLabel}
        </button>
        <button type="button" className="chip" onClick={onCancel}>
          Отмена
        </button>
      </div>
    </form>
  )
}

function lastResult(store: Store, dog: Dog): string {
  const last = latestFinished(store, dog.id)
  if (!last?.finishedAt) return 'Тестов пока нет'
  const total = summarizeTest(last.tasks).total
  return `${formatDate(last.finishedAt)}: ${total === null ? 'неполный' : `${total} из 24`}`
}

function ProfilesPage() {
  const { store, status, corruptRaw, dispatch, resetCorrupt } =
    useCogStoreContext()
  const [editing, setEditing] = useState<string | 'new' | null>(null)
  const [importError, setImportError] = useState('')

  function exportData() {
    download(`neurogames-backup-${localDay()}.json`, exportStore(store))
  }

  async function importData(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target
    const file = input.files?.[0]
    if (!file) return
    setImportError('')
    let text = ''
    try {
      text = await file.text()
    } catch {
      input.value = ''
      setImportError('Это не файл копии: не удалось прочитать JSON.')
      return
    }
    const result = parseImport(text)
    input.value = ''
    if (!result.ok) {
      setImportError(
        result.error === 'not-json'
          ? 'Это не файл копии: не удалось прочитать JSON.'
          : 'Файл не подходит: в нём нет данных нейроигр или они повреждены.',
      )
      return
    }
    if (
      window.confirm(
        'Заменить текущие данные данными из файла? Текущие собаки и тесты будут удалены.',
      )
    ) {
      dispatch({ type: 'replaceAll', store: result.store })
      setEditing(null)
    }
  }

  function removeDog(dog: Dog) {
    if (
      window.confirm(
        `Удалить собаку «${dog.name}»? Вся история тестов этой собаки будет удалена.`,
      )
    ) {
      dispatch({ type: 'deleteDog', dogId: dog.id })
    }
  }

  const now = () => new Date().toISOString()

  if (status === 'corrupt') {
    return (
      <>
        <h1>Профиль</h1>
        <section className="block block-danger profile-warning" role="alert">
          <h2>Сохранённые данные повреждены</h2>
          <p>Можно скачать то, что осталось, или начать с чистого листа.</p>
          <div className="profile-actions">
            <button
              type="button"
              className="button"
              onClick={() =>
                download('neurogames-corrupt.json', corruptRaw ?? '')
              }
            >
              Скачать данные
            </button>
            <button type="button" className="button" onClick={resetCorrupt}>
              Начать заново
            </button>
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      <h1>Профиль</h1>
      {status === 'unavailable' && (
        <p className="profile-warning" role="alert">
          Браузер не даёт сохранять данные: результаты пропадут после закрытия
          страницы
        </p>
      )}

      {store.dogs.length === 0 ? (
        <Onboarding
          onSave={(dogs) => dispatch({ type: 'addDogs', dogs, now: now() })}
        />
      ) : (
        <>
          <ul className="profile-list">
            {store.dogs.map((dog) => (
              <li key={dog.id} className="block profile-card">
                {editing === dog.id ? (
                  <DogEditForm
                    initial={{
                      name: dog.name,
                      breed: dog.breed ?? '',
                      birthMonth: dog.birthMonth ?? '',
                    }}
                    submitLabel="Сохранить"
                    onSubmit={(input) => {
                      dispatch({ type: 'updateDog', dogId: dog.id, ...input })
                      setEditing(null)
                    }}
                    onCancel={() => setEditing(null)}
                  />
                ) : (
                  <>
                    <h2>{dog.name}</h2>
                    <p className="profile-last">{lastResult(store, dog)}</p>
                    <div className="profile-actions">
                      <StartTestButton dogId={dog.id} />
                      <Link to={`/profile/dog/${dog.id}`} className="chip">
                        Профиль
                      </Link>
                      <button
                        type="button"
                        className="chip"
                        onClick={() => setEditing(dog.id)}
                      >
                        Изменить
                      </button>
                      <button
                        type="button"
                        className="chip"
                        onClick={() => removeDog(dog)}
                      >
                        Удалить
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>

          {editing === 'new' ? (
            <DogEditForm
              initial={EMPTY_DOG}
              submitLabel="Добавить"
              onSubmit={(input) => {
                dispatch({ type: 'addDogs', dogs: [input], now: now() })
                setEditing(null)
              }}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <button
              type="button"
              className="button"
              onClick={() => setEditing('new')}
            >
              Добавить собаку
            </button>
          )}
        </>
      )}

      <section className="profile-backup">
        <h2>Копия данных</h2>
        <p>
          Данные хранятся только в этом браузере. Сохраните копию, чтобы
          перенести их на другое устройство.
        </p>
        <div className="profile-actions">
          <button type="button" className="chip" onClick={exportData}>
            Сохранить копию
          </button>
          <label className="chip profile-file">
            Загрузить копию
            <input
              type="file"
              accept="application/json"
              onChange={importData}
            />
          </label>
        </div>
        {importError && (
          <p className="profile-error" role="alert">
            {importError}
          </p>
        )}
      </section>

      <p className="profile-disclaimer">
        Тест не является ветеринарной диагностикой.
      </p>
    </>
  )
}

export default ProfilesPage
