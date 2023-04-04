import Base from '../../common/models/base'
import { JsonValue } from '../../common/types'

export default class SessionEntry extends Base {
  getId = () => this.sessionId + '/' + this.key

  sessionId: string = null
  key: string = null
  value: JsonValue = null
}
