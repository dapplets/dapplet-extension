import browser from 'webextension-polyfill'
import { MutexQueue } from '../../common/decorators/mutex-queue'
import { generateGuid } from '../../common/generateGuid'
import * as EventBus from '../../common/global-event-bus'
import {
  Notification,
  NotificationPayload,
  NotificationStatus,
  NotificationType,
} from '../../common/models/notification'
import NotificationBrowserStorage from '../browserStorages/notificationBrowserStorage'

// ToDo: remove notifications_updated everywhere because it's too generic

const NotificationServiceKey = Symbol()

export class NotificationService {
  public notificationBrowserStorage = new NotificationBrowserStorage()

  async getNotifications(type: NotificationType): Promise<Notification[]> {
    const notification: Notification[] = await this.notificationBrowserStorage.getAll()
    const filteredNotification = notification
      .filter((x) => x.type === type)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    await this._updateBadge()
    return filteredNotification
  }

  async createAndShowNotification(
    notify: NotificationPayload & { type?: NotificationType; source?: string },
    tabId: number
  ): Promise<void> {
    const notificationId = await this.createNotification(notify)
    await this.showNotification(notificationId, tabId)
    await this._updateBadge()
  }

  async createNotification(
    notify: NotificationPayload & { type?: NotificationType; source?: string }
  ): Promise<string> {
    const notification = new Notification()
    notification.id = generateGuid() // ToDo: autoincrement?
    notification.source = notify.source ? notify.source : null
    notification.title = notify.title
    notification.message = notify.message
    notification.createdAt = new Date()
    notification.status = NotificationStatus.Highlighted
    notification.type = notify.type ? notify.type : NotificationType.Application
    notification.actions = notify.actions ? notify.actions : null
    notification.icon = notify.icon
    notification.payload = notify.payload ? notify.payload : null
    notification.teaser = notify.teaser ? notify.teaser : null
    await this.notificationBrowserStorage.create(notification)
    EventBus.emit('notifications_updated')
    return notification.id
  }

  async showNotification(notificationId: string, tabId: number): Promise<void> {
    const notification = await this.notificationBrowserStorage.getById(notificationId)
    browser.tabs.sendMessage(tabId, {
      type: 'SHOW_NOTIFICATION',
      payload: notification,
    })
  }

  async deleteNotification(id: string | string[]): Promise<void> {
    const ids = Array.isArray(id) ? id : [id]
    await Promise.all(ids.map((id) => this.notificationBrowserStorage.deleteById(id)))
    EventBus.emit('notifications_updated')
    await this._updateBadge()
  }

  async deleteAllNotifications(): Promise<void> {
    await this.notificationBrowserStorage.deleteAll()
    EventBus.emit('notifications_updated')
    await this._updateBadge()
  }

  @MutexQueue(NotificationServiceKey)
  async markNotificationAsViewed(id: string | string[]): Promise<void> {
    const ids = Array.isArray(id) ? id : [id]

    await Promise.all(
      ids.map(async (id) => {
        const notification = await this.notificationBrowserStorage.getById(id)
        if (notification.status !== NotificationStatus.Highlighted) return
        notification.status = NotificationStatus.Default
        await this.notificationBrowserStorage.update(notification)
      })
    )

    EventBus.emit('notifications_viewed', ids)
    EventBus.emit('notifications_updated')
    await this._updateBadge()
  }

  @MutexQueue(NotificationServiceKey)
  async markAllNotificationsAsViewed(): Promise<void> {
    const notifications = await this.notificationBrowserStorage.getAll(
      (x) => x.status === NotificationStatus.Highlighted
    )

    const viewedNotificationIds = []

    for (const notification of notifications) {
      notification.status = NotificationStatus.Default
      await this.notificationBrowserStorage.update(notification)
      viewedNotificationIds.push(notification.id)
    }

    EventBus.emit('notifications_viewed', viewedNotificationIds)
    EventBus.emit('notifications_updated')
    await this._updateBadge()
  }

  @MutexQueue(NotificationServiceKey)
  async resolveNotificationAction(
    notificationId: string,
    action: string,
    tabId: number
  ): Promise<void> {
    const notification = await this.notificationBrowserStorage.getById(notificationId)

    if (notification.status === NotificationStatus.Resolved) {
      throw new Error('Cannot resolve a notification twice')
    }

    notification.status = NotificationStatus.Resolved

    await this.notificationBrowserStorage.update(notification)
    await this._updateBadge()

    EventBus.emit('notifications_viewed', [notificationId])
    EventBus.emit('notifications_updated')

    browser.tabs.sendMessage(tabId, {
      type: 'MODULE_EVENT_STREAM_MESSAGE',
      payload: {
        namespace: notification.source,
        type: 'notification_action',
        action,
        payload: notification.payload,
      },
    })
  }

  // ToDo: optimize event counting without getting the whole array
  async getUnreadNotificationsCount(source?: string): Promise<number> {
    const unreadNotifications = await this.notificationBrowserStorage.getAll(
      (x) => x.status === NotificationStatus.Highlighted && x.type === NotificationType.Application
    )
    return unreadNotifications.length
  }

  private async _updateBadge() {
    const count = await this.getUnreadNotificationsCount()
    browser.action.setBadgeText({
      text: count === 0 ? '' : count.toString(),
    })
    browser.action.setBadgeBackgroundColor({ color: '#f5f5f5' })
  }
}
