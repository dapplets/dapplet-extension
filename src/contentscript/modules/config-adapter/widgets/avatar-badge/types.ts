export interface IAvatarBadgeState {
  img?: string | null
  video?: string
  mediaType?: string
  basic?: boolean
  horizontal: 'left' | 'right'
  vertical: 'top' | 'bottom'
  tooltip?: string | string[]
  accounts?: IConnectedAccountUser[]
  showAccounts?: boolean
  hidden?: boolean
  theme?: 'DARK' | 'LIGHT'
  exec?: (ctx: any, me: IAvatarBadgeState) => void
  init?: (tx: any, me: IAvatarBadgeState) => void
  ctx: any
  username: string
  insPointName: string
}

export interface IConnectedAccountUser {
  img: string
  name: string
  origin: string
  accountActive: boolean
}
