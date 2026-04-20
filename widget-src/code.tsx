/// <reference path="../node_modules/@figma/plugin-typings/index.d.ts" />
/// <reference path="../node_modules/@figma/widget-typings/index.d.ts" />


const { widget } = figma
const {
  useSyncedState,
  usePropertyMenu,
  AutoLayout,
  Text,
  Input,
  Rectangle,
  waitForTask,
} = widget

// ─── Types ────────────────────────────────────────────────────────────────────

interface TsTicket {
  key: string
  url: string
}

interface Row {
  id: number
  userStoryUrl: string
  userStoryTitle: string
  userStoryKey: string
  feTs: TsTicket | null
  beTs: TsTicket | null
  nativeTs: TsTicket | null
}

interface JiraConfig {
  jiraBaseUrl: string
  jiraEmail: string
  jiraApiToken: string
  projectKey: string
  issueTypeName: string
  epicKey: string
  proxyUrl: string
}

type TsType = 'FE' | 'BE' | 'Native'

// ─── Design Tokens ────────────────────────────────────────────────────────────

const C = {
  border:      '#E1DFDB',
  headerBg:    '#F7F6F3',
  rowAlt:      '#FAFAF9',
  text:        '#37352F',
  muted:       '#9B9B9B',
  link:        '#2383E2',
  createBg:    '#EDFAF2',
  createText:  '#276749',
  createHover: '#C6F6D5',
  tsBg:        '#EBF8FF',
  tsText:      '#2C5282',
  tsHover:     '#BEE3F8',
  white:       '#FFFFFF',
  addRowHover: '#EEECEA',
}

// Column widths
const W = { idx: 50, us: 320, ts: 150 } as const
const DIVIDER = 1
const ROW_H    = 44
const HEADER_H = 36
// Total: 50 + 320 + 150*3 + 4 dividers = 824
const TOTAL_W  = W.idx + W.us + W.ts * 3 + DIVIDER * 4

const DEFAULT_CONFIG: JiraConfig = {
  jiraBaseUrl:   '',
  jiraEmail:     '',
  jiraApiToken:  '',
  projectKey:    'KP',
  issueTypeName: 'Story',
  epicKey:       '',
  proxyUrl:      'http://localhost:3456/jira',
}

// ─── Widget ───────────────────────────────────────────────────────────────────

