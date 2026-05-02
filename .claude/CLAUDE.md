# 자산 관리 웹 애플리케이션

## 프로젝트 개요

- **목적**: 개인 자산을 관리할 수 있는 웹 애플리케이션으로, 가계부와 투자로 구분하여 관리한다. 현재는 사용자가 수기로 금액을 입력하는 방식으로 각 항목을 관리하지만, 추후 API 연동을 고려한다.

- **데이터 저장**: 로컬 파일 시스템 (File System Access API)을 이용. 파일은 json파일로 저장. 파일 핸들은 IndexedDB에 유지되어 페이지 새로고침 시 재선택 불필요.

- **배포**: https://github.com/tank3a/portfolio-app-v2에 배포.

- **관리**: 명령에 따라 변경된 spec에 대해서 instruction 문서를 수정. 그리고 history.md에 명령을 기록하여 context 유실을 방지.

## 기술 스택

- **프론트엔드**: React 18 + Vite
- **스타일링**: CSS (CSS variables, 별도 .css 파일)
- **차트 라이브러리**: Recharts
- **라우팅**: React Router DOM v6
- **데이터 저장**: File System Access API (JSON 파일, 단일 파일)

## 소스 구조

```
src/
├── App.jsx                        # 라우터 + 파일 로더 게이트
├── App.css                        # 파일 로더 화면 스타일
├── main.jsx
├── index.css                      # CSS 변수 및 전역 스타일
├── components/
│   ├── HoverMonthCard.jsx/.css    # 우측 슬라이드 월 선택 카드 (공통)
│   ├── UnitSelector.jsx/.css      # 원/천/만 단위 토글 (공통)
│   ├── MonthlyTable.jsx/.css      # 1~12월 통계 표 (공통)
│   └── MonthlyLineChart.jsx       # Recharts 꺾은선 그래프 (공통)
├── hooks/
│   └── useFileData.js             # File System API 훅
├── pages/
│   ├── MainPage.jsx/.css          # / — 전체 자산 요약
│   ├── BudgetMainPage.jsx/.css    # /budget — 가계부 메인
│   ├── BudgetDetailPage.jsx/.css  # /budget/:month — 가계부 상세
│   ├── InvestMainPage.jsx/.css    # /invest — 투자 메인
│   └── InvestDetailPage.jsx/.css  # /invest/:month — 투자 상세
└── utils/
    ├── calculations.js            # 순수 계산 함수 (부작용 없음)
    └── dataUtils.js               # 데이터 변경 헬퍼 (항상 새 객체 반환)
```

## 라우트 구조

| URL | 컴포넌트 | 설명 |
|---|---|---|
| `/` | MainPage | 총 자산/부채/순 자산 요약 |
| `/budget` | BudgetMainPage | 가계부 메인 (통계 표, 그래프) |
| `/budget/:month` | BudgetDetailPage | 월별 가계부 상세 입력 |
| `/invest` | InvestMainPage | 투자 메인 (통계 표, 그래프, 파이차트) |
| `/invest/:month` | InvestDetailPage | 월별 투자 상세 입력 |

> 연도는 현재 연도(2026) 고정. URL에 연도 없음. 연도 전환 UI 없음.

## 데이터 스키마 (data.json)

```json
{
  "settings": {
    "mainUnit": "원",
    "budgetUnit": "원",
    "investUnit": "원",
    "initialCash": 0
  },
  "expenseCategories": ["식비", "교통", "의료", "문화", "기타지출"],
  "investTopCategories": ["주식", "예금/채권", "부동산", "기타"],
  "investSubCategories": {
    "주식": ["국내주식", "해외주식"],
    "예금/채권": ["예금", "채권"],
    "부동산": ["부동산"],
    "기타": ["기타"]
  },
  "budget": {
    "2026": {
      "1": {
        "regularIncome": [{ "name": "월급", "amount": 3000000 }],
        "irregularIncome": [{ "name": "보너스", "amount": 0 }],
        "expenses": {
          "식비": [{ "name": "마트", "amount": 150000 }],
          "교통": []
        }
      }
    }
  },
  "debt": {
    "2026": {
      "1": [{ "name": "KB카드", "amount": 200000 }]
    }
  },
  "investment": {
    "2026": {
      "1": {
        "주식": {
          "국내주식": [{ "name": "삼성전자", "amount": 1000000, "deposit": 500000 }],
          "해외주식": []
        },
        "예금/채권": {
          "예금": [],
          "채권": []
        },
        "부동산": { "부동산": [] },
        "기타": { "기타": [] }
      }
    }
  }
}
```

