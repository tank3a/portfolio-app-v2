# 변경 이력

## 2026-05-02 — 초기 프로젝트 구축

**명령**: 스펙 파일을 읽고 프로젝트를 처음부터 구축

**수행 내용**:
- Vite + React 18 프로젝트 스캐폴딩 (수동 생성, interactive CLI 미지원)
- npm 의존성 설치: react-router-dom, recharts
- 5개 페이지 전체 구현 (MainPage, BudgetMainPage, BudgetDetailPage, InvestMainPage, InvestDetailPage)
- 공통 컴포넌트 구현 (HoverMonthCard, UnitSelector, MonthlyTable, MonthlyLineChart)
- `useFileData` 훅: File System Access API + IndexedDB 핸들 영속화
- `calculations.js`: 순수 계산 함수 (getCash, getTotalAssets 등)
- `dataUtils.js`: 데이터 변경 헬퍼 (정기수입/카테고리 전파 로직 포함)

**확정된 설계 결정 (기획 당시 사용자 답변)**:
- 연도는 2026 고정, 연도 전환 UI 없음
- 1월 현금 공식: `initialCash + 순수입 - 총지출 + 투자금변경금`
- 비1월 현금도 동일하게 투자금변경금 포함 (원본 spec 미기재이나 정확성 위해 추가)
- 부채: 월별로 복수 항목 (이름 + 금액)
- 데이터 파일: 단일 JSON 파일

**버그 수정 (초기 구현 중)**:
- `addRegularIncomeItem`에서 새 월 생성 시 직전 월의 정기수입 구조를 복사하도록 수정
- 상세 페이지에서 렌더 중 `updateData` 호출 제거 → `useEffect` + `useMemo` 패턴으로 교체
- **2026-05-02 18:09**: This session is being continued from a previous conversation that ran out of context. The summary below covers the earlier portion of the conversation.

Summary:
1. Primary Request and Intent:
   - Build a personal asset management SPA (React+Vite) from scratch tracking household budget (가계부) and investments (투자) with local JSON persistence via File System Access API
   - Update CLAUDE.md and history.md to reflect implementation details for future context
   - Migrate V1 JSON data (`/Users/jwk/Downloads/26년 자산 (1).json`) to V2 format
   - Change unit labels from 원/천/만 to 원/천원/만원
   - Add thousand-separator comma formatting to all amount inputs
   - Add rename capability to all categories and items, available only in edit mode
   - **Current**: Create a Stop posthook that records command history to `.claude/history.md` and updates instructions when changes need to be memorized

2. Key Technical Concepts:
   - React 18 + Vite SPA, React Router DOM v6, Recharts, CSS variables
   - File System Access API (`showOpenFilePicker`, `showSaveFilePicker`) with FileSystemFileHandle persisted in IndexedDB
   - Single `data.json` file for all data; `updateData(fn)` writes immediately on every change
   - Year fixed to 2026 (CURRENT_YEAR constant in calculations.js)
   - Cash formula: Jan = `initialCash + 순수입 - 총지출 + 투자금변경금`; Feb+ same but uses prev month cash
   - 투자금변경금 = negative sum of all stock (주식) item `deposit` values (auto-derived, not stored)
   - Data propagation: regular income → current month to Dec; expense categories → all months global; invest categories → current month to Dec
   - AmountInput: stores raw 원 values internally, displays in selected unit with comma formatting
   - EditableName: inline editing on click in edit mode, commits on blur/Enter, cancels on Escape
   - Claude Code Stop hook for automated history recording

3. Files and Code Sections:
   - `src/utils/calculations.js` - Pure functions: `getNetIncome`, `getTotalExpenses`, `getInvestmentChange`, `getCash`, `getTotalInvestment`, `getInvestmentByCategory`, `getTotalDebt`, `getLastActiveMonth`, `getLastActiveInvestMonth`, `formatAmount`, `parseAmount`. Units now check for `'천원'`/`'만원'`.
   - `src/utils/dataUtils.js` - Mutation helpers including `ensureBudgetMonth`, `ensureInvestMonth`, `addRegularIncomeItem` (propagates m..12, copies prior regular income structure), `removeRegularIncomeItem`, `addExpenseCategory` (global), `removeExpenseCategory`, `addInvestTopCategory`, `removeInvestTopCategory`, `addInvestSubCategory`, `removeInvestSubCategory`, plus new rename functions: `renameRegularIncomeItem` (all months of year), `renameExpenseCategory` (global all years/months), `renameInvestTopCategory` (global), `renameInvestSubCategory` (global).
   - `src/hooks/useFileData.js` - File System API hook; restores handle from IndexedDB on load; `updateData(fn)` applies updater and writes JSON immediately.
   - `src/components/AmountInput.jsx` - Text input showing formatted value when unfocused, plain number when focused. `toDisplayValue(rawValue, unit)` divides by unit factor. On blur: `parseAmount(editText, unit)` converts back to raw.
   - `src/components/EditableName.jsx` + `EditableName.css` - Renders plain `<span>` in view mode, clickable dashed-underline span in edit mode, inline `<input>` when actively editing. Commits on blur/Enter, cancels on Escape.
   - `src/components/UnitSelector.jsx` - UNITS array changed to `['원', '천원', '만원']`
   - `src/pages/BudgetDetailPage.jsx` - Uses AmountInput for all amount fields, EditableName for all name fields. `setAmount(path, amount)` now receives raw number (no parseAmount call). Imports `renameRegularIncomeItem`, `renameExpenseCategory`.
   - `src/pages/InvestDetailPage.jsx` - Uses AmountInput for amount/deposit fields, EditableName for top category, sub-category, and item names. `setItemAmount`/`setItemDeposit` accept raw numbers. Imports `renameInvestTopCategory`, `renameInvestSubCategory`.
   - `src/pages/MainPage.jsx` - Uses AmountInput for debt amount inputs. `setDebtAmount` accepts raw number.
   - `.claude/CLAUDE.md` - Updated with full source structure, route table, data schema with example, formulas table, propagation rules table, implementation notes (useFileData, month init pattern, unit conversion, component APIs). Fixed `budget.md` → `budget-main.md`.
   - `.claude/history.md` - Created with initial entry for 2026-05-02 session.
   - `.claude/settings.json` - Target file for the Stop hook (may not exist yet).