function Widget() {
  const [rows,    setRows]    = useSyncedState<Row[]>('rows', [])
  const [config,  setConfig]  = useSyncedState<JiraConfig>('config', DEFAULT_CONFIG)
  const [nextId,  setNextId]  = useSyncedState<number>('nextId', 1)
  const [busyCell,setBusyCell]= useSyncedState<string>('busyCell', '')

  // ── Property Menu ────────────────────────────────────────────────────────

  usePropertyMenu(
    [
      { itemType: 'action', propertyName: 'settings', tooltip: '⚙️ Jira 설정' },
      { itemType: 'separator' },
      { itemType: 'action', propertyName: 'addRow',   tooltip: '+ 행 추가' },
    ],
    ({ propertyName }) => {
      if (propertyName === 'addRow') {
        addRow()
      } else if (propertyName === 'settings') {
        waitForTask(openSettings())
      }
    },
  )

  // ── Helpers ──────────────────────────────────────────────────────────────

  function addRow() {
    const id = nextId
    setRows([
      ...rows,
      { id, userStoryUrl: '', userStoryTitle: '', userStoryKey: '',
        feTs: null, beTs: null, nativeTs: null },
    ])
    setNextId(id + 1)
  }

  function openSettings(): Promise<void> {
    return new Promise((resolve) => {
      figma.showUI(__html__, {
        title: 'Jira 설정',
        width: 440,
        height: 530,
        visible: true,
      })
      figma.ui.postMessage({ type: 'init-settings', config })
      figma.ui.onmessage = (msg: any) => {
        if (msg.type === 'save-settings') {
          setConfig(msg.config)
          figma.closePlugin()
          resolve()
        } else if (msg.type === 'cancel') {
          figma.closePlugin()
          resolve()
        }
      }
    })
  }

  function fetchUserStory(rowId: number, url: string): Promise<void> {
    return new Promise((resolve) => {
      figma.showUI(__html__, { visible: false, width: 0, height: 0 })
      figma.ui.postMessage({ type: 'fetch-ticket', url, config })
      figma.ui.onmessage = (msg: any) => {
        if (msg.type === 'ticket-fetched') {
          setRows(rows.map(r =>
            r.id === rowId
              ? { ...r, userStoryTitle: msg.title, userStoryKey: msg.key }
              : r,
          ))
          setBusyCell('')
          figma.closePlugin()
          resolve()
        } else if (msg.type === 'error') {
          figma.notify(`❌ ${msg.message}`, { error: true })
          setBusyCell('')
          figma.closePlugin()
          resolve()
        }
      }
    })
  }

  function createTs(rowId: number, tsType: TsType): Promise<void> {
    const row = rows.find(r => r.id === rowId)
    if (!row) return Promise.resolve()

    return new Promise((resolve) => {
      setBusyCell(`${rowId}-${tsType}`)
      figma.showUI(__html__, { visible: false, width: 0, height: 0 })
      figma.ui.postMessage({
        type: 'create-ts',
        tsType,
        userStoryTitle: row.userStoryTitle,
        userStoryKey:   row.userStoryKey,
        config,
      })
      figma.ui.onmessage = (msg: any) => {
        if (msg.type === 'ts-created') {
          const field = tsType === 'FE' ? 'feTs' : tsType === 'BE' ? 'beTs' : 'nativeTs'
          setRows(rows.map(r =>
            r.id === rowId
              ? { ...r, [field]: { key: msg.key, url: msg.url } }
              : r,
          ))
          setBusyCell('')
          figma.notify(`✅ ${msg.key} 생성 완료`)
          figma.closePlugin()
          resolve()
        } else if (msg.type === 'error') {
          figma.notify(`❌ ${msg.message}`, { error: true })
          setBusyCell('')
          figma.closePlugin()
          resolve()
        }
      }
    })
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <AutoLayout
      direction="vertical"
      width={TOTAL_W}
      fill={C.white}
      stroke={C.border}
      strokeWidth={1}
      cornerRadius={8}
    >
      {/* ── Title Bar ── */}
      <AutoLayout
        direction="horizontal"
        width="fill-parent"
        height={48}
        fill={C.white}
        verticalAlignItems="center"
        padding={{ horizontal: 16 }}
        spacing={8}
      >
        <Text fontSize={14} fontWeight={700} fill={C.text}>
          🎯 Sprint Jira Linker
        </Text>
        {/* spacer */}
        <AutoLayout width="fill-parent" height={1} />
        <Text fontSize={11} fill={C.muted}>
          {config.projectKey || 'KP'} · {rows.length}개 스토리
        </Text>
      </AutoLayout>

      {/* ── Column Headers ── */}
      <AutoLayout direction="vertical" width="fill-parent">
        <Rectangle width="fill-parent" height={DIVIDER} fill={C.border} />
        <AutoLayout
          direction="horizontal"
          width="fill-parent"
          height={HEADER_H}
          fill={C.headerBg}
          verticalAlignItems="center"
        >
          <HeaderCell width={W.idx}>#</HeaderCell>
          <HDiv />
          <HeaderCell width={W.us}>유저 스토리</HeaderCell>
          <HDiv />
          <HeaderCell width={W.ts}>FE TS</HeaderCell>
          <HDiv />
          <HeaderCell width={W.ts}>BE TS</HeaderCell>
          <HDiv />
          <HeaderCell width={W.ts}>Native TS</HeaderCell>
        </AutoLayout>
      </AutoLayout>

      {/* ── Data Rows ── */}
      {rows.map((row, idx) => (
        <AutoLayout key={String(row.id)} direction="vertical" width="fill-parent">
          <Rectangle width="fill-parent" height={DIVIDER} fill={C.border} />
          <AutoLayout
            direction="horizontal"
            width="fill-parent"
            height={ROW_H}
            fill={idx % 2 === 1 ? C.rowAlt : C.white}
            verticalAlignItems="center"
          >
            {/* Index */}
            <AutoLayout
              width={W.idx}
              height="fill-parent"
              verticalAlignItems="center"
              horizontalAlignItems="center"
            >
              <Text fontSize={12} fill={C.muted}>{idx + 1}</Text>
            </AutoLayout>
            <HDiv />

            {/* User Story */}
            <AutoLayout
              width={W.us}
              height="fill-parent"
              verticalAlignItems="center"
              padding={{ horizontal: 12 }}
            >
              {row.userStoryTitle ? (
                <Text
                  fontSize={12}
                  fill={C.link}
                  textDecoration="underline"
                  width="fill-parent"
                  // overflow="ellipsis"
                  // maxLines={1}
                  onClick={() => figma.openExternal(row.userStoryUrl)}
                >
                  [{row.userStoryKey}] {row.userStoryTitle}
                </Text>
              ) : busyCell === `${row.id}-us` ? (
                <Text fontSize={12} fill={C.muted}>불러오는 중...</Text>
              ) : (
                <Input
                  value={row.userStoryUrl}
                  placeholder="Jira User Story URL 붙여넣기..."
                  fontSize={12}
                  fill={C.text}
                  width="fill-parent"
                  onTextEditEnd={(e) => {
                    const url = e.characters.trim()
                    if (!url) return
                    // URL을 state에 먼저 저장
                    setRows(rows.map(r =>
                      r.id === row.id ? { ...r, userStoryUrl: url } : r,
                    ))
                    setBusyCell(`${row.id}-us`)
                    waitForTask(fetchUserStory(row.id, url))
                  }}
                />
              )}
            </AutoLayout>
            <HDiv />

            {/* FE TS */}
            <TsCell
              width={W.ts}
              ticket={row.feTs}
              hasUs={!!row.userStoryTitle}
              isBusy={busyCell === `${row.id}-FE`}
              onCreate={() => waitForTask(createTs(row.id, 'FE'))}
            />
            <HDiv />

            {/* BE TS */}
            <TsCell
              width={W.ts}
              ticket={row.beTs}
              hasUs={!!row.userStoryTitle}
              isBusy={busyCell === `${row.id}-BE`}
              onCreate={() => waitForTask(createTs(row.id, 'BE'))}
            />
            <HDiv />

            {/* Native TS */}
            <TsCell
              width={W.ts}
              ticket={row.nativeTs}
              hasUs={!!row.userStoryTitle}
              isBusy={busyCell === `${row.id}-Native`}
              onCreate={() => waitForTask(createTs(row.id, 'Native'))}
            />
          </AutoLayout>
        </AutoLayout>
      ))}

      {/* ── Add Row ── */}
      <Rectangle width="fill-parent" height={DIVIDER} fill={C.border} />
      <AutoLayout
        width="fill-parent"
        height={36}
        verticalAlignItems="center"
        horizontalAlignItems="center"
        fill={C.headerBg}
        hoverStyle={{ fill: C.addRowHover }}
        onClick={addRow}
      >
        <Text fontSize={12} fill={C.muted}>+ 행 추가</Text>
      </AutoLayout>
    </AutoLayout>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function HeaderCell({ children, width }: { children: string; width: number }) {
  return (
    <AutoLayout
      width={width}
      height="fill-parent"
      verticalAlignItems="center"
      padding={{ horizontal: 12 }}
    >
      <Text fontSize={11} fontWeight={600} fill={C.muted} letterSpacing={0.3}>
        {children}
      </Text>
    </AutoLayout>
  )
}

function HDiv() {
  return <Rectangle width={DIVIDER} height="fill-parent" fill={C.border} />
}

function TsCell({
  width,
  ticket,
  hasUs,
  isBusy,
  onCreate,
}: {
  width: number
  ticket: TsTicket | null
  hasUs: boolean
  isBusy: boolean
  onCreate: () => void
}) {
  return (
    <AutoLayout
      width={width}
      height="fill-parent"
      verticalAlignItems="center"
      horizontalAlignItems="center"
      padding={{ horizontal: 8 }}
    >
      {ticket ? (
        // 티켓 ID 버튼 → Jira 링크 오픈
        <AutoLayout
          padding={{ horizontal: 10, vertical: 4 }}
          fill={C.tsBg}
          cornerRadius={4}
          hoverStyle={{ fill: C.tsHover }}
          onClick={() => figma.openExternal(ticket.url)}
        >
          <Text fontSize={11} fontWeight={600} fill={C.tsText}>
            {ticket.key}
          </Text>
        </AutoLayout>
      ) : isBusy ? (
        <Text fontSize={11} fill={C.muted}>생성 중...</Text>
      ) : hasUs ? (
        // [생성] 버튼
        <AutoLayout
          padding={{ horizontal: 10, vertical: 4 }}
          fill={C.createBg}
          cornerRadius={4}
          hoverStyle={{ fill: C.createHover }}
          onClick={onCreate}
        >
          <Text fontSize={11} fontWeight={500} fill={C.createText}>생성</Text>
        </AutoLayout>
      ) : (
        <Text fontSize={12} fill={C.border}>—</Text>
      )}
    </AutoLayout>
  )
}

// ─── Register ─────────────────────────────────────────────────────────────────

widget.register(Widget)
