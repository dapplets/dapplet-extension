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

  return notify.id
}

export async function createAndShowNotification(
  notify: Notification,
  tabId?: number
): Promise<void> {
  await createNotification(notify)
  const notificationId = await createNotification(notify)
  await showNotification(notificationId, tabId)

  browser.tabs.sendMessage(
    tabId,
    {
      type: 'CREATE NOTIFICATION',
      payload: notify,
    },
    null
  )
  await _updateBadge()
}

// todo: create notification
export async function showNotification(notificationId: string, tabId: number): Promise<void> {
  const notificationBrowserStorage = new NotificationBrowserStorage()

  const notification = await notificationBrowserStorage.getById(notificationId)

  browser.tabs.sendMessage(
    tabId,
    {
      type: 'SHOW NOTIFICATION',
      payload: notification,
    },
    null
  )
}

export async function deleteNotification(id: string): Promise<void> {
  const ids = Array.isArray(id) ? id : id
  const notificationBrowserStorage = new NotificationBrowserStorage()
  for (const i of ids) {
    const notification = await notificationBrowserStorage.deleteById(i)
    const currentTab = await getCurrentTab()
    await notificationBrowserStorage.deleteById(ids)
    browser.tabs.sendMessage(
      currentTab.id,
      {
        type: 'DELETED NOTIFICATION',
        payload: notification,
      },
      null
    )
  }
}

export async function deleteAllNotifications(): Promise<void> {
  const notificationBrowserStorage = new NotificationBrowserStorage()
  await notificationBrowserStorage.deleteAll()
  const currentTab = await getCurrentTab()
  browser.tabs.sendMessage(
    currentTab.id,
    {
      type: 'DELETE ALL NOTIFICATIONS',
      payload: null,
    },
    null
  )
}

export async function markNotificationAsViewed(id: string | string[]): Promise<void> {
  const ids = Array.isArray(id) ? id : [id]
  const notificationBrowserStorage = new NotificationBrowserStorage()
  const currentTab = await getCurrentTab()
  for (const i of ids) {
    const notification = await notificationBrowserStorage.getById(i)
    notification.status = 0
    await notificationBrowserStorage.update(notification)
    browser.tabs.sendMessage(
      currentTab.id,
      {
        type: 'READ NOTIFICATION',
        payload: notification,
      },
      null
    )
  }

  await _updateBadge()
}

export async function markNotificationAsViewedAll(): Promise<void> {
  const notificationBrowserStorage = new NotificationBrowserStorage()
  const currentTab = await getCurrentTab()
  const notification = await (
    await notificationBrowserStorage.getAll()
  ).filter((x) => x.status === 1)
  for (const i of notification) {
    i.status = 0
    await notificationBrowserStorage.update(i)
    browser.tabs.sendMessage(
      currentTab.id,
      {
        type: 'READ ALL NOTIFICATION',
        payload: notification,
      },
      null
    )
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
