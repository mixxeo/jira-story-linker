export interface TsTicket {
  key: string
  url: string
}

export interface Row {
  id: number
  userStoryUrl: string
  userStoryTitle: string
  userStoryKey: string
  feTs: TsTicket | null
  beTs: TsTicket | null
  nativeTs: TsTicket | null
}

export interface JiraConfig {
  jiraBaseUrl: string
  jiraEmail: string
  jiraApiToken: string
  projectKey: string
  issueTypeName: string
  epicKey: string
  proxyUrl: string
}

export type TsType = 'FE' | 'BE' | 'Native'
