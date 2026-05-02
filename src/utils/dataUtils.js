export const DEFAULT_DATA = {
  settings: {
    mainUnit: '원',
    budgetUnit: '원',
    investUnit: '원',
    initialCash: 0,
  },
  expenseCategories: ['식비', '교통', '의료', '문화', '기타지출'],
  investTopCategories: ['주식', '예금/채권', '부동산', '기타'],
  investSubCategories: {
    '주식': ['국내주식', '해외주식'],
    '예금/채권': ['예금', '채권'],
    '부동산': ['부동산'],
    '기타': ['기타'],
  },
  budget: {},
  debt: {},
  investment: {},
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

function makeEmptyBudgetMonth(regularIncomeTemplate, expenseCategories) {
  const expenses = {}
  for (const cat of expenseCategories) expenses[cat] = []
  return {
    regularIncome: (regularIncomeTemplate || []).map(i => ({ name: i.name, amount: 0 })),
    irregularIncome: [],
    expenses,
  }
}

function makeEmptyInvestMonth(topCategories, subCategories) {
  const month = {}
  for (const top of topCategories) {
    month[top] = {}
    for (const sub of (subCategories[top] || [])) {
      month[top][sub] = []
    }
  }
  return month
}

export function ensureBudgetMonth(data, year, month) {
  const d = deepClone(data)
  if (!d.budget[year]) d.budget[year] = {}
  if (!d.budget[year][String(month)]) {
    const prevRegular = findPrevRegularIncome(d, year, month)
    d.budget[year][String(month)] = makeEmptyBudgetMonth(prevRegular, d.expenseCategories)
  }
  return d
}

export function ensureInvestMonth(data, year, month) {
  const d = deepClone(data)
  if (!d.investment[year]) d.investment[year] = {}
  if (!d.investment[year][String(month)]) {
    d.investment[year][String(month)] = makeEmptyInvestMonth(d.investTopCategories, d.investSubCategories)
  }
  return d
}

function findPrevRegularIncome(data, year, month) {
  for (let m = Number(month) - 1; m >= 1; m--) {
    const bm = data.budget?.[year]?.[String(m)]
    if (bm) return bm.regularIncome || []
  }
  return []
}

export function addRegularIncomeItem(data, year, fromMonth, name) {
  const d = deepClone(data)
  for (let m = Number(fromMonth); m <= 12; m++) {
    if (!d.budget[year]) d.budget[year] = {}
    if (!d.budget[year][String(m)]) {
      const prevRegular = findPrevRegularIncome(d, year, m)
      d.budget[year][String(m)] = makeEmptyBudgetMonth(prevRegular, d.expenseCategories)
    }
    const bm = d.budget[year][String(m)]
    if (!bm.regularIncome.find(i => i.name === name)) {
      bm.regularIncome.push({ name, amount: 0 })
    }
  }
  return d
}

export function removeRegularIncomeItem(data, year, fromMonth, name) {
  const d = deepClone(data)
  for (let m = Number(fromMonth); m <= 12; m++) {
    const bm = d.budget?.[year]?.[String(m)]
    if (bm) {
      bm.regularIncome = bm.regularIncome.filter(i => i.name !== name)
    }
  }
  return d
}

export function addExpenseCategory(data, name) {
  const d = deepClone(data)
  if (!d.expenseCategories.includes(name)) {
    d.expenseCategories.push(name)
  }
  for (const year of Object.keys(d.budget)) {
    for (const month of Object.keys(d.budget[year])) {
      if (!d.budget[year][month].expenses[name]) {
        d.budget[year][month].expenses[name] = []
      }
    }
  }
  return d
}

export function removeExpenseCategory(data, name) {
  const d = deepClone(data)
  d.expenseCategories = d.expenseCategories.filter(c => c !== name)
  for (const year of Object.keys(d.budget)) {
    for (const month of Object.keys(d.budget[year])) {
      delete d.budget[year][month].expenses[name]
    }
  }
  return d
}

export function addInvestTopCategory(data, year, fromMonth, name) {
  const d = deepClone(data)
  if (!d.investTopCategories.includes(name)) {
    d.investTopCategories.push(name)
  }
  if (!d.investSubCategories[name]) {
    d.investSubCategories[name] = [name]
  }
  for (let m = Number(fromMonth); m <= 12; m++) {
    if (!d.investment[year]) d.investment[year] = {}
    if (!d.investment[year][String(m)]) {
      d.investment[year][String(m)] = makeEmptyInvestMonth(d.investTopCategories, d.investSubCategories)
    }
    if (!d.investment[year][String(m)][name]) {
      d.investment[year][String(m)][name] = { [name]: [] }
    }
  }
  return d
}

export function removeInvestTopCategory(data, year, fromMonth, name) {
  const d = deepClone(data)
  d.investTopCategories = d.investTopCategories.filter(c => c !== name)
  delete d.investSubCategories[name]
  for (let m = Number(fromMonth); m <= 12; m++) {
    const im = d.investment?.[year]?.[String(m)]
    if (im) delete im[name]
  }
  return d
}

export function addInvestSubCategory(data, year, fromMonth, topCat, name) {
  const d = deepClone(data)
  if (!d.investSubCategories[topCat]) d.investSubCategories[topCat] = []
  if (!d.investSubCategories[topCat].includes(name)) {
    d.investSubCategories[topCat].push(name)
  }
  for (let m = Number(fromMonth); m <= 12; m++) {
    const im = d.investment?.[year]?.[String(m)]
    if (im && im[topCat] && !im[topCat][name]) {
      im[topCat][name] = []
    }
  }
  return d
}

export function removeInvestSubCategory(data, year, fromMonth, topCat, name) {
  const d = deepClone(data)
  if (d.investSubCategories[topCat]) {
    d.investSubCategories[topCat] = d.investSubCategories[topCat].filter(s => s !== name)
  }
  for (let m = Number(fromMonth); m <= 12; m++) {
    const im = d.investment?.[year]?.[String(m)]
    if (im?.[topCat]) delete im[topCat][name]
  }
  return d
}

export function renameRegularIncomeItem(data, year, oldName, newName) {
  const d = deepClone(data)
  for (const m of Object.keys(d.budget[year] || {})) {
    const item = (d.budget[year][m].regularIncome || []).find(i => i.name === oldName)
    if (item) item.name = newName
  }
  return d
}

export function renameExpenseCategory(data, oldName, newName) {
  const d = deepClone(data)
  const idx = d.expenseCategories.indexOf(oldName)
  if (idx !== -1) d.expenseCategories[idx] = newName
  for (const year of Object.keys(d.budget)) {
    for (const m of Object.keys(d.budget[year])) {
      const expenses = d.budget[year][m].expenses
      if (expenses[oldName] !== undefined) {
        expenses[newName] = expenses[oldName]
        delete expenses[oldName]
      }
    }
  }
  return d
}

export function renameInvestTopCategory(data, oldName, newName) {
  const d = deepClone(data)
  const idx = d.investTopCategories.indexOf(oldName)
  if (idx !== -1) d.investTopCategories[idx] = newName
  if (d.investSubCategories[oldName] !== undefined) {
    d.investSubCategories[newName] = d.investSubCategories[oldName]
    delete d.investSubCategories[oldName]
  }
  for (const year of Object.keys(d.investment)) {
    for (const m of Object.keys(d.investment[year])) {
      const im = d.investment[year][m]
      if (im[oldName] !== undefined) {
        im[newName] = im[oldName]
        delete im[oldName]
      }
    }
  }
  return d
}

export function renameInvestSubCategory(data, topCat, oldName, newName) {
  const d = deepClone(data)
  const subs = d.investSubCategories[topCat] || []
  const idx = subs.indexOf(oldName)
  if (idx !== -1) subs[idx] = newName
  for (const year of Object.keys(d.investment)) {
    for (const m of Object.keys(d.investment[year])) {
      const topData = d.investment[year][m][topCat]
      if (topData && topData[oldName] !== undefined) {
        topData[newName] = topData[oldName]
        delete topData[oldName]
      }
    }
  }
  return d
}
