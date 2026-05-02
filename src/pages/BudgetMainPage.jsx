import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getNetIncome, getTotalExpenses, getInvestmentChange, getCash,
  getLastActiveMonth, formatAmount, CURRENT_YEAR
} from '../utils/calculations'
import UnitSelector from '../components/UnitSelector'
import HoverMonthCard from '../components/HoverMonthCard'
import MonthlyTable from '../components/MonthlyTable'
import MonthlyLineChart from '../components/MonthlyLineChart'
import './BudgetMainPage.css'

export default function BudgetMainPage({ data, updateData }) {
  const navigate = useNavigate()
  const [editingInitial, setEditingInitial] = useState(false)
  const [initialInput, setInitialInput] = useState('')
  const year = CURRENT_YEAR
  const unit = data.settings.budgetUnit

  const lastMonth = getLastActiveMonth(data, year)
  const displayMonth = lastMonth || new Date().getMonth() + 1

  const displayBm = data.budget?.[year]?.[String(displayMonth)] || {}
  const displayNetIncome = getNetIncome(displayBm)
  const displayTotalExpenses = getTotalExpenses(displayBm)
  const displayCash = getCash(data, year, displayMonth)

  function saveInitialCash() {
    const val = Number(String(initialInput).replace(/,/g, ''))
    if (!isNaN(val)) {
      updateData(prev => ({ ...prev, settings: { ...prev.settings, initialCash: val } }))
    }
    setEditingInitial(false)
  }

  const categories = data.expenseCategories || []

  function buildRows() {
    const rows = []
    const regularRow = { label: '정기수입', values: {} }
    const irregularRow = { label: '비정기수입', values: {} }
    for (let m = 1; m <= 12; m++) {
      const bm = data.budget?.[year]?.[String(m)] || {}
      regularRow.values[m] = (bm.regularIncome || []).reduce((s, i) => s + (i.amount || 0), 0)
      irregularRow.values[m] = (bm.irregularIncome || []).reduce((s, i) => s + (i.amount || 0), 0)
    }
    rows.push(regularRow, irregularRow)

    for (const cat of categories) {
      const row = { label: cat, values: {} }
      for (let m = 1; m <= 12; m++) {
        const items = data.budget?.[year]?.[String(m)]?.expenses?.[cat] || []
        row.values[m] = items.reduce((s, i) => s + (i.amount || 0), 0)
      }
      rows.push(row)
    }

    const investRow = { label: '투자금변경금', values: {} }
    for (let m = 1; m <= 12; m++) {
      investRow.values[m] = getInvestmentChange(data, year, m)
    }
    rows.push(investRow)

    const cashRow = { label: '현금잔액', values: {}, highlight: true }
    for (let m = 1; m <= 12; m++) {
      cashRow.values[m] = getCash(data, year, m)
    }
    rows.push(cashRow)

    return rows
  }

  function buildChartSeries() {
    const netIncomeData = {}
    const totalExpenseData = {}
    const cashData = {}
    for (let m = 1; m <= 12; m++) {
      const bm = data.budget?.[year]?.[String(m)]
      if (!bm) continue
      netIncomeData[m] = getNetIncome(bm)
      totalExpenseData[m] = getTotalExpenses(bm)
      cashData[m] = getCash(data, year, m)
    }
    return [
      { name: '순수입', data: netIncomeData },
      { name: '총지출', data: totalExpenseData },
      { name: '현금잔액', data: cashData },
    ]
  }

  return (
    <div className="budget-main-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/')}>← 홈</button>
        <h1>가계부</h1>
        <div className="header-right">
          <button className="initial-cash-btn" onClick={() => { setInitialInput(String(data.settings.initialCash || 0)); setEditingInitial(true) }}>
            초기 현금 설정
          </button>
          <UnitSelector unit={unit} onChange={u => updateData(prev => ({ ...prev, settings: { ...prev.settings, budgetUnit: u } }))} />
        </div>
      </div>

      {editingInitial && (
        <div className="modal-overlay" onClick={() => setEditingInitial(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>초기 현금 설정</h3>
            <p>연초 ({year}년 1월) 기준 보유 현금을 입력하세요.</p>
            <input
              type="number"
              value={initialInput}
              onChange={e => setInitialInput(e.target.value)}
              autoFocus
            />
            <div className="modal-actions">
              <button onClick={saveInitialCash}>저장</button>
              <button onClick={() => setEditingInitial(false)}>취소</button>
            </div>
          </div>
        </div>
      )}

      <div className="summary-cards">
        <div className="summary-card income">
          <div className="card-label">{displayMonth}월 순수입</div>
          <div className="card-value">{formatAmount(displayNetIncome, unit)}<span className="unit">{unit}</span></div>
        </div>
        <div className="summary-card expense">
          <div className="card-label">{displayMonth}월 총지출</div>
          <div className="card-value">{formatAmount(displayTotalExpenses, unit)}<span className="unit">{unit}</span></div>
        </div>
        <div className="summary-card neutral">
          <div className="card-label">{displayMonth}월 현금</div>
          <div className="card-value">{formatAmount(displayCash, unit)}<span className="unit">{unit}</span></div>
        </div>
      </div>

      <div className="section">
        <h2>월별 통계</h2>
        <MonthlyTable rows={buildRows()} unit={unit} />
      </div>

      <div className="section">
        <h2>추이 그래프</h2>
        <MonthlyLineChart series={buildChartSeries()} unit={unit} />
      </div>

      <HoverMonthCard basePath="/budget" currentMonth={displayMonth} />
    </div>
  )
}
