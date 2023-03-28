import { base64ArrayBuffer } from '../../common/base64ArrayBuffer'
import Base from '../../common/models/base'

function base64ToBufferAsync(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64)
  const len = binaryString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

export default class File extends Base {
  getId = () => this.id

  id: string = null
  data: string = null

  getData(): ArrayBuffer {
    return base64ToBufferAsync(this.data)
  }

  setData(buffer: ArrayBuffer) {
    this.data = base64ArrayBuffer(buffer)
  }
}
