import Base from './base'

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
  icon?: string
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
  source?: string = null
  type?: NotificationType = null
  group?: string = null
  status?: NotificationStatus = 1
  createdAt?: Date | number = null
  icon?: string = null
  title: string = null
  message?: string = null
  actions?: NotificationAction[] = null
  expiresAt?: Date | number = null
}
