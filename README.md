# 자산 관리 v2

개인 자산을 관리하는 웹 애플리케이션입니다. 가계부와 투자 내역을 월별로 기록하고 현금 흐름 및 순 자산을 추적합니다.

## 주요 기능

- **가계부**: 정기/비정기 수입, 카테고리별 지출 관리
- **투자**: 주식, 예금/채권, 부동산 등 자산 유형별 투자 현황 관리
- **자산 요약**: 총 자산, 총 부채, 순 자산 실시간 계산
- **차트**: 월별 수입/지출/현금 추이 그래프 및 투자 비중 파이차트
- **로컬 저장**: 데이터는 사용자 기기의 JSON 파일에 직접 저장 (서버 없음)

## 기술 스택

| 구분 | 기술 |
|---|---|
| 프레임워크 | React 18 + Vite |
| 라우팅 | React Router DOM v6 |
| 차트 | Recharts |
| 데이터 저장 | File System Access API + IndexedDB |
| 스타일 | CSS (CSS Variables) |

## 데이터 저장 방식

서버나 클라우드 없이 브라우저의 **File System Access API**를 통해 로컬 JSON 파일에 저장합니다. 파일 핸들은 IndexedDB에 유지되어 새로고침 후에도 재선택 없이 동일 파일을 사용합니다.

> File System Access API는 **Chrome / Edge** 기반 브라우저에서만 지원됩니다.

## 로컬 실행

```bash
npm install
npm run dev
```

## 빌드

```bash
npm run build
```

## 배포

`main` 브랜치에 push하면 GitHub Actions가 자동으로 빌드하여 GitHub Pages에 배포합니다.

배포 URL: https://tank3a.github.io/portfolio-app-v2/
