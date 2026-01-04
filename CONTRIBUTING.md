# Contributing Guide

이 문서는 Daily News Digest 프로젝트 협업을 위한 기본 규칙을 정리합니다.

---

## 1. 브랜치 전략

- `main`: 안정 버전(릴리즈/배포 기준)
- `dev`: 기능 통합 브랜치(기본 작업 대상)
- 기능 개발 브랜치:
  - `feat/<short-name>` 예: `feat/subscription-form`
  - `fix/<short-name>` 예: `fix/rss-timeout`
  - `chore/<short-name>` 예: `chore/update-readme`

### 기본 흐름
1) `dev`에서 작업 브랜치 생성  
2) 작업 후 PR → `dev`로 머지  
3) 릴리즈 시점에 `dev` → `main` 머지

---

## 2. 이슈(작업 단위) 운영 방식

- 가능한 모든 작업은 Issue로 쪼갭니다.
- Issue에는 아래를 포함합니다:
  - 목적(왜 하는지)
  - Done 기준(어디까지 되면 끝인지)
  - 참고 링크/스크린샷(있으면)

---

## 3. 커밋 규칙 (Conventional Commits)

형식:
`<type>(optional scope): <message>`

예시:
- `feat(api): add subscription create endpoint`
- `fix(rss): handle invalid xml gracefully`
- `docs: update README`
- `chore: add editorconfig`

권장 type:
- `feat` 기능 추가
- `fix` 버그 수정
- `docs` 문서 변경
- `refactor` 리팩토링(기능 변화 없음)
- `test` 테스트 추가/수정
- `chore` 설정/빌드/잡무

---

## 4. PR 규칙

- 작은 변경이라도 PR로 올립니다.
- PR 제목은 커밋 규칙을 따라도 좋고(권장), 최소한 의도가 드러나야 합니다.
- PR 본문에 아래를 포함합니다:
  - 무엇을 변경했는지
  - 왜 변경했는지
  - 테스트 방법(또는 테스트 불가 사유)
- 머지 전 체크:
  - 로컬에서 최소 1회 실행 확인
  - 린트/테스트가 있다면 통과 확인

---

## 5. 코드 스타일 / 포맷

- EditorConfig를 사용합니다. (루트의 `.editorconfig`)
- 프론트/백 각각 formatter/linter는 스택 확정 후 정합니다.
  - 예: Prettier + ESLint

---

## 6. 보안 및 운영 관련 주의사항

- API 키, 이메일 발송 키 등 민감 정보는 절대 커밋하지 않습니다.
- `.env`는 커밋 금지, `.env.example`로 공유합니다.
- 뉴스 본문 전문을 저장/재배포하지 않습니다(제목/요약/링크 중심).

---

## 7. 리뷰 기준(가볍게라도)

리뷰할 때 아래를 봅니다:
- 기능 요구사항 충족 여부
- 예외 처리(에러/빈 데이터)
- 로그/관측(최소한의 디버깅 가능성)
- 변경 범위가 적절한지(너무 큰 PR은 쪼개기)
