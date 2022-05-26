import { Event } from '../../common/models/event'
import BaseBrowserStorage from './baseBrowserStorage'

export default class EventBrowserStorage extends BaseBrowserStorage<Event> {
  constructor() {
    super(Event, 'Event')
  }
}
