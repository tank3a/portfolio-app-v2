import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import {
  getTotalInvestment, getInvestmentByCategory, getLastActiveInvestMonth,
  formatAmount, CURRENT_YEAR
} from '../utils/calculations'
import { addInvestTopCategory } from '../utils/dataUtils'
import UnitSelector from '../components/UnitSelector'
import HoverMonthCard from '../components/HoverMonthCard'
import MonthlyTable from '../components/MonthlyTable'
import MonthlyLineChart from '../components/MonthlyLineChart'
import './InvestMainPage.css'

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444']

export default function InvestMainPage({ data, updateData }) {
  const navigate = useNavigate()
  const year = CURRENT_YEAR
  const unit = data.settings.investUnit
  const [pieMonth, setPieMonth] = useState(new Date().getMonth() + 1)

  const lastMonth = getLastActiveInvestMonth(data, year) || new Date().getMonth() + 1
  const topCats = data.investTopCategories || []

  const headerAmounts = getInvestmentByCategory(data, year, lastMonth)

  function buildRows() {
    return topCats.map(cat => {
      const row = { label: cat, values: {} }
      for (let m = 1; m <= 12; m++) {
        const catData = getInvestmentByCategory(data, year, m)
        row.values[m] = catData[cat] ?? null
      }
      return row
    })
  }

  function buildChartSeries() {
    return topCats.map(cat => ({
      name: cat,
      data: Object.fromEntries(
        Array.from({ length: 12 }, (_, i) => [
          i + 1,
          getInvestmentByCategory(data, year, i + 1)[cat] ?? null
        ])
      )
    }))
  }

  function buildPieData() {
    const catAmounts = getInvestmentByCategory(data, year, pieMonth)
    return topCats
      .map(cat => ({ name: cat, value: catAmounts[cat] || 0 }))
      .filter(d => d.value > 0)
  }

  function handleAddCategory() {
    const name = window.prompt('새 투자 카테고리명을 입력하세요')
    if (!name?.trim()) return
    const currentMonth = new Date().getMonth() + 1
    updateData(prev => addInvestTopCategory(prev, year, currentMonth, name.trim()))
  }

  return (
    <div className="invest-main-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/')}>← 홈</button>
        <h1>투자</h1>
        <div className="header-right">
          <button className="add-cat-btn" onClick={handleAddCategory}>+ 카테고리</button>
          <UnitSelector unit={unit} onChange={u => updateData(prev => ({ ...prev, settings: { ...prev.settings, investUnit: u } }))} />
        </div>
      </div>

      <div className="summary-cards">
        {topCats.map((cat, i) => (
          <div key={cat} className="summary-card" style={{ borderTopColor: PIE_COLORS[i % PIE_COLORS.length] }}>
            <div className="card-label">{cat}</div>
            <div className="card-value">
              {formatAmount(headerAmounts[cat] || 0, unit)}<span className="unit">{unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="section">
        <h2>월별 통계</h2>
        <MonthlyTable rows={buildRows()} unit={unit} />
      </div>

      <div className="charts-row">
        <div className="section chart-section">
          <h2>추이 그래프</h2>
          <MonthlyLineChart series={buildChartSeries()} unit={unit} />
        </div>

        <div className="section pie-section">
          <div className="pie-header">
            <h2>구성 비율</h2>
            <select
              value={pieMonth}
              onChange={e => setPieMonth(Number(e.target.value))}
              className="month-select"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}월</option>
              ))}
            </select>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={buildPieData()}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {buildPieData().map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(val) => [formatAmount(val, unit) + unit, '']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <HoverMonthCard basePath="/invest" currentMonth={lastMonth} />
    </div>
  )
}
