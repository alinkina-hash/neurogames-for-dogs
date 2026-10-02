/** Picks the Russian plural form for n: forms are for 1, 2–4 and 5+ (e.g. игра, игры, игр). */
export function pluralRu(n: number, [one, few, many]: [string, string, string]): string {
  const lastTwo = Math.abs(n) % 100
  const last = lastTwo % 10
  if (lastTwo >= 11 && lastTwo <= 14) return many
  if (last === 1) return one
  if (last >= 2 && last <= 4) return few
  return many
}
