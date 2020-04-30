const R = require('ramda')

const config_utils = require('@cr-ste-justine/configs')

const get_env_variable = (key) => {
    return {'key': key, 'val': R.prop(key, process.env)}
}

const _load_mandatory_str_env_var = config_utils.load_mandatory_str_config(get_env_variable)
const _load_mandatory_json_env_var = config_utils.load_mandatory_json_config(get_env_variable)

const load_mandatory_str_env_var = (key) => {
    const result = _load_mandatory_str_env_var(key)
    if(result.isRight) {
        return result.value
    } else {
        console.log(`${result.value.key} configuration is undefined`)
        process.exit(1)
    }
}

const load_optional_str_env_var = (key, fallbackFn) => config_utils.load_optional_str_config(get_env_variable, fallbackFn)(key)

const load_mandatory_json_env_var = (key) => {
    const result = _load_mandatory_json_env_var(key)
    if(result.isRight) {
        return result.value
    } else {
        console.log(result.value.defaultMessage)
        process.exit(1)
    }
}

module.exports = {
    jwtSecret: load_mandatory_str_env_var('JWT_SECRET'),
    scoreService: load_mandatory_str_env_var('SCORE_SERVICE'),
    servicePort: load_mandatory_str_env_var('SERVICE_PORT'),
    adminRole: load_mandatory_str_env_var('ADMIN_ROLE'),
    objectStoreExternalUrl: load_optional_str_env_var('OBJECT_STORE_EXTERNAL_URL', () => null),
    authenticationLogger: load_optional_str_env_var('AUTHENTICATION_LOGGER', () => 'default'),
    accessControlLogger: load_optional_str_env_var('ACCESS_CONTROL_LOGGER', () => 'default'),
    reverseProxyLogger: load_optional_str_env_var('REVERSE_PROXY_LOGGER', () => 'default'),
    livelinessLogger: load_optional_str_env_var('LIVELINESS_LOGGER', () => 'default'),
}