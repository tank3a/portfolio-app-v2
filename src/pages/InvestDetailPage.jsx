import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { formatAmount, CURRENT_YEAR } from '../utils/calculations'
import {
  ensureInvestMonth, addInvestTopCategory, removeInvestTopCategory,
  addInvestSubCategory, removeInvestSubCategory,
  renameInvestTopCategory, renameInvestSubCategory
} from '../utils/dataUtils'
import UnitSelector from '../components/UnitSelector'
import AmountInput from '../components/AmountInput'
import EditableName from '../components/EditableName'
import './InvestDetailPage.css'

export default function InvestDetailPage({ data, updateData }) {
  const { month } = useParams()
  const navigate = useNavigate()
  const [editMode, setEditMode] = useState(false)
  const year = CURRENT_YEAR
  const m = Number(month)
  const unit = data.settings.investUnit

  useEffect(() => {
    if (!data.investment?.[year]?.[String(m)]) {
      updateData(prev => ensureInvestMonth(prev, year, m))
    }
  }, [year, m]) // eslint-disable-line react-hooks/exhaustive-deps

  const im = useMemo(() => {
    return data.investment?.[year]?.[String(m)] || {}
  }, [data, year, m])

  const topCats = Object.keys(im)

  function setItemAmount(topCat, subCat, itemName, amount) {
    updateData(prev => {
      const d = JSON.parse(JSON.stringify(prev))
      const ensured = d.investment?.[year]?.[String(m)] ? d : ensureInvestMonth(d, year, m)
      const item = ensured.investment[year][String(m)]?.[topCat]?.[subCat]?.find(i => i.name === itemName)
      if (item) item.amount = amount
      return ensured
    })
  }

  function setItemDeposit(topCat, subCat, itemName, amount) {
    updateData(prev => {
      const d = JSON.parse(JSON.stringify(prev))
      const ensured = d.investment?.[year]?.[String(m)] ? d : ensureInvestMonth(d, year, m)
      const item = ensured.investment[year][String(m)]?.[topCat]?.[subCat]?.find(i => i.name === itemName)
      if (item) item.deposit = amount
      return ensured
    })
  }

  function getPrevAmount(topCat, subCat, itemName) {
    if (m <= 1) return null
    const prevIm = data.investment?.[year]?.[String(m - 1)]
    if (!prevIm) return null
    const item = prevIm[topCat]?.[subCat]?.find(i => i.name === itemName)
    return item?.amount ?? null
  }

  function handleAddItem(topCat, subCat) {
    const name = window.prompt(`"${subCat}" 항목명을 입력하세요`)
    if (!name?.trim()) return
    const isStock = topCat === '주식'
    updateData(prev => {
      const d = JSON.parse(JSON.stringify(prev))
      const ensured = d.investment?.[year]?.[String(m)] ? d : ensureInvestMonth(d, year, m)
      const im = ensured.investment[year][String(m)]
      if (!im[topCat]) im[topCat] = {}
      if (!im[topCat][subCat]) im[topCat][subCat] = []
      im[topCat][subCat].push(isStock ? { name: name.trim(), amount: 0, deposit: 0 } : { name: name.trim(), amount: 0 })
      return ensured
    })
  }

  function handleRemoveItem(topCat, subCat, itemName) {
    updateData(prev => {
      const d = JSON.parse(JSON.stringify(prev))
      const arr = d.investment?.[year]?.[String(m)]?.[topCat]?.[subCat]
      if (arr) {
        const idx = arr.findIndex(i => i.name === itemName)
        if (idx !== -1) arr.splice(idx, 1)
      }
      return d
    })
  }

  function handleAddSubCat(topCat) {
    const name = window.prompt(`"${topCat}"의 하위 카테고리명을 입력하세요`)
    if (!name?.trim()) return
    updateData(prev => addInvestSubCategory(prev, year, m, topCat, name.trim()))
  }

  function handleRemoveSubCat(topCat, subCat) {
    if (!window.confirm(`"${subCat}" 카테고리를 ${m}월 이후 모든 월에서 삭제하시겠습니까?`)) return
    updateData(prev => removeInvestSubCategory(prev, year, m, topCat, subCat))
  }

  function handleAddTopCat() {
    const name = window.prompt('새 투자 카테고리명을 입력하세요')
    if (!name?.trim()) return
    updateData(prev => addInvestTopCategory(prev, year, m, name.trim()))
  }

  function handleRemoveTopCat(topCat) {
    if (!window.confirm(`"${topCat}" 카테고리를 ${m}월 이후 모든 월에서 삭제하시겠습니까?`)) return
    updateData(prev => removeInvestTopCategory(prev, year, m, topCat))
  }

  function getCatTotal(topCat) {
    const subCats = Object.keys(im?.[topCat] || {})
    let total = 0
    for (const sub of subCats) {
      for (const item of (im?.[topCat]?.[sub] || [])) total += (item.amount || 0)
    }
    return total
  }

  return (
    <div className="invest-detail-page">
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate('/invest')}>← 투자</button>
        <h2>{m}월 투자</h2>
        <div className="header-right">
          <UnitSelector unit={unit} onChange={u => updateData(prev => ({ ...prev, settings: { ...prev.settings, investUnit: u } }))} />
          <button className={`edit-btn${editMode ? ' active' : ''}`} onClick={() => setEditMode(e => !e)}>
            {editMode ? '완료' : '편집'}
          </button>
        </div>
      </div>

      {editMode && (
        <button className="add-category-btn" onClick={handleAddTopCat}>+ 카테고리 추가</button>
      )}

      {topCats.map(topCat => {
        const subCats = Object.keys(im[topCat] || {})
        const catTotal = getCatTotal(topCat)
        const isStock = topCat === '주식'

        return (
          <div key={topCat} className="top-category-section">
            <div className="top-cat-header">
              <span>
                {editMode && <button className="del-btn" onClick={() => handleRemoveTopCat(topCat)}>✕</button>}
                <EditableName
                  name={topCat}
                  editMode={editMode}
                  onRename={newName => updateData(prev => renameInvestTopCategory(prev, topCat, newName))}
                />
              </span>
              <span className="cat-total-badge">{formatAmount(catTotal, unit)}{unit}</span>
              {editMode && <button className="add-btn" onClick={() => handleAddSubCat(topCat)}>+ 하위 카테고리</button>}
            </div>

            <div className="sub-cats-grid">
              {subCats.map(subCat => {
                const items = im?.[topCat]?.[subCat] || []
                const subTotal = items.reduce((s, i) => s + (i.amount || 0), 0)

                return (
                  <div key={subCat} className="sub-category-card">
                    <div className="sub-cat-header">
                      <span>
                        {editMode && <button className="del-btn" onClick={() => handleRemoveSubCat(topCat, subCat)}>✕</button>}
                        <EditableName
                          name={subCat}
                          editMode={editMode}
                          onRename={newName => updateData(prev => renameInvestSubCategory(prev, topCat, subCat, newName))}
                        />
                      </span>
                      {editMode && <button className="add-btn" onClick={() => handleAddItem(topCat, subCat)}>+ 추가</button>}
                    </div>

                    {items.map(item => {
                      const prevAmt = isStock ? getPrevAmount(topCat, subCat, item.name) : null
                      const change = isStock && prevAmt !== null
                        ? item.amount - prevAmt - (item.deposit || 0)
                        : null

                      return (
                        <div key={item.name} className="invest-item">
                          <div className="item-top">
                            <div className="item-name">
                              {editMode && <button className="del-btn" onClick={() => handleRemoveItem(topCat, subCat, item.name)}>✕</button>}
                              <EditableName
                                name={item.name}
                                editMode={editMode}
                                onRename={newName => updateData(prev => {
                                  const d = JSON.parse(JSON.stringify(prev))
                                  const found = d.investment[year][String(m)]?.[topCat]?.[subCat]?.find(i => i.name === item.name)
                                  if (found) found.name = newName
                                  return d
                                })}
                              />
                            </div>
                            <AmountInput
                              className="amount-input"
                              value={item.amount || 0}
                              unit={unit}
                              onChange={val => setItemAmount(topCat, subCat, item.name, val)}
                            />
                          </div>
                          {isStock && (
                            <div className="stock-extras">
                              <label>입금/인출:</label>
                              <AmountInput
                                className="amount-input small"
                                value={item.deposit || 0}
                                unit={unit}
                                onChange={val => setItemDeposit(topCat, subCat, item.name, val)}
                              />
                              {change !== null && (
                                <span className={`change-badge${change >= 0 ? ' pos' : ' neg'}`}>
                                  {change >= 0 ? '+' : ''}{formatAmount(change, unit)}{unit}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}

                    <div className="sub-cat-total">{subCat} 합계: {formatAmount(subTotal, unit)}{unit}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
