import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getCash, getTotalInvestment, getTotalDebt, getLastActiveMonth, getLastActiveInvestMonth,
  formatAmount, CURRENT_YEAR
} from '../utils/calculations'
import UnitSelector from '../components/UnitSelector'
import AmountInput from '../components/AmountInput'
import './MainPage.css'

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

export default function MainPage({ data, updateData }) {
  const navigate = useNavigate()
  const year = CURRENT_YEAR
  const unit = data.settings.mainUnit
  const [expandedDebtMonth, setExpandedDebtMonth] = useState(null)

  const lastBudgetMonth = getLastActiveMonth(data, year) || new Date().getMonth() + 1
  const lastInvestMonth = getLastActiveInvestMonth(data, year) || new Date().getMonth() + 1
  const currentMonth = new Date().getMonth() + 1

  const cash = getCash(data, year, lastBudgetMonth)
  const totalInvest = getTotalInvestment(data, year, lastInvestMonth)
  const totalAssets = cash + totalInvest
  const totalDebt = getTotalDebt(data, year, currentMonth)
  const netAssets = totalAssets - totalDebt

  function addDebtItem(month) {
    const name = window.prompt('부채 항목명 (예: 신용카드)')
    if (!name?.trim()) return
    updateData(prev => {
      const d = JSON.parse(JSON.stringify(prev))
      if (!d.debt[year]) d.debt[year] = {}
      if (!d.debt[year][String(month)]) d.debt[year][String(month)] = []
      d.debt[year][String(month)].push({ name: name.trim(), amount: 0 })
      return d
    })
  }

  function removeDebtItem(month, idx) {
    updateData(prev => {
      const d = JSON.parse(JSON.stringify(prev))
      d.debt[year][String(month)].splice(idx, 1)
      return d
    })
  }

  function setDebtAmount(month, idx, amount) {
    updateData(prev => {
      const d = JSON.parse(JSON.stringify(prev))
      if (!d.debt[year]) d.debt[year] = {}
      if (!d.debt[year][String(month)]) d.debt[year][String(month)] = []
      if (d.debt[year][String(month)][idx]) {
        d.debt[year][String(month)][idx].amount = amount
      }
      return d
    })
  }

  return (
    <div className="main-page">
      <div className="main-header">
        <h1>자산 현황</h1>
        <UnitSelector unit={unit} onChange={u => updateData(prev => ({ ...prev, settings: { ...prev.settings, mainUnit: u } }))} />
      </div>

      <div className="asset-summary">
        <div className="asset-card total-assets">
          <div className="asset-label">총 자산</div>
          <div className="asset-value">{formatAmount(totalAssets, unit)}<span className="unit">{unit}</span></div>
          <div className="asset-sub">현금 {formatAmount(cash, unit)}{unit} + 투자 {formatAmount(totalInvest, unit)}{unit}</div>
        </div>
        <div className="asset-card total-debt">
          <div className="asset-label">총 부채</div>
          <div className="asset-value">{formatAmount(totalDebt, unit)}<span className="unit">{unit}</span></div>
          <div className="asset-sub">{currentMonth}월 기준</div>
        </div>
        <div className="asset-card net-assets">
          <div className="asset-label">순 자산</div>
          <div className={`asset-value ${netAssets >= 0 ? 'pos' : 'neg'}`}>
            {formatAmount(netAssets, unit)}<span className="unit">{unit}</span>
          </div>
          <div className="asset-sub">총 자산 - 총 부채</div>
        </div>
      </div>

      <div className="nav-buttons">
        <button className="nav-btn budget" onClick={() => navigate('/budget')}>
          <div className="nav-icon">📒</div>
          <div>가계부</div>
        </button>
        <button className="nav-btn invest" onClick={() => navigate('/invest')}>
          <div className="nav-icon">📈</div>
          <div>투자</div>
        </button>
      </div>

      {/* Debt hover card */}
      <div className="debt-hover-card">
        <div className="debt-tab">부채 입력</div>
        <div className="debt-card-content">
          <div className="debt-title">월별 부채 관리</div>
          {MONTHS.map(m => {
            const items = data.debt?.[year]?.[String(m)] || []
            const monthTotal = items.reduce((s, i) => s + (i.amount || 0), 0)
            const isExpanded = expandedDebtMonth === m
            return (
              <div key={m} className="debt-month-row">
                <div
                  className={`debt-month-header ${isExpanded ? 'expanded' : ''}`}
                  onClick={() => setExpandedDebtMonth(isExpanded ? null : m)}
                >
                  <span>{m}월</span>
                  <span className="debt-month-total">{formatAmount(monthTotal, unit)}{unit}</span>
                  <span>{isExpanded ? '▲' : '▼'}</span>
                </div>
                {isExpanded && (
                  <div className="debt-month-items">
                    {items.map((item, idx) => (
                      <div key={idx} className="debt-item">
                        <span className="debt-item-name">{item.name}</span>
                        <AmountInput
                          className="debt-amount-input"
                          value={item.amount || 0}
                          unit={unit}
                          onChange={val => setDebtAmount(m, idx, val)}
                        />
                        <button className="del-btn" onClick={() => removeDebtItem(m, idx)}>✕</button>
                      </div>
                    ))}
                    <button className="add-debt-btn" onClick={() => addDebtItem(m)}>+ 항목 추가</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
