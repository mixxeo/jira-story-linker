import type { JiraConfig } from './types'

export const C = {
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
} as const

export const W = { idx: 50, us: 320, ts: 150 } as const
export const DIVIDER = 1
export const ROW_H    = 44
export const HEADER_H = 36
// Total: 50 + 320 + 150*3 + 4 dividers = 824
export const TOTAL_W  = W.idx + W.us + W.ts * 3 + DIVIDER * 4

export const DEFAULT_CONFIG: JiraConfig = {
  jiraBaseUrl:   '',
  jiraEmail:     '',
  jiraApiToken:  '',
  projectKey:    'KP',
  issueTypeName: 'Story',
  epicKey:       '',
  proxyUrl:      'http://localhost:3456/jira',
}
