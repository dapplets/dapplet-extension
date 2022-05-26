// Based on https://github.com/ankitrohatgi/tarballjs
export class Tar {
  fileData: any[] = []
  buffer: any

  addFileArrayBuffer(name: string, arrayBuffer: ArrayBuffer, opts?: any) {
    const arr = new Uint8Array(arrayBuffer)
    this.fileData.push({
      name: name,
      array: arr,
      type: 'file',
      size: arr.length,
      dataType: 'array',
      opts: opts,
    })
  }

  addFolder(name, opts) {
    this.fileData.push({
      name: name,
      type: 'directory',
      size: 0,
      dataType: 'none',
      opts: opts,
    })
  }

  _createBuffer() {
    let tarDataSize = 0
    for (let i = 0; i < this.fileData.length; i++) {
      const size = this.fileData[i].size
      tarDataSize += 512 + 512 * Math.trunc(size / 512)
      if (size % 512) {
        tarDataSize += 512
      }
    }
    let bufSize = 10240 * Math.trunc(tarDataSize / 10240)
    if (tarDataSize % 10240) {
      bufSize += 10240
    }
    this.buffer = new ArrayBuffer(bufSize)
  }

  write(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      this._createBuffer()
      let offset = 0
      let filesAdded = 0
      const onFileDataAdded = () => {
        filesAdded++
        if (filesAdded === this.fileData.length) {
          const arr = new Uint8Array(this.buffer)
          const blob = new Blob([arr], { type: 'application/x-tar' })
          resolve(blob)
        }
      }
      for (let fileIdx = 0; fileIdx < this.fileData.length; fileIdx++) {
        const fdata = this.fileData[fileIdx]
        // write header
        this._writeFileName(fdata.name, offset)
        this._writeFileType(fdata.type, offset)
        this._writeFileSize(fdata.size, offset)
        this._fillHeader(offset, fdata.opts, fdata.type)
        this._writeChecksum(offset)

        // write file data
        const destArray = new Uint8Array(this.buffer, offset + 512, fdata.size)
        if (fdata.dataType === 'array') {
          for (let byteIdx = 0; byteIdx < fdata.size; byteIdx++) {
            destArray[byteIdx] = fdata.array[byteIdx]
          }
          onFileDataAdded()
        } else if (fdata.dataType === 'file') {
          const reader = new FileReader()

          reader.onload = (function (outArray) {
            const dArray = outArray
            return function (event) {
              const sbuf = event.target.result
              const sarr = new Uint8Array(sbuf as any)
              for (let bIdx = 0; bIdx < sarr.length; bIdx++) {
                dArray[bIdx] = sarr[bIdx]
              }
              onFileDataAdded()
            }
          })(destArray)
          reader.readAsArrayBuffer(fdata.file)
        } else if (fdata.type === 'directory') {
          onFileDataAdded()
        }

        offset += 512 + 512 * Math.trunc(fdata.size / 512)
        if (fdata.size % 512) {
          offset += 512
        }
      }
    })
  }

  _writeString(str, offset, size) {
    const strView = new Uint8Array(this.buffer, offset, size)
    for (let i = 0; i < size; i++) {
      if (i < str.length) {
        strView[i] = str.charCodeAt(i)
      } else {
        strView[i] = 0
      }
    }
  }

  _writeFileName(name, header_offset) {
    // offset: 0
    this._writeString(name, header_offset, 100)
  }

  _writeFileType(typeStr, header_offset) {
    // offset: 156
    let typeChar = '0'
    if (typeStr === 'file') {
      typeChar = '0'
    } else if (typeStr === 'directory') {
      typeChar = '5'
    }
    const typeView = new Uint8Array(this.buffer, header_offset + 156, 1)
    typeView[0] = typeChar.charCodeAt(0)
  }

  _writeFileSize(size, header_offset) {
    // offset: 124
    let sz = size.toString(8)
    sz = this._leftPad(sz, 11)
    this._writeString(sz, header_offset + 124, 12)
  }

  _leftPad(number, targetLength) {
    let output = number + ''
    while (output.length < targetLength) {
      output = '0' + output
    }
    return output
  }

  _writeFileMode(mode, header_offset) {
    // offset: 100
    this._writeString(this._leftPad(mode, 7), header_offset + 100, 8)
  }

  _writeFileUid(uid, header_offset) {
    // offset: 108
    this._writeString(this._leftPad(uid, 7), header_offset + 108, 8)
  }

  _writeFileGid(gid, header_offset) {
    // offset: 116
    this._writeString(this._leftPad(gid, 7), header_offset + 116, 8)
  }

  _writeFileMtime(mtime, header_offset) {
    // offset: 136
    this._writeString(this._leftPad(mtime, 11), header_offset + 136, 12)
  }

  _writeFileUser(user, header_offset) {
    // offset: 265
    this._writeString(user, header_offset + 265, 32)
  }

  _writeFileGroup(group, header_offset) {
    // offset: 297
    this._writeString(group, header_offset + 297, 32)
  }

  _writeChecksum(header_offset) {
    // offset: 148
    this._writeString('        ', header_offset + 148, 8) // first fill with spaces

    // add up header bytes
    const header = new Uint8Array(this.buffer, header_offset, 512)
    let chksum = 0
    for (let i = 0; i < 512; i++) {
      chksum += header[i]
    }
    this._writeString(chksum.toString(8), header_offset + 148, 8)
  }

  _getOpt(opts, opname, defaultVal) {
    if (opts != null) {
      if (opts[opname] != null) {
        return opts[opname]
      }
    }
    return defaultVal
  }

  _fillHeader(header_offset, opts, fileType) {
    const uid = this._getOpt(opts, 'uid', 1000)
    const gid = this._getOpt(opts, 'gid', 1000)
    const mode = this._getOpt(opts, 'mode', fileType === 'file' ? '664' : '775')
    const mtime = this._getOpt(opts, 'mtime', Date.now())
    const user = this._getOpt(opts, 'user', 'tarballjs')
    const group = this._getOpt(opts, 'group', 'tarballjs')

    this._writeFileMode(mode, header_offset)
    this._writeFileUid(uid.toString(8), header_offset)
    this._writeFileGid(gid.toString(8), header_offset)
    this._writeFileMtime(Math.trunc(mtime / 1000).toString(8), header_offset)

    this._writeString('ustar', header_offset + 257, 6) // magic string
    this._writeString('00', header_offset + 263, 2) // magic version

    this._writeFileUser(user, header_offset)
    this._writeFileGroup(group, header_offset)
  }
}
