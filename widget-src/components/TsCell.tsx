import type { TsTicket } from '../types'
import { C } from '../constants'

const { widget } = figma
const { AutoLayout, Text } = widget

interface TsCellProps {
  width: number
  ticket: TsTicket | null
  hasUs: boolean
  isBusy: boolean
  onCreate: () => void
}

export function TsCell({ width, ticket, hasUs, isBusy, onCreate }: TsCellProps) {
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
