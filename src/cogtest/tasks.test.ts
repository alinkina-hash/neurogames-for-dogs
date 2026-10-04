import { describe, expect, it } from 'vitest'
import { preparationEquipment, TEST_TASKS } from './tasks'

describe('preparationEquipment', () => {
  const list = preparationEquipment()

  it('lists treats once, as plain «лакомство»', () => {
    expect(list.filter((item) => item.includes('лакомств'))).toEqual(['лакомство'])
  })

  it('has no duplicates', () => {
    expect(new Set(list).size).toBe(list.length)
  })

  it('keeps every other item from the tasks', () => {
    const others = TEST_TASKS.flatMap((task) => task.equipment).filter((item) => !item.includes('лакомств'))
    for (const item of others) expect(list).toContain(item)
  })
})
