# Schedule Manager

Docker 기반으로 실행되는 인증 필수 일정관리 웹 애플리케이션입니다.

- `frontend`: React + TypeScript + MUI + FullCalendar
- `backend`: Node.js(Express) + TypeScript + Prisma + JWT
- `database`: PostgreSQL
- `infra`: Docker Compose + Nginx(프론트 서빙 및 API 프록시)

## Release Notes

### 2026-02-15

- `ADMIN/USER` 권한 분리 및 관리자 대시보드(`/admin`) 추가
- 서버 시작 시 기본 관리자 계정 자동 보장 로직 추가
- 관리자 통합 API 추가(`/api/admin/*`)
- 게시판 기능 추가
  - 공지사항(`NOTICE`): 관리자만 작성/수정/삭제
  - 자유게시판(`FREE`): 전체 사용자 작성 가능, 작성자 또는 관리자 수정/삭제 가능
  - 에디터: `React Quill`(무료, 오픈소스, 상용 서비스에서도 널리 사용)
  - 게시글 상세 페이지(`/board/:id`) 및 본문 이미지 업로드(무료, 로컬 스토리지) 지원
- 상단 네비게이션 강화: `게시판`, `관리자 대시보드` 바로가기 버튼 노출
- 보안 강화:
  - 인증/관리자 엔드포인트 레이트 리미트 추가
  - CORS Origin 환경변수 분리(`CORS_ORIGIN`)
  - 전역 예외 처리 미들웨어 추가
  - 마지막 관리자 권한/계정 보호 로직 추가
- 운영 점검용 자동 스모크 테스트 스크립트 추가: `scripts/smoke-test.sh`

## 1. 주요 기능

- 회원가입 / 로그인 / 사용자 정보 조회
- JWT 인증 기반 보호 라우트
- 로그인 사용자별 일정 CRUD
- 권한 기반 접근 제어(USER / ADMIN)
- 관리자 대시보드(사용자/전체 일정 통합 관리)
- 게시판(공지사항/자유게시판) + 리치 텍스트 에디터
- 게시글 상세 페이지 및 이미지 업로드
- 주간/월간/일간 캘린더 뷰
- Docker 컨테이너로 환경 의존성 최소화

## 2. 프로젝트 구조

```text
schedule-manager
├─ docker-compose.yml
├─ .env.example
├─ README.md
├─ backend
│  ├─ Dockerfile
│  ├─ package.json
│  ├─ prisma
│  │  └─ schema.prisma
│  └─ src
│     ├─ config/env.ts
│     ├─ middleware/auth.ts
│     ├─ modules/auth/auth.routes.ts
│     ├─ modules/board/board.routes.ts
│     ├─ modules/schedules/schedules.routes.ts
│     └─ server.ts
└─ frontend
   ├─ Dockerfile
   ├─ nginx/default.conf
   ├─ package.json
   └─ src
      ├─ contexts/AuthContext.tsx
      ├─ components/ProtectedRoute.tsx
      ├─ components/ScheduleDialog.tsx
      ├─ pages/LoginPage.tsx
      ├─ pages/RegisterPage.tsx
      ├─ pages/DashboardPage.tsx
      ├─ pages/BoardPage.tsx
      └─ pages/AdminDashboardPage.tsx
```

## 3. 빠른 시작 (Docker 권장)

### 3-1. 사전 요구사항

- Docker Desktop (또는 Docker Engine + Compose plugin)

### 3-2. 실행

```bash
cd schedule-manager
cp .env.example .env
docker compose up --build -d
```

실행 후 접속 주소:

- 프론트엔드: `http://localhost:3000`
- 백엔드 헬스체크: `http://localhost:4000/health`
- DB: `localhost:5432` (`postgres/postgres`)
- 기본 관리자 로그인(초기값):
  - 이메일: `admin@example.com`
  - 비밀번호: `admin12345`

### 3-3. 종료

```bash
docker compose down
```

데이터까지 삭제:

```bash
docker compose down -v
```

## 4. 로컬 개발 모드 (선택)

Docker 없이도 각각 실행할 수 있습니다.