## 수식 계산방식

모든 계산은 `src/utils/calculations.js`의 순수 함수에서 처리. 저장되지 않고 항상 파생 계산.

| 값 | 수식 |
|---|---|
| 순수입 | sum(regularIncome.amount) + sum(irregularIncome.amount) |
| 총지출 | 모든 지출 카테고리 항목 합산 |
| 투자금변경금 | −sum(주식 항목의 deposit 값) |
| 현금 (1월) | `initialCash + 순수입 − 총지출 + 투자금변경금` |
| 현금 (2월~) | `직전월 현금 + 순수입 − 총지출 + 투자금변경금` |
| 총 자산 | 마지막 활성 가계부 월의 현금 + 마지막 활성 투자 월의 모든 투자 금액 합산 |
| 총 부채 | 현재 월 debt 항목 합산 |
| 순 자산 | 총 자산 − 총 부채 |

> 투자금변경금: 입금(deposit > 0)은 현금에서 나가므로 음수. 인출(deposit < 0)은 현금으로 들어오므로 양수. 즉 `투자금변경금 = -deposit`.

## 데이터 전파 규칙

| 동작 | 범위 |
|---|---|
| 정기수입 항목 추가 (M월) | M~12월에 항목 생성 (기존 금액 유지, 신규 월은 0) |
| 정기수입 항목 삭제 (M월) | M~12월에서 항목 제거 + window.confirm |
| 지출 카테고리 추가 | 전체 월에 반영 (전역) |
| 지출 카테고리 삭제 | 전체 월에서 제거 + window.confirm |
| 투자 상위/하위 카테고리 추가 (M월) | M~12월에 반영 |
| 투자 상위/하위 카테고리 삭제 (M월) | M~12월에서 제거 + window.confirm |
| 주식 입금/인출 | 가계부 투자금변경금에 자동 반영 (저장 없이 파생) |

## 주요 구현 세부사항

### useFileData 훅
- `showOpenFilePicker()` / `showSaveFilePicker()` 로 파일 선택
- `FileSystemFileHandle`을 IndexedDB(`asset-manager-v2` DB)에 저장하여 재방문 시 자동 복원
- `updateData(fn)`: updater 함수를 받아 state 업데이트 후 즉시 파일에 write

### 월 초기화 패턴
- 상세 페이지 진입 시 해당 월 데이터가 없으면 `useEffect`로 초기화
- 현재 렌더에서는 빈 객체를 폴백으로 사용 (렌더 중 setState 호출 방지)
- `ensureBudgetMonth`: 직전 월의 정기수입 구조를 복사하여 새 월 생성

### 단위 변환
- 내부 저장은 항상 원 단위 정수
- `formatAmount(value, unit)`: 표시 시 divisor 적용 (천→÷1000, 만→÷10000)
- `parseAmount(str, unit)`: 입력 시 multiplier 적용 (역변환)
- 단위 설정은 `data.settings.{main|budget|invest}Unit` 에 저장

### 공통 컴포넌트
- `HoverMonthCard`: CSS `transform: translateX(calc(100% - 24px))` → hover 시 `translateX(0)`. 우측 고정 슬라이드.
- `MonthlyTable`: rows 배열 `{label, values: {1..12}}` 를 props로 받음. 직접 수정 불가 (read-only).
- `MonthlyLineChart`: `series: [{name, data: {1..12}}]` 를 props로 받음.

## 기능 요구사항

### 0. 공통사항

- 금액 단위 선택이 가능하고, 선택한 단위는 다시 파일을 로딩해도 기억될 수 있도록 저장해야 함.(원단위, 천단위, 만단위) 금액단위는 아래의 월별 통계도 같이 반영이 되어야 함. 단위 관리가 되어야 하는 페이지마다 별도로 적용
- (#) 로 적은 부분은 기능 요구사항의 몇번으로 이동되는지 기록해둔 부분이다. 각 페이지별로 상세 구현 내용을 아래의 번호로 작성해두었다.
- 모든 데이터는 입력 즉시 파일에 저장이 되어야 한다.

### 1. 메인페이지 (전체 자산 조회 페이지)

- main.md 참고

### 2. 가계부 메인페이지

- budget-main.md 참고

### 3. 투자 메인페이지

- invest-main.md 참고

### 4. 가계부 상세 페이지

- budget-detail.md 참고

### 5. 투자 상세 페이지

- invest-detail.md 참고
