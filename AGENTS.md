# AGENTS.md

## 1. 프로젝트 개요 및 스택
- **목적**: 오프라인 우선 차량 관리 PWA (다중 차량, 정비 타임라인, 검사/보험 관리, 통합 D-day, 사진 첨부, JSON 백업)
- **기술 스택**: React, Vite, TypeScript, IndexedDB (Dexie.js), PWA (Service Worker / Manifest)
- **UI/포맷 기준**: 모바일 우선 반응형, 한국어 UI, 날짜 `YYYY.MM.DD`, 금액 원화(`₩`, 천 단위 콤마)

## 2. 폴더 구조
```text
src/
├── app/                   # 앱 엔트리, 라우터, 전역 Context (ActiveVehicle, Repository 주입)
├── domain/                # 순수 TypeScript 모델(models/) 및 도메인 로직(services/)
├── repositories/          # 데이터 접근 계층
│   ├── interfaces/        # Repository 인터페이스 (UI/도메인이 참조하는 계약)
│   └── dexie/             # Dexie.js 구현체 및 DB 스키마 (외부 노출 금지)
├── features/              # 도메인별 기능 컴포넌트 및 커스텀 훅 (dashboard, maintenance, compliance, backup, vehicle)
├── shared/                # 공통 UI 컴포넌트(components/) 및 유틸리티(utils/)
└── pages/                 # 라우트 단위 페이지 컴포넌트
```

## 3. 네이밍 규칙
- **컴포넌트 / 타입 / 인터페이스**: `PascalCase` (예: `VehicleSwitcher.tsx`, `MaintenanceLog`, `IMaintenanceRepository`)
- **함수 / 변수 / 훅**: `camelCase` (훅은 `use` 접두사, 예: `useActiveVehicle.ts`, `formatCurrency`)
- **상수**: `UPPER_SNAKE_CASE` (예: `MAX_ATTACHMENTS_PER_ITEM = 3`)
- **폴더명**: `kebab-case` 또는 단일 소문자 단어

## 4. 핵심 아키텍처 및 도메인 규칙
1. **저장소 계층(Repository)을 통해서만 데이터 접근**:
   - `pages/`, `features/`, `shared/`, `domain/`에서는 절대 `dexie`나 DB 인스턴스를 직접 import하거나 호출하지 않는다.
   - 모든 데이터 조회·저장·삭제는 `repositories/interfaces/`에 정의된 인터페이스를 통해서만 수행한다.
2. **도메인 제약 사항 준수**:
   - 모든 주요 데이터(`maintenanceLogs`, `inspections`, `insurances`)는 `vehicleId`를 기준으로 격리 조회하며, 차량 삭제 시 연관 데이터와 첨부파일을 함께 삭제한다.
   - 항목당 첨부 사진(`attachments`)은 **최대 3장**으로 제한하며, 저장 전 클라이언트에서 압축 처리한다.
   - 홈 화면 D-day는 선택된 차량의 **자동차 검사일, 보험 만기일, 미완료 정비 예정일**을 통합하여 임박순으로 표시한다.

## 5. 에이전트 작업 규칙 (필수 준수)
- **기능 하나 구현 후 반드시 빌드와 테스트 실행**: 단위 기능 구현이나 수정이 끝날 때마다 타입 체크, 빌드(`npm run build`), 테스트를 실행하여 오류가 없는지 검증한 뒤 다음 단계로 넘어간다.
- **요청 범위 밖의 파일은 수정하지 않기**: 사용자가 요청한 작업과 직접 관련 없는 파일의 리팩터링, 포맷팅 변경, 임의의 기능 추가를 금지한다.
- **푸시 알림 제외**: 서버 및 푸시 알림 기능은 구현하지 않으며, iOS 데이터 유실 방지는 Standalone 설치 안내, `navigator.storage.persist()`, JSON 파일 공유/백업으로 대응한다.
