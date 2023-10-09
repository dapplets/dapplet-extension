import { JsonValue, StorageRef } from '../types'
import Base from './base'

export type NotificationAction = {
  action: string
  title: string
  icon?: string
}

export type NotificationPayload = {
  title: string
  message?: string
  actions?: NotificationAction[]
  timeout?: number
  payload?: JsonValue
  icon?: StorageRef // ToDo: remove icon from Dapplet API
  teaser?: string
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
  icon?: StorageRef = null
  title: string = null
  message?: string = null
  actions?: NotificationAction[] = null
  expiresAt?: Date | number = null
  payload?: JsonValue = null
  teaser?: string = null
}
