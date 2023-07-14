var express = require('express');
var app = express();
const fs = require('fs');
const https = require('https');
var bodyParser = require('body-parser');
const EventEmitter = require('events');

const IS_HTTPS = process.env.HOSTING !== "gcloud";
const PORT = process.env.PORT || 8080;

const store = JSON.parse(fs.readFileSync('src/server/store.json'));

class Emitter extends EventEmitter { }

const emmiter = new Emitter();

var server = null;

if (IS_HTTPS) {
    server = https.createServer({
        key: fs.readFileSync('src/server/secret/localhost/localhost.decrypted.key'),
        cert: fs.readFileSync('src/server/secret/localhost/localhost.crt')
    }, app);

    var expressWs = require('express-ws')(app, server);
} else {
    var expressWs = require('express-ws')(app);
}

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    next();
});

app.use('/packages', express.static('packages', {
    etag: false
}));

app.use('/', express.static('src/client', {
    etag: false
}));

app.ws('/:feature', function (ws, req) {
    const callbackMap = new Map();
    let subscriptionCount = 0;

    ws.on('message', json => {

        let rpc = null;

        try {
            rpc = JSON.parse(json);
        } catch (err) {
            ws.send(JSON.stringify({
                jsonrpc: "2.0",
                error: {
                    code: -32700,
                    message: "Parse error"
                },
                id: null
            }));
            return;
        }

        const {
            id,
            method,
            params
        } = rpc;

        if (id === undefined || !method || !params || !(typeof params === 'object' || Array.isArray(params))) {
            ws.send(JSON.stringify({
                jsonrpc: "2.0",
                error: {
                    code: -32600,
                    message: "Invalid JSON-RPC."
                },
                id: null
            }));
            return;
        }
        if (method === "subscribe") {
            const [ctx] = params;

            if (!ctx || !ctx.id || !(/^\d{19}$/gm.test(ctx.id))) {
                ws.send(JSON.stringify({
                    jsonrpc: "2.0",
                    id: id,
                    error: {
                        code: null,
                        message: "ctx.id is required."
                    }
                }));
                return;
            }

            const tweetId = ctx.id;

            const subscriptionId = (++subscriptionCount).toString();

            ws.send(JSON.stringify({
                jsonrpc: "2.0",
                id: id,
                result: subscriptionId
            }));

            ws.send(JSON.stringify({
                jsonrpc: "2.0",
                method: subscriptionId,
                params: [(req.params.feature === 'feature-2') ? ({
                    like_num: store.tweets[tweetId] || 0
                }) : ({
                    pm_num: store.tweets_with_PM[tweetId] ? store.tweets_with_PM[tweetId].length : 0
                })]
            }));

            const callback = ({
                tweet,
                market
            }) => {
                if (tweet !== tweetId) return;

                ws.send(JSON.stringify({
                    jsonrpc: "2.0",
                    method: subscriptionId,
                    params: [(req.params.feature === 'feature-2') ? ({
                        like_num: store.tweets[tweetId] || 0
                    }) : ({
                        pm_num: store.tweets_with_PM[tweetId] ? store.tweets_with_PM[tweetId].length : 0
                    })]
                }));
            }

            emmiter.on('tweetAttached', callback);
            callbackMap.set(subscriptionId, callback);
        } else if (method === "unsubscribe") {
            const [subscriptionId] = params;

            const callback = callbackMap.get(subscriptionId);
            if (callback) emmiter.off('tweetAttached', callback)
            else console.log("ERROR: can't destroy unknown subscription. Id:", subscriptionId, callbackMap)

            ws.send(JSON.stringify({
                jsonrpc: "2.0",
                id: id,
                result: true
            }))
        } else {
            ws.send(JSON.stringify({
                jsonrpc: "2.0",
                id: id,
                error: {
                    code: -32601,
                    message: "Procedure not found."
                }
            }))
        }
    });

    ws.on('close', () => {
        emmiter.removeAllListeners('tweetAttached');
    })
});

app.get('/index.json', function (req, res) {
    const packagesPath = './packages';
    const urls = fs.readdirSync(packagesPath)
        .filter(x => x.indexOf('overlay') === -1) // exclude overlays
        .map(package => `packages/${package}/dapplet.json`);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(urls, null, 3));
});

app.get('/api/markets', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(store, null, 3));
});

app.post('/api/markets/attach', function (req, res) {
    const {
        tweet,
        market
    } = req.body;

    if (store.tweets_with_PM[tweet] && store.tweets_with_PM[tweet].length) {
        store.tweets_with_PM[tweet].push(market);
    } else {
        store.tweets_with_PM[tweet] = [market];
    }

    res.status(200).end();
    emmiter.emit('tweetAttached', {
        tweet,
        market
    });
});

if (server) {
    server.listen(PORT);
} else {
    app.listen(PORT);
}