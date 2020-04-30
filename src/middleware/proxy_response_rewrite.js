const errors = require('restify-errors')

const set_proxy_response_rewrite = (response_rewrite_fn, external_only) => {
    return (req, res, next) => {
        if(external_only) {
            if(req.headers['x-external-request'] != "1") {
                return next();
            }
        }
        req.response_rewrite_fn = response_rewrite_fn;
        return next();
    }
}

module.exports = {
    set_proxy_response_rewrite
}