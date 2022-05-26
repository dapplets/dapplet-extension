import Base from '../../common/models/base'

export default class File extends Base {
  getId = () => this.id

  id: string = null
  data: string = null

  // ToDo: Perhaps it isn't used. Need to check
  getData(): ArrayBuffer {
    const buf = new ArrayBuffer(this.data.length)
    const bufView = new Uint8Array(buf)
    for (let i = 0, strLen = this.data.length; i < strLen; i++) {
      bufView[i] = this.data.charCodeAt(i)
    }
    return buf
  }

  setData(buffer: ArrayBuffer): void {
    this.data = String.fromCharCode.apply(null, new Uint8Array(buffer))
  }
}
