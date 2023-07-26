import express from 'express'
import EventEmitter from 'events'
import expressWs from 'express-ws'

const PORT = process.env.PORT || 8081

EventEmitter.defaultMaxListeners = Infinity
class Emitter extends EventEmitter {}
const emitter = new Emitter()
const callbackMap = new Map()
let subscriptionCount = 0
// LP: 5. Add storage for counters
const counter = {}
// LP end

const app = express()
expressWs(app)

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  next()
})

app.ws('/:feature', function (ws) {
  ws.on('message', (json) => {
    let rpc = null
    try {
      rpc = JSON.parse(json)
    } catch (err) {
      ws.send(
        JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32700,
            message: 'Parse error',
          },
          id: null,
        })
      )
      return
    }
    const { id, method, params } = rpc
    if (
      id === undefined ||
      !method ||
      !params ||
      !(typeof params === 'object' || Array.isArray(params))
    ) {
      ws.send(
        JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32600,
            message: 'Invalid JSON-RPC.',
          },
          id: null,
        })
      )
      return
    }
    if (method === 'subscribe') {
      const [ctx] = params
      if (!ctx || !ctx.id) {
        ws.send(
          JSON.stringify({
            jsonrpc: '2.0',
            id: id,
            error: {
              code: null,
              message: 'ctx.id is required.',
            },
          })
        )
        return
      }
      const tweetId = ctx.id
      const subscriptionId = (++subscriptionCount).toString()
      // LP: 6. Initialize counter for current tweet
      if (!Object.prototype.hasOwnProperty.call(counter, tweetId)) {
        counter[tweetId] = {
          amount: 0,
        }
      }
      // LP end
      ws.send(
        JSON.stringify({
          jsonrpc: '2.0',
          id: id,
          result: subscriptionId,
        })
      )
      // LP: 7. Send counter in `params`. method = subscriptionId
      ws.send(
        JSON.stringify({
          jsonrpc: '2.0',
          method: subscriptionId,
          params: [{ amount: counter[tweetId].amount }],
        })
      )
      // LP end
      const callback = (currentId) => {
        if (currentId !== tweetId) return
        try {
          // LP: 8. Send counter in `params`. method = subscriptionId, id = currentId
          ws.send(
            JSON.stringify({
              jsonrpc: '2.0',
              method: subscriptionId,
              id: currentId,
              params: [{ amount: counter[currentId].amount }],
            })
          )
          // LP end
        } catch (e) {
          emitter.off('attached', callbackMap.get(subscriptionId))
        }
      }
      emitter.on('attached', callback)
      callbackMap.set(subscriptionId, callback)
    } else if (method === 'increment') {
      // LP: 9. Implement counter increment
      const [currentId] = params
      counter[currentId].amount += 1
      emitter.emit('attached', currentId)
      // LP end
    } else {
      ws.send(
        JSON.stringify({
          jsonrpc: '2.0',
          id: id,
          error: {
            code: -32601,
            message: 'Procedure not found.',
          },
        })
      )
    }
  })
})

app.listen(PORT, () => console.log('Server started on port 8081'))
