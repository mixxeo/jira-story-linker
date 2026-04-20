# 🎯 Sprint Jira Linker — Figma Widget

스프린트 시작 시 Figma 기획서와 Jira 티켓을 연동하는 위젯입니다.  
PM이 User Story 링크를 입력하면 FE / BE / Native 개발자별 Technical Story를 원클릭으로 생성합니다.

---

## 기능

| 기능 | 설명 |
|---|---|
| 유저 스토리 등록 | Jira URL 붙여넣기 → 티켓 타이틀 자동 조회 |
| TS 생성 | [생성] 버튼으로 `[FE/BE/Native] {타이틀}` 형식의 Technical Story 자동 생성 |
| Related task 연결 | 생성된 TS에 User Story가 자동 링크됨 |
| Epic 연결 | 설정한 Epic Key로 TS의 상위 Epic 자동 연결 |
| 링크 이동 | 티켓 ID 클릭 시 해당 Jira 페이지로 이동 |

---

## 설치 및 실행

### 1. 위젯 빌드

```bash
# 프로젝트 루트에서
npm install
npm run build        # 한 번만 빌드
# 또는
npm run watch        # 개발 중 파일 변경 감지
```

### 2. 프록시 서버 실행 (필수)

Jira REST API는 브라우저에서 직접 호출 시 **CORS 오류**가 발생합니다.  
팀원 각자의 로컬 환경 또는 내부 서버에서 프록시를 실행해야 합니다.

```bash
cd proxy
npm install
npm start
# → http://localhost:3456 에서 실행
```

> **팁**: 팀 공용 내부 서버(예: 개발 서버)에 올려두면 개인 실행 없이 공유 가능합니다.  
> `PORT=8080 npm start` 로 포트 변경 가능.

### 3. Figma에 위젯 등록

1. Figma 앱 → `Resources` → `Plugins & Widgets` → `Development` → `Import plugin from manifest...`
2. 이 프로젝트의 `manifest.json` 선택
3. 캔버스에서 위젯 추가

---

## 첫 설정

위젯 우클릭 → 상단 메뉴의 **⚙️ Jira 설정** 클릭

| 항목 | 설명 |
|---|---|
| Jira Base URL | `https://yourcompany.atlassian.net` |
| 이메일 | Atlassian 계정 이메일 |
| API Token | [Atlassian API Token 발급](https://id.atlassian.com/manage-profile/security/api-tokens) |
| 프로젝트 키 | `KP` (티켓 번호 prefix) |
| 이슈 타입 | TS로 생성할 타입명 (기본: `Story`) |
| Epic 키 | TS 상위 Epic (선택, 예: `KP-10`) |
| 프록시 URL | `http://localhost:3456/jira` (프록시 실행 후 입력) |

---

## 사용 방법

1. 위젯 메뉴에서 **+ 행 추가** 클릭
2. 유저 스토리 셀에 **Jira User Story URL** 붙여넣기 → Enter
   - 자동으로 티켓 타이틀 조회
3. **FE / BE / Native** 열에서 **[생성]** 클릭
   - `[FE] {유저 스토리 타이틀}` 형식으로 TS 자동 생성
   - User Story와 Related task 링크 자동 연결
   - 버튼이 **`KP-123`** 형태의 티켓 ID로 변경됨
4. 티켓 ID 클릭 → 해당 Jira 페이지로 바로 이동

---

## 프로젝트 구조

```
sprint-jira-linker/
├── manifest.json          # Figma 위젯 메타
├── package.json
├── tsconfig.json
├── webpack.config.js
├── widget-src/
│   ├── code.tsx           # 위젯 메인 코드
│   └── code.js            # (빌드 결과물)
├── ui.html                # 설정 UI + Jira API 호출 iframe
└── proxy/
    ├── package.json
    └── server.js          # CORS 우회용 로컬 프록시
```

---

## 트러블슈팅

| 증상 | 원인 | 해결 |
|---|---|---|
| 티켓 조회 실패 | 프록시 미실행 | `cd proxy && npm start` |
| `401 Unauthorized` | API Token 오류 | 설정에서 Token 재입력 |
| `404 Not Found` | 이슈 키 오류 or 권한 없음 | URL 확인, Jira 접근 권한 확인 |
| TS 생성 후 링크 실패 | Jira 링크 타입명 불일치 | Jira 설정에서 링크 타입명 확인 (`Relates`) |
| Epic 연결 실패 | next-gen/classic 프로젝트 타입 | Epic Key 비우고 수동 연결 |
