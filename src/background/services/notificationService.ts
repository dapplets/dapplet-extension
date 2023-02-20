import { browser } from 'webextension-polyfill-ts'
import * as EventBus from '../../common/global-event-bus'
import { generateGuid } from '../../common/helpers'
import {
  Notification,
  NotificationPayload,
  NotificationStatus,
  NotificationType,
} from '../../common/models/notification'
import NotificationBrowserStorage from '../browserStorages/notificationBrowserStorage'
// Add removing function
// NotificationBrowserStorage - implements Repository pattern (read/add/remove)

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

  async createAndShowNotification(notify: Notification, tabId?: number, icon?): Promise<void> {
    const notificationId = await this.createNotification(notify, icon ? icon : null)

    await this.showNotification(notificationId, tabId)
    await this._updateBadge()
  }

  async createNotification(notify: NotificationPayload | any, icon?): Promise<string> {
    const notification = new Notification()
    notification.id = generateGuid() // ToDo: autoincrement?
    notification.title = notify.title
    notification.message = notify.message
    notification.createdAt = new Date()
    notification.status = NotificationStatus.Highlighted
    notification.type = notify.type ? notify.type : NotificationType.Application
    notification.actions = notify.actions ? notify.actions : null
    notification.icon = notify.icon ? notify.icon : icon
    await this.notificationBrowserStorage.create(notification)
    EventBus.emit('notifications_updated')
    return notification.id
  }

  async showNotification(notificationId: string, tabId: number): Promise<void> {
    const notification = await this.notificationBrowserStorage.getById(notificationId)
    EventBus.emit('show_notification', notification)
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

  async markNotificationAsViewed(id: string | string[]): Promise<void> {
    const ids = Array.isArray(id) ? id : [id]

    await Promise.all(
      ids.map(async (id) => {
        const notification = await this.notificationBrowserStorage.getById(id)
        notification.status = 0
        await this.notificationBrowserStorage.update(notification)
      })
    )

    EventBus.emit('notifications_updated')
    await this._updateBadge()
  }

  async markAllNotificationsAsViewed(): Promise<void> {
    const notification = await this.notificationBrowserStorage.getAll(
      (x) => x.status === NotificationStatus.Highlighted
    )

    for (const i of notification) {
      i.status = NotificationStatus.Default
      await this.notificationBrowserStorage.update(i)
    }

    EventBus.emit('notifications_updated')
    await this._updateBadge()
  }

  // ToDo: optimize event counting without getting the whole array
  async getUnreadNotificationsCount(source?: string): Promise<number> {
    const unreadNotifications = await this.notificationBrowserStorage.getAll(
      (x) => x.status === NotificationStatus.Highlighted && x.type === NotificationType.Application
    )
    return unreadNotifications.length
  }

  async _updateBadge() {
    const count = await this.getUnreadNotificationsCount()
    browser.browserAction.setBadgeText({
      text: count === 0 ? '' : count.toString(),
    })
    browser.browserAction.setBadgeBackgroundColor({ color: '#f5f5f5' })
  }
}
