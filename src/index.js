//Library dependencies
const R = require('ramda')
const express = require('express')
const http_proxy = require('http-proxy')
const Either = require('data.either')
const jwt = require('@cr-ste-justine/jwt')

//Internal dependencies
const access_control_utils = require('./utils/access_control')
const jwtMiddleware = require('./middleware/jwt')
const accessControlMiddleware = require('./middleware/access_control')
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

//Routing

const server = express()

//All Routes
server.get('/download/ping', accessBaseResourceMiddleware)

server.get('/upload/:objectId', readObjectResourceMiddleware)
server.get('/upload/:objectId/status', readObjectResourceMiddleware)

server.post('/upload/7b7b2766-95cd-576a-929d-f34c59f70508/uploads', writeObjectResourceMiddleware)
server.post('/upload/7b7b2766-95cd-576a-929d-f34c59f70508/parts', writeObjectResourceMiddleware)
server.post('/upload/7b7b2766-95cd-576a-929d-f34c59f70508', writeObjectResourceMiddleware)

server.get('/download/:objectId', readObjectResourceMiddleware)

server.use(accessMiscResourceMiddleware)

const err_message = R.path(['body', 'message'])
const err_code = R.path(['body', 'code'])
const err_has_code = R.compose(R.not, R.isNil, err_code)
server.use(function (err, req, res, next) {
    if (err_has_code(err)) {
        const code = err_code(err)
        if(code == 'Unauthorized') {
            res.status(401).send(err_message(err))
        } else if(code == 'Forbidden') {
            res.status(403).send(err_message(err))
        } else {
            return next(err)
        }
    } else {
        return next(err)
    }
    
})

//Server launch

server.listen(configs.servicePort, function() {
    console.log('%s listening at %s', server.name, server.url)
})