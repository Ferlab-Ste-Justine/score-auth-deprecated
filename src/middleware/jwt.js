const errors = require('restify-errors')

/*
    Middleware that processes the request's jwt. Expects the following input function:
    (req) => Either(decrypted_token | err)
*/
const get_jwt_token_middleware = (processTokenFn, logger) => {
    return (req, res, next) => {
        const decryptedTokenEither = processTokenFn(req)
        if(!decryptedTokenEither.isRight) {
            let err = new errors.UnauthorizedError("Invalid Credentials")
            err.body.context = decryptedTokenEither.value
            logger.info({
                'authenticated': false,
                'error': decryptedTokenEither.value
            })
            return next(err)
        } else {
            req.decryptedToken = decryptedTokenEither.value
            logger.debug({
                'authenticated': true,
                'token': req.decryptedToken
            })
            return next()
        }
    }
}

module.exports = {
    get_jwt_token_middleware
}