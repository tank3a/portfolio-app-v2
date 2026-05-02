const YEAR = '2026'

export function getNetIncome(budgetMonth) {
  if (!budgetMonth) return 0
  const regular = (budgetMonth.regularIncome || []).reduce((s, i) => s + (i.amount || 0), 0)
  const irregular = (budgetMonth.irregularIncome || []).reduce((s, i) => s + (i.amount || 0), 0)
  return regular + irregular
}

export function getTotalExpenses(budgetMonth) {
  if (!budgetMonth) return 0
  const expenses = budgetMonth.expenses || {}
  return Object.values(expenses).reduce((sum, items) =>
    sum + (items || []).reduce((s, i) => s + (i.amount || 0), 0), 0)
}

export function getInvestmentChange(data, year, month) {
  const investMonth = data?.investment?.[year]?.[String(month)]
  if (!investMonth) return 0
  let total = 0
  for (const topCat of Object.keys(investMonth)) {
    for (const subCat of Object.keys(investMonth[topCat] || {})) {
      for (const item of (investMonth[topCat][subCat] || [])) {
        total += (item.deposit || 0)
      }
    }
  }
  return -total
}

export function getCash(data, year, month) {
  const m = Number(month)
  const budgetMonth = data?.budget?.[year]?.[String(m)]
  const netIncome = getNetIncome(budgetMonth)
  const totalExpenses = getTotalExpenses(budgetMonth)
  const investChange = getInvestmentChange(data, year, m)

  if (m === 1) {
    const initial = data?.settings?.initialCash || 0
    return initial + netIncome - totalExpenses + investChange
  }
  const prevCash = getCash(data, year, m - 1)
  return prevCash + netIncome - totalExpenses + investChange
}

export function getTotalInvestment(data, year, month) {
  const investMonth = data?.investment?.[year]?.[String(month)]
  if (!investMonth) return 0
  let total = 0
  for (const topCat of (data.investTopCategories || [])) {
    const subCats = data.investSubCategories?.[topCat] || []
    for (const sub of subCats) {
      const items = investMonth[topCat]?.[sub] || []
      for (const item of items) total += (item.amount || 0)
    }
  }
  return total
}

export function getInvestmentByCategory(data, year, month) {
  const investMonth = data?.investment?.[year]?.[String(month)]
  const result = {}
  for (const topCat of (data.investTopCategories || [])) {
    let sum = 0
    const subCats = data.investSubCategories?.[topCat] || []
    for (const sub of subCats) {
      const items = investMonth?.[topCat]?.[sub] || []
      for (const item of items) sum += (item.amount || 0)
    }
    result[topCat] = sum
  }
  return result
}

export function getTotalDebt(data, year, month) {
  const items = data?.debt?.[year]?.[String(month)] || []
  return items.reduce((s, i) => s + (i.amount || 0), 0)
}

export function getLastActiveMonth(data, year) {
  const months = Object.keys(data?.budget?.[year] || {}).map(Number).sort((a, b) => a - b)
  if (!months.length) return null
  for (let i = months.length - 1; i >= 0; i--) {
    const m = months[i]
    const bm = data.budget[year][String(m)]
    const hasIncome = getNetIncome(bm) > 0
    const hasExpense = getTotalExpenses(bm) > 0
    if (hasIncome || hasExpense) return m
  }
  return months[months.length - 1]
}

export function getLastActiveInvestMonth(data, year) {
  const months = Object.keys(data?.investment?.[year] || {}).map(Number).sort((a, b) => a - b)
  if (!months.length) return null
  for (let i = months.length - 1; i >= 0; i--) {
    const m = months[i]
    if (getTotalInvestment(data, year, m) > 0) return m
  }
  return months[months.length - 1]
}

export function formatAmount(value, unit) {
  if (!value && value !== 0) return '-'
  let divisor = 1
  if (unit === '천원') divisor = 1000
  else if (unit === '만원') divisor = 10000
  const display = Math.round(value / divisor)
  return display.toLocaleString()
}

export function parseAmount(str, unit) {
  const num = Number(String(str).replace(/,/g, ''))
  if (isNaN(num)) return 0
  let multiplier = 1
  if (unit === '천원') multiplier = 1000
  else if (unit === '만원') multiplier = 10000
  return num * multiplier
}

export const CURRENT_YEAR = YEAR
