//Library dependencies
const R = require('ramda')
const express = require('express')
const http_proxy = require('http-proxy')
const Either = require('data.either')
const jwt = require('@cr-ste-justine/jwt')

//Internal dependencies
const access_control_utils = require('./utils/access_control')
const body_processing_utils = require('./utils/body_processing')
const HealthCheckMiddleware = require('./middleware/health_check')
const jwtMiddleware = require('./middleware/jwt')
const accessControlMiddleware = require('./middleware/access_control')
const proxyResRewriteMiddleware = require('./middleware/proxy_response_rewrite')
const configs = require('./config')
const proxy = require('./proxy')
const logger = require('./logger')

//Parametrization of higher order utility functions
const is_admin = access_control_utils.is_admin(configs.adminRole)
const access_object = access_control_utils.access_object(
    is_admin,
    //For now the check to access object when not admin is set to always true
    R.T
)
const proxy_request_to_score = proxy.proxy_request(configs.scoreService)

//Parametrization of higher order middleware generating functions 

//Being logged in is enough
const accessBaseResourceMiddleware = accessControlMiddleware.access_misc_resource(
    () => Either.Right('ok'),
    proxy_request_to_score,
    logger.accessControlLogger
)

const accessMiscResourceMiddleware = accessControlMiddleware.access_misc_resource(
    access_control_utils.process_resource_access(
        is_admin,
        access_control_utils.generate_misc_access_err
    ),
    proxy_request_to_score,
    logger.accessControlLogger
)

const accessObjectResourceMiddleware = accessControlMiddleware.access_object_resource(
    R.__,
    access_control_utils.process_resource_access(
        access_object,
        access_control_utils.generate_object_access_err
    ),
    proxy_request_to_score,
    logger.accessControlLogger
)

const readObjectResourceMiddleware = accessObjectResourceMiddleware('read')
const writeObjectResourceMiddleware = accessObjectResourceMiddleware('write')

const get_current_time_in_seconds = () => Math.round( new Date().getTime() / 1000 )

const getJwtTokenMiddleware = jwtMiddleware.get_jwt_token_middleware(
    jwt.process_request_token(
        jwt.get_token_from_header,
        configs.jwtSecret,
        Either.Right,
        jwt.check_token_expiry(R.prop('expiry'), get_current_time_in_seconds)
    ),
    logger.authenticationLogger
)

const healthCheckMiddlewareInst = HealthCheckMiddleware.health_check(configs.scoreService, logger.livelinessLogger)

//Routing

const server = express()

//All Routes
server.get(
    '/proxy/health',
    healthCheckMiddlewareInst
)

server.get(
    '/download/ping',
    getJwtTokenMiddleware,
    proxyResRewriteMiddleware.set_proxy_response_rewrite(
        body_processing_utils.replace_body_url_base(configs.objectStoreExternalUrl),
        true
    ),
    accessBaseResourceMiddleware
)

server.get(
    '/upload/:objectId',
    getJwtTokenMiddleware,
    readObjectResourceMiddleware
)
server.get(
    '/upload/:objectId/status',
    getJwtTokenMiddleware,
    readObjectResourceMiddleware
)

server.post(
    '/upload/:objectId/uploads', 
    getJwtTokenMiddleware,
    writeObjectResourceMiddleware
)
server.post(
    '/upload/:objectId/parts', 
    getJwtTokenMiddleware,
    writeObjectResourceMiddleware
)
server.post(
    '/upload/:objectId', 
    getJwtTokenMiddleware,
    writeObjectResourceMiddleware
)

server.get(
    '/download/:objectId',
    getJwtTokenMiddleware, 
    readObjectResourceMiddleware
)

server.use(
    getJwtTokenMiddleware,
    accessMiscResourceMiddleware
)

const err_message = R.path(['body', 'message'])
const err_code = R.path(['body', 'code'])
const err_has_code = R.compose(R.not, R.isNil, err_code)
server.use(function (err, req, res, next) {
    if (err_has_code(err)) {
        const code = err_code(err)
        if(code == 'BadRequest') {
            res.status(400).send(err_message(err))
        } else if(code == 'Unauthorized') {
            res.status(401).send(err_message(err))
        } else if(code == 'Forbidden') {
            res.status(403).send(err_message(err))
        } else if (code == 'NotFound') {
            res.status(404).send(err_message(err))
        } else if (code == 'InternalServer') {
            res.status(500).send(err_message(err))
        } else if (code == 'ServiceUnavailable') {
            res.status(503).send(err_message(err))
        } else {
            res.status(500).send('Undefined Error')
        }
    } else {
        return next(err)
    }
})

//Server launch

server.listen(configs.servicePort, function() {
    console.log('%s listening at %s', server.name, server.url)
})