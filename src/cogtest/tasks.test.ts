import { describe, expect, it } from 'vitest'
import { preparationEquipment, TEST_TASKS } from './tasks'

describe('preparationEquipment', () => {
  const list = preparationEquipment()

  it('lists treats once, as plain «лакомство»', () => {
    expect(list.filter((item) => item.includes('лакомств'))).toEqual(['лакомство'])
  })

  it('lists cups once, with the largest number any task needs', () => {
    expect(list.filter((item) => item.includes('стаканчик'))).toEqual(['3 одинаковых стаканчика'])
  })

  it('has no duplicates', () => {
    expect(new Set(list).size).toBe(list.length)
  })

  it('keeps every other item from the tasks', () => {
    const others = TEST_TASKS.flatMap((task) => task.equipment).filter(
      (item) => !item.includes('лакомств') && !item.includes('стаканчик'),
    )
    for (const item of others) expect(list).toContain(item)
  })
})
