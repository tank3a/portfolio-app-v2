import { useNavigate } from 'react-router-dom'
import './HoverMonthCard.css'

const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

export default function HoverMonthCard({ basePath, currentMonth }) {
  const navigate = useNavigate()
  return (
    <div className="hover-month-card">
      <div className="hover-month-tab">▶</div>
      <div className="hover-month-list">
        {MONTH_NAMES.map((name, i) => (
          <button
            key={i}
            className={`hover-month-item${currentMonth === i + 1 ? ' active' : ''}`}
            onClick={() => navigate(`${basePath}/${i + 1}`)}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  )
}
