import { browser } from 'webextension-polyfill-ts'
import { generateGuid } from '../../common/helpers'
import { Event } from '../../common/models/event'
import EventBrowserStorage from '../browserStorages/eventBrowserStorage'

// Add removing function
// EventBrowserStorage - implements Repository pattern (read/add/remove)
_updateBadge()

export async function getEvents(): Promise<Event[]> {
  const eventBrowserStorage = new EventBrowserStorage()
  // const events: Event[] = await eventBrowserStorage.getAll()
  const events: Event[] = [] // !!! ToDo: change it !!!
  // DESC by Created Date
  return events.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
}

export async function addEvent(title: string, description: string): Promise<void> {
  const eventBrowserStorage = new EventBrowserStorage()

  const event = new Event()
  event.id = generateGuid() // ToDo: autoincrement?
  event.title = title
  event.description = description
  event.created = new Date()
  event.isRead = false

  await eventBrowserStorage.create(event)
  await _updateBadge()
}
export async function deleteEvent(id: string): Promise<void> {
  const ids = Array.isArray(id) ? id : id
  const eventBrowserStorage = new EventBrowserStorage()
  for (const i of ids) {
    const event = await eventBrowserStorage.deleteById(i)

    await eventBrowserStorage.deleteById(ids)
  }
}
export async function deleteEventsAll(): Promise<void> {
  const eventBrowserStorage = new EventBrowserStorage()
  await eventBrowserStorage.deleteAll()
}

export async function setRead(id: string | string[]): Promise<void> {
  const ids = Array.isArray(id) ? id : [id]
  const eventBrowserStorage = new EventBrowserStorage()
  for (const i of ids) {
    const event = await eventBrowserStorage.getById(i)
    event.isRead = true
    await eventBrowserStorage.update(event)
  }

  await _updateBadge()
}

export async function getNewEventsCount(): Promise<number> {
  const eventBrowserStorage = new EventBrowserStorage()
  const events: Event[] = await eventBrowserStorage.getAll()
  const count = events.filter((e) => e.isRead === false).length
  return count
}

async function _updateBadge() {
  const count = 0 // await getNewEventsCount()  !!!! ToDo ACHTUNG !!!!
  browser.browserAction.setBadgeText({
    text: '', // count === 0 ? '' : count.toString(),  !!!! ToDo ACHTUNG !!!!
  })
  browser.browserAction.setBadgeBackgroundColor({ color: '#2185d0' })
}
