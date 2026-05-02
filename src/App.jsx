import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useFileData } from './hooks/useFileData'
import MainPage from './pages/MainPage'
import BudgetMainPage from './pages/BudgetMainPage'
import BudgetDetailPage from './pages/BudgetDetailPage'
import InvestMainPage from './pages/InvestMainPage'
import InvestDetailPage from './pages/InvestDetailPage'
import HelpModal from './components/HelpModal'
import './App.css'
import './components/HelpModal.css'

export default function App() {
  const { data, updateData, fileReady, isLoading, openFile, createFile, requestPermission } = useFileData()
  const [showHelp, setShowHelp] = useState(false)

  if (isLoading) {
    return (
      <div className="file-loader">
        <div className="loader-card">
          <div className="loader-spinner" />
          <p>로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!fileReady) {
    return (
      <div className="file-loader">
        <div className="loader-card">
          <div className="loader-icon">💼</div>
          <h1>자산 관리</h1>
          <p>데이터 파일을 선택하거나 새로 만들어 시작하세요.</p>
          <div className="loader-buttons">
            <button className="primary-btn" onClick={openFile}>파일 열기</button>
            <button className="secondary-btn" onClick={createFile}>새 파일 만들기</button>
          </div>
          <button className="text-btn" onClick={requestPermission}>
            이전 파일 다시 열기
          </button>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage data={data} updateData={updateData} />} />
        <Route path="/budget" element={<BudgetMainPage data={data} updateData={updateData} />} />
        <Route path="/budget/:month" element={<BudgetDetailPage data={data} updateData={updateData} />} />
        <Route path="/invest" element={<InvestMainPage data={data} updateData={updateData} />} />
        <Route path="/invest/:month" element={<InvestDetailPage data={data} updateData={updateData} />} />
      </Routes>
      <button className="help-btn" onClick={() => setShowHelp(true)}>?</button>
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </BrowserRouter>
  )
}