### 4-1. 백엔드

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:push
npm run dev
```

### 4-2. 프론트엔드

```bash
cd frontend
npm install
npm run dev
```

개발 모드 기본 포트:

- 프론트엔드: `5173`
- 백엔드: `4000`

## 5. 인증 및 보안 모델

- 로그인 성공 시 `accessToken`(JWT) 발급
- 토큰은 프론트 로컬 스토리지에 저장
- API 요청 시 `Authorization: Bearer <token>` 헤더 자동 추가
- `/api/schedules/*` 는 인증 미들웨어(`requireAuth`) 통과 필수
- `/api/admin/*` 는 인증 + `ADMIN` 권한 필수
- 사용자 ID 기준으로 본인 일정만 조회/수정/삭제 가능

### 5-1. 권한(Role)

- `USER`: 본인 일정만 관리
- `ADMIN`: 전체 사용자/전체 일정 관리 가능

### 5-2. 기본 관리자 계정

서버 시작 시 `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` 값으로 관리자 계정을 보장합니다.

- 기본값
  - `ADMIN_EMAIL=admin@example.com`
  - `ADMIN_PASSWORD=admin12345`
  - `ADMIN_NAME=System Admin`

보안상 운영 환경에서는 반드시 강한 비밀번호로 변경하세요.

## 6. API 명세

Base URL: `/api`

### 6-1. Auth

- `POST /auth/register`
  - body: `{ "email": "...", "name": "...", "password": "..." }`
- `POST /auth/login`
  - body: `{ "email": "...", "password": "..." }`
  - response: `{ "accessToken": "...", "user": {...} }`
- `GET /auth/me`
  - header: `Authorization: Bearer <token>`

### 6-2. Schedules (인증 필요)

- `GET /schedules`
- `POST /schedules`
  - body: `{ "title", "description?", "startAt", "endAt", "isAllDay" }`
- `PATCH /schedules/:id`
- `DELETE /schedules/:id`

### 6-3. Admin (ADMIN 권한 필요)

- `GET /admin/overview`
- `GET /admin/users`
- `PATCH /admin/users/:id` (권한/이름 변경)
- `DELETE /admin/users/:id`
- `GET /admin/schedules`
- `DELETE /admin/schedules/:id`
- `GET /admin/posts`
- `DELETE /admin/posts/:id`

### 6-4. Board (인증 필요)

- `GET /board/posts?type=NOTICE|FREE`
- `GET /board/posts/:id`
- `POST /board/posts`
- `PATCH /board/posts/:id`
- `DELETE /board/posts/:id`
- `POST /board/uploads` (이미지 업로드, 5MB 제한)

권한 규칙:

- `NOTICE`: ADMIN만 작성/수정/삭제
- `FREE`: 모든 사용자 작성 가능, 작성자 또는 ADMIN이 수정/삭제 가능

이미지 업로드 정책:

- 비용: 없음(로컬 파일 스토리지 사용)
- 저장 위치: 백엔드 컨테이너 `/app/uploads` (Docker volume `board_uploads`)
- 접근 경로: `/uploads/<filename>`

시간 필드는 ISO 문자열(예: `2026-02-13T09:00:00.000Z`)을 사용합니다.

## 7. DB 스키마

Prisma 모델 요약:

- `User`
  - `id`, `email(unique)`, `name`, `role(USER|ADMIN)`, `passwordHash`, `createdAt`, `updatedAt`
- `Schedule`
  - `id`, `title`, `description`, `startAt`, `endAt`, `isAllDay`, `userId(FK)`

관계:

- `User` 1 : N `Schedule`

## 8. 운영 관점 체크리스트

- `JWT_SECRET`을 운영 환경에서 강력한 값으로 변경
- CORS 정책을 운영 도메인 기준으로 제한
- HTTPS 종단 및 리버스 프록시 설정
- DB 백업 정책(스냅샷/덤프) 수립
- 컨테이너 보안 스캔 및 이미지 고정 버전 관리
- 민감정보는 `.env` 또는 시크릿 매니저로만 관리하고 Git 커밋 금지

## 9. 테스트

### 9-1. 자동 스모크 테스트 (권장)

컨테이너 실행 후 아래 명령으로 핵심 시나리오를 점검합니다.

```bash
bash scripts/smoke-test.sh
```

검증 항목:

- 비인증 접근 차단
- 회원가입/로그인
- USER의 admin API 접근 차단(403)
- ADMIN 권한 승격/조회/삭제
- 마지막 관리자 보호 정책
- 일정 생성/관리자 전체조회/삭제
- 게시판 권한 시나리오(공지 작성 제한/자유게시판 작성/관리자 삭제)

### 9-2. 수동 점검 체크리스트

- `http://localhost:3000/login` 에서 일반 사용자 로그인
- `http://localhost:3000/admin` 접근 시 ADMIN만 진입 가능한지 확인
- 일반 사용자 토큰으로 `/api/admin/overview` 호출 시 403 확인
- ADMIN 계정으로 사용자 권한 변경/삭제 동작 확인

## 10. 문제 해결

- 포트 충돌 시: `docker compose down` 후 점유 포트 확인
- DB 초기화가 필요하면: `docker compose down -v` 후 재기동
- 백엔드 로그 확인:

```bash
docker compose logs -f backend
```

- 프론트엔드 로그 확인:

```bash
docker compose logs -f frontend
```

## 11. 화면 접근 경로

- 로그인/회원가입: `http://localhost:3000/login`, `http://localhost:3000/register`
- 일반 사용자 대시보드: `http://localhost:3000/`
- 게시판: `http://localhost:3000/board`
- 게시글 상세: `http://localhost:3000/board/:id`
- 관리자 대시보드: `http://localhost:3000/admin` (ADMIN만 접근)

## 12. GitHub 저장소 생성/업로드 가이드

현재 로컬 코드 기준으로 아래 순서로 업로드할 수 있습니다.

```bash
cd schedule-manager
git init
git add .
git commit -m "feat: bootstrap production-ready schedule manager"
```

이후 GitHub에서 빈 저장소를 만든 뒤:

```bash
git branch -M main
git remote add origin <YOUR_REPO_URL>
git push -u origin main
```

예: `https://github.com/<username>/schedule-manager.git`

## 13. 향후 확장 아이디어

- 팀/조직 단위 권한(Owner/Admin/Member)
- 반복 일정(RRULE)
- 알림(이메일/슬랙/푸시)
- 첨부파일 및 코멘트
- 감사 로그(Audit Log)
