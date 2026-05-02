import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getNetIncome, getTotalExpenses, formatAmount, CURRENT_YEAR
} from '../utils/calculations'
import {
  ensureBudgetMonth, addRegularIncomeItem, removeRegularIncomeItem,
  addExpenseCategory, removeExpenseCategory,
  renameRegularIncomeItem, renameExpenseCategory
} from '../utils/dataUtils'
import UnitSelector from '../components/UnitSelector'
import AmountInput from '../components/AmountInput'
import EditableName from '../components/EditableName'
import './BudgetDetailPage.css'

export default function BudgetDetailPage({ data, updateData }) {
  const { month } = useParams()
  const navigate = useNavigate()
  const [editMode, setEditMode] = useState(false)
  const year = CURRENT_YEAR
  const m = Number(month)
  const unit = data.settings.budgetUnit

  useEffect(() => {
    if (!data.budget?.[year]?.[String(m)]) {
      updateData(prev => ensureBudgetMonth(prev, year, m))
    }
  }, [year, m]) // eslint-disable-line react-hooks/exhaustive-deps

  const bm = useMemo(() => {
    return data.budget?.[year]?.[String(m)] || {
      regularIncome: [],
      irregularIncome: [],
      expenses: Object.fromEntries((data.expenseCategories || []).map(c => [c, []])),
    }
  }, [data, year, m])
  const netIncome = getNetIncome(bm)
  const totalExpenses = getTotalExpenses(bm)

  function setAmount(path, amount) {
    updateData(prev => {
      const d = JSON.parse(JSON.stringify(prev))
      const ensured = d.budget?.[year]?.[String(m)] ? d : ensureBudgetMonth(d, year, m)
      const ptr = ensured.budget[year][String(m)]
      if (path[0] === 'regularIncome') {
        const item = ptr.regularIncome.find(i => i.name === path[1])
        if (item) item.amount = amount
      } else if (path[0] === 'irregularIncome') {
        const item = ptr.irregularIncome.find(i => i.name === path[1])
        if (item) item.amount = amount
      } else if (path[0] === 'expenses') {
        const item = (ptr.expenses[path[1]] || []).find(i => i.name === path[2])
        if (item) item.amount = amount
      }
      return ensured
    })
  }

  function handleAddRegular() {
    const name = window.prompt('정기수입 항목명을 입력하세요')
    if (!name?.trim()) return
    updateData(prev => addRegularIncomeItem(prev, year, m, name.trim()))
  }

  function handleRemoveRegular(name) {
    if (!window.confirm(`"${name}" 항목을 ${m}월 이후 모든 월에서 삭제하시겠습니까?`)) return
    updateData(prev => removeRegularIncomeItem(prev, year, m, name))
  }

  function handleAddIrregular() {
    const name = window.prompt('비정기수입 항목명을 입력하세요')
    if (!name?.trim()) return
    updateData(prev => {
      const d = JSON.parse(JSON.stringify(prev))
      const ensured = d.budget?.[year]?.[String(m)] ? d : ensureBudgetMonth(d, year, m)
      ensured.budget[year][String(m)].irregularIncome.push({ name: name.trim(), amount: 0 })
      return ensured
    })
  }

  function handleRemoveIrregular(name) {
    updateData(prev => {
      const d = JSON.parse(JSON.stringify(prev))
      d.budget[year][String(m)].irregularIncome =
        d.budget[year][String(m)].irregularIncome.filter(i => i.name !== name)
      return d
    })
  }

  function handleAddCategory() {
    const name = window.prompt('지출 카테고리명을 입력하세요')
    if (!name?.trim()) return
    updateData(prev => addExpenseCategory(prev, name.trim()))
  }

  function handleRemoveCategory(name) {
    if (!window.confirm(`"${name}" 카테고리를 모든 월에서 삭제하시겠습니까?`)) return
    updateData(prev => removeExpenseCategory(prev, name))
  }

  function handleAddExpenseItem(cat) {
    const name = window.prompt(`"${cat}" 카테고리에 항목명을 입력하세요`)
    if (!name?.trim()) return
    updateData(prev => {
      const d = JSON.parse(JSON.stringify(prev))
      const ensured = d.budget?.[year]?.[String(m)] ? d : ensureBudgetMonth(d, year, m)
      if (!ensured.budget[year][String(m)].expenses[cat]) {
        ensured.budget[year][String(m)].expenses[cat] = []
      }
      ensured.budget[year][String(m)].expenses[cat].push({ name: name.trim(), amount: 0 })
      return ensured
    })
  }

  function handleRemoveExpenseItem(cat, name) {
    updateData(prev => {
      const d = JSON.parse(JSON.stringify(prev))
      d.budget[year][String(m)].expenses[cat] =
        d.budget[year][String(m)].expenses[cat].filter(i => i.name !== name)
      return d
    })
  }

  const categories = data.expenseCategories || []

  return (
    <div className="budget-detail-page">
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate('/budget')}>← 가계부</button>
        <h2>{m}월 가계부</h2>
        <div className="header-right">
          <UnitSelector unit={unit} onChange={u => updateData(prev => ({ ...prev, settings: { ...prev.settings, budgetUnit: u } }))} />
          <button className={`edit-btn${editMode ? ' active' : ''}`} onClick={() => setEditMode(e => !e)}>
            {editMode ? '완료' : '편집'}
          </button>
        </div>
      </div>

      <div className="detail-summary">
        <span>순수입: <strong className="income">{formatAmount(netIncome, unit)}{unit}</strong></span>
        <span>총지출: <strong className="expense">{formatAmount(totalExpenses, unit)}{unit}</strong></span>
        <span>잔액: <strong>{formatAmount(netIncome - totalExpenses, unit)}{unit}</strong></span>
      </div>

      <div className="detail-columns">
        {/* Income column */}
        <div className="detail-col income-col">
          <div className="col-title">수입</div>

          <div className="income-section">
            <div className="section-header">
              <span className="section-title">정기수입</span>
              {editMode && <button className="add-btn" onClick={handleAddRegular}>+ 추가</button>}
            </div>
            {(bm.regularIncome || []).map(item => (
              <div key={item.name} className="income-item">
                <div className="item-name">
                  {editMode && <button className="del-btn" onClick={() => handleRemoveRegular(item.name)}>✕</button>}
                  <EditableName
                    name={item.name}
                    editMode={editMode}
                    onRename={newName => updateData(prev => renameRegularIncomeItem(prev, year, item.name, newName))}
                  />
                </div>
                <AmountInput
                  className="amount-input"
                  value={item.amount || 0}
                  unit={unit}
                  onChange={val => setAmount(['regularIncome', item.name], val)}
                />
              </div>
            ))}
            <div className="section-total">
              합계: {formatAmount((bm.regularIncome || []).reduce((s, i) => s + i.amount, 0), unit)}{unit}
            </div>
          </div>

          <div className="income-section">
            <div className="section-header">
              <span className="section-title">비정기수입</span>
              {editMode && <button className="add-btn" onClick={handleAddIrregular}>+ 추가</button>}
            </div>
            {(bm.irregularIncome || []).map(item => (
              <div key={item.name} className="income-item">
                <div className="item-name">
                  {editMode && <button className="del-btn" onClick={() => handleRemoveIrregular(item.name)}>✕</button>}
                  <EditableName
                    name={item.name}
                    editMode={editMode}
                    onRename={newName => updateData(prev => {
                      const d = JSON.parse(JSON.stringify(prev))
                      const found = d.budget[year][String(m)].irregularIncome.find(i => i.name === item.name)
                      if (found) found.name = newName
                      return d
                    })}
                  />
                </div>
                <AmountInput
                  className="amount-input"
                  value={item.amount || 0}
                  unit={unit}
                  onChange={val => setAmount(['irregularIncome', item.name], val)}
                />
              </div>
            ))}
            <div className="section-total">
              합계: {formatAmount((bm.irregularIncome || []).reduce((s, i) => s + i.amount, 0), unit)}{unit}
            </div>
          </div>

          <div className="col-total income">총 수입: {formatAmount(netIncome, unit)}{unit}</div>
        </div>

        {/* Expense column */}
        <div className="detail-col expense-col">
          <div className="col-title">지출</div>

          {editMode && (
            <button className="add-category-btn" onClick={handleAddCategory}>+ 카테고리 추가</button>
          )}

          {categories.map(cat => {
            const items = bm.expenses?.[cat] || []
            const catTotal = items.reduce((s, i) => s + (i.amount || 0), 0)
            return (
              <div key={cat} className="expense-category-card">
                <div className="cat-header">
                  <span className="cat-name">
                    {editMode && (
                      <button className="del-btn" onClick={() => handleRemoveCategory(cat)}>✕</button>
                    )}
                    <EditableName
                      name={cat}
                      editMode={editMode}
                      onRename={newName => updateData(prev => renameExpenseCategory(prev, cat, newName))}
                    />
                  </span>
                  {editMode && <button className="add-btn" onClick={() => handleAddExpenseItem(cat)}>+ 추가</button>}
                </div>
                {items.map(item => (
                  <div key={item.name} className="expense-item">
                    <div className="item-name">
                      {editMode && (
                        <button className="del-btn" onClick={() => handleRemoveExpenseItem(cat, item.name)}>✕</button>
                      )}
                      <EditableName
                        name={item.name}
                        editMode={editMode}
                        onRename={newName => updateData(prev => {
                          const d = JSON.parse(JSON.stringify(prev))
                          const found = d.budget[year][String(m)].expenses[cat]?.find(i => i.name === item.name)
                          if (found) found.name = newName
                          return d
                        })}
                      />
                    </div>
                    <AmountInput
                      className="amount-input"
                      value={item.amount || 0}
                      unit={unit}
                      onChange={val => setAmount(['expenses', cat, item.name], val)}
                    />
                  </div>
                ))}
                <div className="cat-total">{cat} 합계: {formatAmount(catTotal, unit)}{unit}</div>
              </div>
            )
          })}

          <div className="col-total expense">총 지출: {formatAmount(totalExpenses, unit)}{unit}</div>
        </div>
      </div>
    </div>
  )
}
