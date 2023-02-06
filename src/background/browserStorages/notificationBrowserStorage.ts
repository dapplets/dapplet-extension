import { Notification } from '../../common/models/event'
import BaseBrowserStorage from './baseBrowserStorage'

export default class NotificationBrowserStorage extends BaseBrowserStorage<Notification> {
  constructor() {
    super(Notification, 'Notification')
  }
}
