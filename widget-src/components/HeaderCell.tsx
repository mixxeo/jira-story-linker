import { C } from '../constants'

const { widget } = figma
const { AutoLayout, Text } = widget

export function HeaderCell({ children, width }: { children: string; width: number }) {
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
