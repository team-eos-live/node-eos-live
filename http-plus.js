const http = require('http');
const https = require('https');

const liburl = require('url');

const {
    prop,
    field
} = require('obext');

const {
    prom,
    obs
} = require('fnl');

const http_get = (url) => {
    return prom((solve, jettison) => {
        let ourl = liburl.parse(url);
        //console.log('url', url);

        let ms_start = Date.now();

        //console.log('url.protocol', url.protocol);

        let http_mod = ourl.protocol === 'https:' ? https : http;
        let http_info;
        let req = http_mod.request({
            protocol: ourl.protocol,
            hostname: ourl.hostname,
            port: ourl.port,
            path: ourl.path,
            method: 'GET'
        }, response => {
            //console.log('Object.keys(response)', Object.keys(response));
            let {
                statusCode,
                statusMessage
            } = response;

            if (statusCode === 200) {
                let chunks = [];

                response.on('data', (chunk) => {
                    //console.log(`BODY: ${chunk}`);
                    chunks.push(chunk);
                    let ms_data = Date.now();
                    let latency = ms_data - ms_start;

                    //console.log()
                    //let obj_info = JSON.parse(chunk);

                    http_info = {
                        //api_endpoint: str_endpoint,
                        url: url,
                        statusCode: statusCode,
                        statusMessage: statusMessage,
                        latency: latency
                    }
                    //let res = [obj_info, http_info];
                    //solve(res);
                    //let 
                    //let res = JSON.parse(chunk);
                    //console.log('res', res);
                });
                response.on('end', () => {
                    let obj_info = JSON.parse(Buffer.concat(chunks));
                    let res = [obj_info, http_info];
                    solve(res);
                })
                response.on('error', err => {
                    console.log('response error', err);
                })
            } else {

                // won't have the result.
                console.log('statusCode', statusCode);
                let ms_data = Date.now();
                let latency = ms_data - ms_start;
                let http_info = {
                    //api_endpoint: str_endpoint,
                    url: url,
                    statusCode: statusCode,
                    statusMessage: statusMessage,
                    latency: latency
                }
                let res = [undefined, http_info];
                //solve(res);
                jettison(res);
            }
            //console.log('str_endpoint, statusCode', str_endpoint, statusCode);
        });
        req.setTimeout(3000);
        req.on('error', err => {
            //console.log('http error with url', url, err);
            //return err;
            let ms_data = Date.now();
            let latency = ms_data - ms_start;
            let http_info = {
                //api_endpoint: str_endpoint,
                url: url,
                latency: latency
            }
            let res = [undefined, http_info];
            //solve(res);
            jettison(res);
        });
        req.end();
    });
}


// Want to set the timeout in the parameter.
//  could have a number as the timeout, otherwise it's JSON data to send.

const http_post = (url, data) => {

    let ms_timeout = 3000;
    if (typeof data === 'number') {
        ms_timeout = data;
        data = null;
    }

    // and an abort function too?
    
    // would want to get an abort function returned.
    //  could be called from another code context, while the promise is running.
    let abort;

    let p_res = prom((solve, jettison) => {
        let ourl = liburl.parse(url);
        //console.log('url', url);
        let ms_start = Date.now();
        //console.log('url.protocol', url.protocol);
        let http_mod = ourl.protocol === 'https:' ? https : http;
        let http_info;
        let pending_cancel = true;
        // and a delay to cancel the request and result
        let req = http_mod.request({
            protocol: ourl.protocol,
            hostname: ourl.hostname,
            port: ourl.port,
            path: ourl.path,
            method: 'POST'
        }, response => {
            //console.log('Object.keys(response)', Object.keys(response));
            let {
                statusCode,
                statusMessage
            } = response;

            if (statusCode === 200) {
                let chunks = [];
                response.on('data', (chunk) => {
                    //console.log(`BODY: ${chunk}`);
                    chunks.push(chunk);
                    let ms_data = Date.now();
                    let latency = ms_data - ms_start;
                    //console.log()
                    //let obj_info = JSON.parse(chunk);
                    http_info = {
                        //api_endpoint: str_endpoint,
                        url: url,
                        statusCode: statusCode,
                        statusMessage: statusMessage,
                        latency: latency,
                        ms_sent: ms_start
                    }
                    //let res = [obj_info, http_info];
                    //solve(res);
                    //let 
                    //let res = JSON.parse(chunk);
                    //console.log('res', res);
                });
                response.on('end', () => {
                    try {
                        let obj_info = JSON.parse(Buffer.concat(chunks));
                        let res = [obj_info, http_info];
                        pending_cancel = false;
                        solve(res);
                    } catch (err) {

                        // Happens when the request is aborted;

                        //console.log('buffer concat chunks string', Buffer.concat(chunks).toString());
                        jettison(err);
                    }
                })
                response.on('error', err => {
                    console.log('response error', err);
                    let ms_data = Date.now();
                    let latency = ms_data - ms_start;
                    let http_info = {
                        //api_endpoint: str_endpoint,
                        url: url,
                        statusCode: statusCode,
                        statusMessage: statusMessage,
                        latency: latency,
                        ms_start: ms_start
                    }
                    pending_cancel = false;
                    let res = [undefined, http_info];
                    jettison(res);
                });
            } else {
                // won't have the result.
                console.log('statusCode', statusCode);
                let ms_data = Date.now();
                let latency = ms_data - ms_start;
                let http_info = {
                    //api_endpoint: str_endpoint,
                    url: url,
                    statusCode: statusCode,
                    statusMessage: statusMessage,
                    latency: latency,
                    ms_start: ms_start
                }
                pending_cancel = false;
                let res = [undefined, http_info];
                jettison(res);
            }
            //console.log('str_endpoint, statusCode', str_endpoint, statusCode);

        });
        abort = () => {
            req.abort();
        }
        req.setTimeout(ms_timeout);
        // But it starts delivering data but takes too long...

        req.on('error', err => {
            //console.log('http error with url', url, err);
            //return err;
            let ms_data = Date.now();
            let latency = ms_data - ms_start;
            let http_info = {
                //api_endpoint: str_endpoint,
                url: url,
                latency: latency,
                ms_start: ms_start
            }
            pending_cancel = false;
            let res = [undefined, http_info];
            solve(res);
        });
        req.end(data);

        setTimeout(() => {
            // cancel the whole thing if taking too long
            if (pending_cancel) {
                //console.log('time to cancel');
                req.abort();
            }
        }, ms_timeout + 1);

    });
    p_res.abort = abort;

    return p_res;
}

module.exports = {
    get: http_get,
    post: http_post
}