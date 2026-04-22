import { C, DIVIDER } from '../constants'

const { widget } = figma
const { Rectangle } = widget

export function HDiv() {
  return <Rectangle width={DIVIDER} height="fill-parent" fill={C.border} />
}
