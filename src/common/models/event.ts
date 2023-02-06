import Base from '../../common/models/base'

export class Event extends Base {
  getId = () => this.id
  id: string = null
  title: string = null
  description: string = null
  created: Date = null
  isRead = false
}

export type NotificationAction = {
  action: string
  title: string
  icon: string
}

export type NotificationPayload = {
  title: string
  message?: string
  actions?: NotificationAction[]
  timeout?: number
  payload?: any
}
export enum NotificationType {
  Announcement,
  System,
  Application,
}

export enum NotificationStatus {
  Default,
  Highlighted,
  Resolved,
}

export class Notification extends Base {
  getId = () => this.id
  id: string = null
  source: string
  type: NotificationType
  group: string
  status?: NotificationStatus
  createdAt?: Date

  title: string
  message?: string
  actions?: NotificationAction[]
  expiresAt?: Date | null
}
