/**
 * Sprint Jira Linker – 로컬 CORS 프록시
 *
 * Figma 위젯 iframe에서 Jira REST API를 직접 호출하면 CORS 오류가 발생합니다.
 * 이 서버는 위젯의 요청을 받아 서버 사이드에서 Jira API를 호출하고 결과를 반환합니다.
 *
 * 실행 방법:
 *   cd proxy && npm install && npm start
 *
 * 기본 포트: 3456  (설정에서 변경 가능)
 */

const express  = require('express')
const cors     = require('cors')
const fetch    = require('node-fetch')

const app  = express()
const PORT = process.env.PORT || 3456

app.use(cors())              // Figma iframe origin 허용
app.use(express.json())

/**
 * POST /jira
 * Body:
 *   targetUrl  string   Jira REST API endpoint 전체 URL
 *   method     string   HTTP method (GET | POST | PUT | DELETE)
 *   body       object   요청 body (GET이면 null)
 *   email      string   Atlassian 계정 이메일
 *   token      string   Atlassian API Token
 */
app.post('/jira', async (req, res) => {
  const { targetUrl, method = 'GET', body, email, token } = req.body

  if (!targetUrl || !email || !token) {
    return res.status(400).json({ error: 'targetUrl, email, token은 필수입니다.' })
  }

  // Atlassian 도메인만 허용 (보안)
  try {
    const parsedUrl = new URL(targetUrl)
    if (!parsedUrl.hostname.endsWith('.atlassian.net')) {
      return res.status(403).json({ error: '허용되지 않은 도메인입니다. *.atlassian.net 만 허용됩니다.' })
    }
  } catch {
    return res.status(400).json({ error: '올바르지 않은 URL입니다.' })
  }

  const credential = Buffer.from(`${email}:${token}`).toString('base64')

  try {
    const opts = {
      method,
      headers: {
        'Authorization': `Basic ${credential}`,
        'Content-Type':  'application/json',
        'Accept':        'application/json',
      },
    }
    if (body && method !== 'GET') {
      opts.body = JSON.stringify(body)
    }

    const jiraResp = await fetch(targetUrl, opts)
    const text     = await jiraResp.text()

    // Jira가 빈 응답을 반환하는 경우(204 No Content 등) 처리
    let data
    try { data = JSON.parse(text) } catch { data = { _raw: text } }

    res.status(jiraResp.status).json(data)
  } catch (err) {
    console.error('[Proxy Error]', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.get('/health', (_req, res) => res.json({ status: 'ok', port: PORT }))

app.listen(PORT, () => {
  console.log(`✅ Sprint Jira Linker 프록시 실행 중: http://localhost:${PORT}`)
  console.log(`   POST http://localhost:${PORT}/jira  ← 위젯 설정에서 이 URL을 입력하세요.`)
})
