const R = require('ramda')
const errors = require('restify-errors')

//processMiscAccessFn: (decrypted_jwt) => Either(true | err)
const access_misc_resource = R.curry((processMiscAccessFn, proxyReqFn, logger) => {
    return (req, res, next) => {
        const access = processMiscAccessFn(req.decryptedToken)
        if(access.isRight) {
            logger.info({
                'access': 'misc',
                'granted': true
            })
            proxyReqFn(req, res)
        } else {
            let err = new errors.ForbiddenError("Not Authorized to Access Resource")
            err.body.context = access.value
            logger.info({
                'access': 'misc',
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
        const access = processObjectAccessFn({
            'jwt': req.decryptedToken,
            'accessType': accessType,
            'object': req.params.objectId
        })
        if(access.isRight) {
            logger.info({
                'access': 'object',
                'type': accessType,
                'object': req.params.objectId,
                'granted': true
            })
            proxyReqFn(req, res)
        } else {
            let err = new errors.ForbiddenError("Not Authorized to Access Resource")
            err.body.context = access.value
            logger.info({
                'access': 'object',
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
    access_misc_resource,
    access_object_resource
}