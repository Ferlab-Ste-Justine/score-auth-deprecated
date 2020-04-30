const R = require('ramda')
const errors = require('restify-errors')

//Implementation details of flagging external access so that further middleware can check for it
//in an implementation-agnostic manner.
const flag_external_access = (logger) => {
    return (req, res, next) => {
        req.externalRequest = req.headers['x-external-request'] == "1"
        if(!req.externalRequest) {
            logger.info({
                'event': 'internal_request',
                'method': req.method,
                'url': req.url
            })  
        }
        next()
    }
}

//Make endpoint only accessible internally
const access_internal_endpoint = (logger) => {
    return (req, res, next) => {
        if(req.externalRequest) {
            logger.info({
                'event': 'internal_endpoint_access_denied',
                'method': req.method,
                'url': req.url
            })
        } else {
            next()
        }
    }
}

//processMiscAccessFn: (decrypted_jwt) => Either(true | err)
const access_misc_resource = R.curry((processMiscAccessFn, proxyReqFn, logger) => {
    return (req, res, next) => {
        if(!req.externalRequest) {
            proxyReqFn(req, res)
            return
        }
        const access = processMiscAccessFn(req.decryptedToken)
        if(access.isRight) {
            logger.info({
                'event': 'misc_access',
                'method': req.method,
                'url': req.url,
                'granted': true
            })
            proxyReqFn(req, res)
        } else {
            let err = new errors.ForbiddenError("Not Authorized to Access Resource")
            err.body.context = access.value
            logger.info({
                'event': 'misc_access',
                'method': req.method,
                'url': req.url,
                'granted': false,
                'context': access.value
            })
            return next(err)
        }
    }
})

//Access: {jwt: ..., accessType: read|write, study: ...}
//processObjectAccessFn: (Access) =>  => Either(true | err)
const access_object_resource = R.curry((accessType, processObjectAccessFn, proxyReqFn, logger) => {
    return (req, res, next) => {
        if(!req.externalRequest) {
            proxyReqFn(req, res)
            return
        }
        const access = processObjectAccessFn({
            'jwt': req.decryptedToken,
            'accessType': accessType,
            'object': req.params.objectId
        })
        if(access.isRight) {
            logger.info({
                'event': 'object_access',
                'type': accessType,
                'object': req.params.objectId,
                'granted': true
            })
            proxyReqFn(req, res)
        } else {
            let err = new errors.ForbiddenError("Not Authorized to Access Resource")
            err.body.context = access.value
            logger.info({
                'event': 'object_access',
                'type': accessType,
                'object': req.params.objectId,
                'granted': false,
                'context': access.value
            })
            return next(err)
        }
    }
})

module.exports = {
    flag_external_access,
    access_internal_endpoint,
    access_misc_resource,
    access_object_resource
}