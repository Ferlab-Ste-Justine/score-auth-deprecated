var httpProxy = require('http-proxy');

const logger = require('./logger')

var proxy = httpProxy.createProxyServer({});

//https://github.com/http-party/node-http-proxy/issues/1328
//https://github.com/http-party/node-http-proxy/issues/1219
proxy.before('web', 'stream', (req, res, options) => {
    if (req.headers.expect) {
        req.__expectHeader = req.headers.expect;
        delete req.headers.expect;
    }
})

proxy.on('proxyReq', function(proxyReq, req, res, options) {
    proxyReq.removeHeader('authorization')

    if (req.__expectHeader) {
        proxyReq.setHeader('Expect', req.__expectHeader);
    }
    logger.reverseProxyLogger.debug({
        'event': 'proxyReq',
        'request': {
            'method': proxyReq.method,
            'url': proxyReq.url
        }
    })
})

proxy.on('proxyRes', function(proxyRes, req, res) {
    logger.reverseProxyLogger.info({
        'event': 'proxyRes',
        'request': {
            'method': req.method,
            'url': req.url
        },
        'response': {
            'code': proxyRes.statusCode
        }
    })
})

const proxy_request = (target) => ((req, res) => {
    proxy.web(req, res, { target })
})

module.exports = {
    proxy_request
}