export default class UserScriptHelper {
    static extractMetablock(userscriptText: string): {
        meta: {
            [key: string] : string[]
        },
        metablock: string,
        content: string
    } {
        try {
            var blocksReg = /\B(\/\/ ==UserScript==\r?\n([\S\s]*?)\r?\n\/\/ ==\/UserScript==)([\S\s]*)/
            var blocks = userscriptText.match(blocksReg)

            if (!blocks) {
                return null
            }

            var metablock = blocks[1]
            var metas = blocks[2]
            var code = blocks[3]

            var meta = {}
            var metaArray = metas.split('\n')
            metaArray.forEach(function (m) {
                var parts = m.match(/@([\w-]+)\s+(.+)/)
                if (parts) {
                    meta[parts[1]] = meta[parts[1]] || []
                    meta[parts[1]].push(parts[2])
                }
            })

            return {
                meta: meta,
                metablock: metablock,
                content: code
            }
        } catch (e) {
            if (console) console.error(e)
            return null
        }
    }
}