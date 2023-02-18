import { browser } from 'webextension-polyfill-ts'
import * as EventBus from '../../common/global-event-bus'
import { generateGuid } from '../../common/helpers'
import {
  Notification,
  NotificationStatus,
  NotificationType,
} from '../../common/models/notification'
import NotificationBrowserStorage from '../browserStorages/notificationBrowserStorage'
// Add removing function
// NotificationBrowserStorage - implements Repository pattern (read/add/remove)

export class NotificationService {
  async getNotifications(type: NotificationType): Promise<Notification[]> {
    const notificationBrowserStorage = new NotificationBrowserStorage()
    const notification: Notification[] = await notificationBrowserStorage.getAll()
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

  async createNotification(notify: Notification, icon?): Promise<string> {
    const notificationBrowserStorage = new NotificationBrowserStorage()

    const notification = new Notification()
    notification.id = generateGuid() // ToDo: autoincrement?
    notification.title = notify.title
    notification.message = notify.message
    notification.createdAt = new Date()
    notification.status = NotificationStatus.Highlighted
    notification.type = notify.type ? notify.type : NotificationType.Application
    notification.actions = notify.actions ? notify.actions : null
    notification.icon = notify.icon ? notify.icon : icon
    await notificationBrowserStorage.create(notification)
    EventBus.emit('notifications_updated')
    return notification.id
  }

  async showNotification(notificationId: string, tabId: number): Promise<void> {
    const notificationBrowserStorage = new NotificationBrowserStorage()

    const notification = await notificationBrowserStorage.getById(notificationId)
    EventBus.emit('show_notification', notification)
    browser.tabs.sendMessage(tabId, {
      type: 'SHOW_NOTIFICATION',
      payload: notification,
    })
  }

  async deleteNotification(id: string | string[]): Promise<void> {
    const ids = Array.isArray(id) ? id : [id]
    const notificationBrowserStorage = new NotificationBrowserStorage()
    for (const i of ids) {
      await notificationBrowserStorage.deleteById(i)
    }
    EventBus.emit('notifications_updated')
    await this._updateBadge()
  }

  async deleteAllNotifications(): Promise<void> {
    const notificationBrowserStorage = new NotificationBrowserStorage()
    await notificationBrowserStorage.deleteAll()
    EventBus.emit('notifications_updated')
    await this._updateBadge()
  }

  async markNotificationAsViewed(id: string | string[]): Promise<void> {
    const ids = Array.isArray(id) ? id : [id]
    const notificationBrowserStorage = new NotificationBrowserStorage()
    for (const i of ids) {
      const notification = await notificationBrowserStorage.getById(i)
      notification.status = 0
      await notificationBrowserStorage.update(notification)
    }
    EventBus.emit('notifications_updated')
    await this._updateBadge()
  }
  async markAllNotificationsAsViewed(): Promise<void> {
    const notificationBrowserStorage = new NotificationBrowserStorage()
    const notification = await notificationBrowserStorage.getAll(
      (x) => x.status === NotificationStatus.Highlighted
    )

    for (const i of notification) {
      i.status = NotificationStatus.Default
      await notificationBrowserStorage.update(i)
    }
    EventBus.emit('notifications_updated')
    await this._updateBadge()
  }

  // ToDo: optimize event counting without getting the whole array
  async getUnreadNotificationsCount(source?: string): Promise<number> {
    const notificationBrowserStorage = new NotificationBrowserStorage()
    const notification: Notification[] = await notificationBrowserStorage.getAll(
      (x) => x.type === NotificationType.Application
    )
    const count = notification.filter((e) => e.status === NotificationStatus.Highlighted).length
    return count
  }

  async _updateBadge() {
    const count = await this.getUnreadNotificationsCount()
    browser.browserAction.setBadgeText({
      text: count === 0 ? '' : count.toString(),
    })
    browser.browserAction.setBadgeBackgroundColor({ color: '#f5f5f5' })
  }
}