4. Errors and fixes:
   - `addRegularIncomeItem` created new months with empty regularIncome instead of copying prior months' structure → fixed by calling `findPrevRegularIncome(d, year, m)` before `makeEmptyBudgetMonth`
   - `getOrInitMonth()` called `updateData` (setState) during render → React anti-pattern causing Strict Mode issues → fixed with `useEffect` for persistence and `useMemo` for display value
   - Vite interactive scaffolding CLI cancelled (no TTY) → created all files manually instead
   - Port 5173 already in use → dev server ran on 5174

5. Problem Solving:
   - V1→V2 migration: V1 had flat debt number, V1 had `householdLedger` separate from variable expenses, V1 had pension/housing subscription in `other` → mapped to new "연금" top category + "청약" sub-category under 예금/채권. Initial cash taken from `history[0].assets.cash` (2026-01-01 snapshot = 1,054,738원).
   - Unit conversion consistency: internal storage always in 원, display/input always in selected unit via formatAmount/parseAmount.
   - Rename scope: regular income renames propagate across all months of the year; categories rename globally across all years/months; items rename only in current month.

6. All user messages:
   - "Read the instructions and create a project. Let me know if there's anything unclear"
   - "Update the structure to the instructions file, and also any information that needs to be added on the instructions for your understanding of what you have done in the future."
   - "'/Users/jwk/Documents/자산 관리 앱' 여기에 v1버전이 있고, 해당 v1으로 만든 json파일이 '/Users/jwk/Downloads/26년 자산 (1).json'이다. 해당 정보를 여기 v2에 옮기고 싶은데, 세팅 가능할까?" (interrupted, then repeated)
   - "원/천/만 단위를 원/천원/만원으로 변경해라"
   - "세부내역의 입력한 금액은 천원단위로 콤마가 찍힐 수 있도록 수정해달라. 천원은 1,000으로 입력하면 보이도록 수정해줘"
   - "모든 카테고리나 항목의 이름을 변경할 수 있는 기능도 추가해라. 편집이 활성화 되어있을때만 변경할 수 있도록 해라"
   - "/hooks" (invoked hooks skill, dialog dismissed, then:) "create posthook, which records commands history to history.md and update instructions if any changes that needs to be memorized for the future work"

7. Pending Tasks:
   - Create Stop hook in `.claude/settings.json` that:
     1. Records the last user command with timestamp to `.claude/history.md`
     2. Records changes that need to be memorized (CLAUDE.md updates)

8. Current Work:
   The update-config skill was invoked to create a Stop posthook. The skill loaded and is now asking for a summary to proceed. The goal is to write a Python script and configure it as a `Stop` hook in `.claude/settings.json` (project-level) that:
   - Reads the conversation transcript via the `transcript_path` from stdin JSON
   - Extracts the last user message (the command)
   - Appends a timestamped entry to `/Users/jwk/Documents/asset-manager-v2/.claude/history.md`

9. Optional Next Step:
   Continue implementing the Stop hook as requested: "create posthook, which records commands history to history.md and update instructions if any changes that needs to be memorized for the future work"
   
   Steps needed:
   1. Check if `.claude/settings.json` exists and read it
   2. Write the Python hook script to `.claude/hooks/record_history.py`
   3. Pipe-test the script with `echo '{}' | python3 .claude/hooks/record_history.py`
   4. Add the Stop hook entry to `.claude/settings.json`
   5. Validate with `jq`

If you need specific details from before compaction (like exact code snippets, error messages, or content you generated), read the full transcript at: /Users/jwk/.claude/projects/-Users-jwk-Documents-asset-manager-v2/0ab54905-e333-4ffb-9be6-957906cfa458.jsonl
Continue the conversation from where it left off without asking the user any further questions. Resume directly — do not acknowledge the summary, do not recap what was happening, do not preface with "I'll continue" or similar. Pick up the last task as if the break never happened.
- **2026-05-02 18:24**: 어플리케이션의 오른쪽 상단에 도움말 아이콘을 두고, 누르면 도움말을 표시하고 싶다. 도움말은 help.md파일에 관리해두고 아이콘 클릭시 내용을 보여주면 된다. 그리고 도움말에는 지금 이 어플리케이션에서 할 수 있는 내용들을 적어라(편집 버튼의 기능 등등)
