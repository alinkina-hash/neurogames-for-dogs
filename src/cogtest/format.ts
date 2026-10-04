import { pluralRu } from '../content/plural'

const MONTHS = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
]

const SHORT_MONTHS = [
  'янв',
  'фев',
  'мар',
  'апр',
  'мая',
  'июн',
  'июл',
  'авг',
  'сен',
  'окт',
  'ноя',
  'дек',
]

/** «3 октября 2026» */
export function formatDate(iso: string): string {
  const date = new Date(iso)
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`
}

/** «3 октября» */
export function formatDayMonth(iso: string): string {
  const date = new Date(iso)
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`
}

/** «3 окт» for chart labels */
export function formatShortDate(iso: string): string {
  const date = new Date(iso)
  return `${date.getDate()} ${SHORT_MONTHS[date.getMonth()]}`
}

/** Local date `months` after `iso`; a day past the end of the target month clamps to its last day. */
export function addMonths(iso: string, months: number): Date {
  const date = new Date(iso)
  const day = date.getDate()
  date.setDate(1)
  date.setMonth(date.getMonth() + months)
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  date.setDate(Math.min(day, lastDay))
  return date
}

function ageMonths(birthMonth: string | undefined, now: Date): number | undefined {
  const match = birthMonth?.match(/^(\d{4})-(\d{2})$/)
  if (!match) return undefined
  const months = (now.getFullYear() - Number(match[1])) * 12 + (now.getMonth() + 1 - Number(match[2]))
  return months < 0 ? undefined : months
}

/** «N месяцев» under a year, otherwise «N лет»; undefined when the month is unknown or invalid. */
export function ageText(birthMonth: string | undefined, now: Date): string | undefined {
  const months = ageMonths(birthMonth, now)
  if (months === undefined) return undefined
  if (months < 12) return `${months} ${pluralRu(months, ['месяц', 'месяца', 'месяцев'])}`
  const years = Math.floor(months / 12)
  return `${years} ${pluralRu(years, ['год', 'года', 'лет'])}`
}

/** Whole years; undefined when the month is unknown or invalid. */
export function ageYears(birthMonth: string | undefined, now: Date): number | undefined {
  const months = ageMonths(birthMonth, now)
  return months === undefined ? undefined : Math.floor(months / 12)
}

export function isSeniorAge(years: number): boolean {
  return years >= 8
}

export function testsCountText(n: number): string {
  return `${n} ${pluralRu(n, ['тест', 'теста', 'тестов'])}`
}
