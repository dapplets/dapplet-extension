import { Event } from "../../common/models/event";
import { generateGuid } from '../../common/utils';
import EventBrowserStorage from '../browserStorages/eventBrowserStorage';

export async function getEvents(): Promise<Event[]> {
    const eventBrowserStorage = new EventBrowserStorage();
    const events: Event[] = await eventBrowserStorage.getAll();
    // DESC by Created Date
    return events.sort((a,b) => new Date(b.created).getTime() - new Date(a.created).getTime());
}

export async function addEvent(title: string, description: string): Promise<void> {
    const eventBrowserStorage = new EventBrowserStorage();

    const event = new Event();
    event.id = generateGuid(); // ToDo: autoincrement?
    event.title = title;
    event.description = description;
    event.created = new Date();
    event.isRead = false;

    await eventBrowserStorage.create(event);
}

export async function setRead(id: string | string[]): Promise<void> {
    const ids = Array.isArray(id) ? id : [id];
    const eventBrowserStorage = new EventBrowserStorage();
    for (const i of ids) {
        const event = await eventBrowserStorage.getById(i);
        event.isRead = true;
        await eventBrowserStorage.update(event);
    }
}

export async function getNewEventsCount(): Promise<number> {
    const eventBrowserStorage = new EventBrowserStorage();
    const events: Event[] = await eventBrowserStorage.getAll();
    const count = events.filter(e => e.isRead === false).length;
    return count;
}