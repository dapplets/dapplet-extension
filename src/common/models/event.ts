import Base from '../../common/models/base'

export class Event extends Base {
  getId = () => this.id
  id: string = null
  title: string = null
  description: string = null
  created: Date = null
  isRead: boolean = false
}
