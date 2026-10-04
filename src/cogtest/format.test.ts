import { describe, expect, it } from 'vitest'
import { addMonths } from './format'

function ymd(date: Date): [number, number, number] {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
}

function local(year: number, month: number, day: number): string {
  return new Date(year, month - 1, day, 12).toISOString()
}

describe('addMonths', () => {
  it('clamps Aug 31 + 6 months to Feb 28', () => {
    expect(ymd(addMonths(local(2026, 8, 31), 6))).toEqual([2027, 2, 28])
  })

  it('clamps to Feb 29 in a leap year', () => {
    expect(ymd(addMonths(local(2027, 8, 31), 6))).toEqual([2028, 2, 29])
  })

  it('keeps the day when the target month is long enough', () => {
    expect(ymd(addMonths(local(2026, 3, 15), 6))).toEqual([2026, 9, 15])
  })
})
