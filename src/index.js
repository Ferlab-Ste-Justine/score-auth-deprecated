//Library dependencies
const R = require('ramda')
const express = require('express')
const http_proxy = require('http-proxy')
const Either = require('data.either')

//Internal dependencies
const configs = require('./config')
const proxy = require('./proxy')
const logger = require('./logger')

//Parametrization of higher order utility functions

const proxy_request_to_score = proxy.proxy_request(configs.scoreService)

//Routing

const server = express()

//All Routes
server.use(proxy_request_to_score)

//Server launch

server.listen(configs.servicePort, function() {
    console.log('%s listening at %s', server.name, server.url)
})