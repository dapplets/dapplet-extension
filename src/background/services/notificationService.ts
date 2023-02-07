import { browser } from 'webextension-polyfill-ts'
import { getCurrentTab } from '../../common/helpers'
import { Notification, NotificationType } from '../../common/models/notification'
import NotificationBrowserStorage from '../browserStorages/notificationBrowserStorage'

// Add removing function
// NotificationBrowserStorage - implements Repository pattern (read/add/remove)
_updateBadge()

export async function getNotifications(type: NotificationType): Promise<Notification[]> {
  const notificationBrowserStorage = new NotificationBrowserStorage()
  const notification: Notification[] = await notificationBrowserStorage.getAll()
  const filteredNotification = notification
    .filter((x) => x.type === type)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return filteredNotification
}

export async function createNotification(notify: Notification): Promise<string> {
  const notificationBrowserStorage = new NotificationBrowserStorage()

  await notificationBrowserStorage.create(notify)
  await _updateBadge()
  return notify.id
}

export async function createAndShowNotification(
  notify: Notification,
  tabId?: number
): Promise<void> {
  // Todo: how use tabId?
  const currentTab = await getCurrentTab()
  if (tabId !== currentTab.id) return
  const notificationBrowserStorage = new NotificationBrowserStorage()

  await notificationBrowserStorage.create(notify)
  await _updateBadge()
}

export async function showNotification(notificationId: string, tabId: number): Promise<void> {
  // Todo: how use tabId?
  const notificationBrowserStorage = new NotificationBrowserStorage()
  const currentTab = await getCurrentTab()
  const notification: Notification[] = await notificationBrowserStorage.getAll()
  notification.filter((x) => x.id === notificationId && tabId === currentTab.id)
}

export async function deleteNotification(id: string): Promise<void> {
  const ids = Array.isArray(id) ? id : id
  const notificationBrowserStorage = new NotificationBrowserStorage()
  for (const i of ids) {
    const notification = await notificationBrowserStorage.deleteById(i)

    await notificationBrowserStorage.deleteById(ids)
  }
}

export async function deleteAllNotifications(): Promise<void> {
  const notificationBrowserStorage = new NotificationBrowserStorage()
  await notificationBrowserStorage.deleteAll()
}

export async function markNotificationAsViewed(id: string | string[]): Promise<void> {
  const ids = Array.isArray(id) ? id : [id]
  const notificationBrowserStorage = new NotificationBrowserStorage()
  for (const i of ids) {
    const notification = await notificationBrowserStorage.getById(i)
    notification.status = 0
    await notificationBrowserStorage.update(notification)
  }

  await _updateBadge()
}

export async function getUnreadNotificationsCount(source?: string): Promise<number> {
  const notificationBrowserStorage = new NotificationBrowserStorage()
  const notification: Notification[] = await notificationBrowserStorage.getAll()
  const count = notification.filter((e) => e.status !== 1).length
  return count
}

async function _updateBadge() {
  const count = 0 // await getUnreadNotificationsCount()  !!!! ToDo ACHTUNG !!!!
  browser.browserAction.setBadgeText({
    text: '', // count === 0 ? '' : count.toString(),  !!!! ToDo ACHTUNG !!!!
  })
  browser.browserAction.setBadgeBackgroundColor({ color: '#2185d0' })
}
