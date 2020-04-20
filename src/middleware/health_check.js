const errors = require('restify-errors')
const request = require('request-promise-native')
const R = require('ramda')

const health_check = R.curry((target, logger) => {
    return (req, res, next) => {
        request(`${target}/download/ping`).then((resp) => {
            logger.info('Health check succeeded')
            res.status(200)
            res.send('ok')
        }).catch((err) => {
            logger.warn('Health check failed')
            res.status(500)
            res.send('not ok')
        })
    }
})

module.exports = {
    health_check
}