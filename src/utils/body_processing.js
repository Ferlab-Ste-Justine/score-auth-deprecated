//The entire body is just a url and we want to replace the 
//<protocol>://<domain>:<port> portion with something else
const replace_body_url_base = (newBase) => {
    return (body) => {
        if(newBase) {
            const parsedUrl = new URL(body);
            return `${newBase}${parsedUrl.pathname}${parsedUrl.search}`
        } else {
            return body
        }
    }
}

module.exports = {
    replace_body_url_base
}