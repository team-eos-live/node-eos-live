// Gets EOS information in an FP and async manner.
const fnl = require('fnl');
const oext = require('obext');
const request = require("request");
const util = require("util");
const {
    promisify
} = util;
const is_array = Array.isArray;
const {
    prop,
    field
} = oext;
const {
    Evented_Class,
    each,
    clone,
    arrayify
} = require('lang-mini');
const {
    prom,
    obs
} = fnl;
const {
    get,
    post
} = require('./http-plus');
// https://api.eosnetworkmonitor.io/api/v1/table
// https://api.dev04.cryptolions.io/api/v1/table
//  Would be a very good map of endpoints.

//const NTPClient = require('@destinationstransfers/ntp');
// 
//"@destinationstransfers/ntp": "^1.1.0",
// should I use raw HTTP rather than the request module?
//  That would help get the timings of when headers are received vs when the completed document is received.

//const p_request = promisify(request);
//const p_post = promisify(request.post);

// and the eos network table...

// EOS network table
// download network table, or load a cached one from disk.

let sort_network_table_by_votes = network_table => clone(network_table).sort((a, b) => b.votesPercentage - a.votesPercentage);
let download_network_table = async () => {
    let [tbl, tbl_http_info] = await get('https://api.dev04.cryptolions.io/api/v1/table');
    return tbl;
}
let get_network_table = async () => {
    return (await download_network_table());
}

// single attempt
const endpoint_get_info = (url_endpoint, timeout = 3000) => post(url_endpoint + '/v1/chain/get_info', timeout);

const get_eos_name_endpoints_from_network_table_by_eos_name = network_table => {
    let res = {};
    each(network_table, item => {
        each(item.nodes, node => {
            if (node.http_server_address) {
                res[node.bp_name] = res[node.bp_name] || {};
                res[node.bp_name].http = res[node.bp_name].http || [];
                res[node.bp_name].http.push(node.http_server_address);
            }
            if (node.https_server_address) {
                res[node.bp_name] = res[node.bp_name] || {};
                res[node.bp_name].https = res[node.bp_name].https || [];
                res[node.bp_name].https.push(node.https_server_address);
            }
        });
    });
    return res;
}

const get_top_providers_info = async () => {
    let tbl = await get_network_table();
    //console.log('tbl', tbl);

    let sorted_by_votes_nodes = sort_network_table_by_votes(tbl);
    let top_100_providers = sorted_by_votes_nodes.slice(0, 100);
    let nodes_with_endpoints = top_100_providers.filter(x => x.endpoints && x.endpoints.length > 0);
    // then get the top ones in the right way
    let [top_21_providers, next_42_providers] = [top_100_providers.slice(0, 21), top_100_providers.slice(21, 63)];
    //console.log('nodes_with_endpoints', nodes_with_endpoints);
    let map_names_to_endpoints = get_eos_name_endpoints_from_network_table_by_eos_name(nodes_with_endpoints);
    let res = {
        map_names_to_endpoints: map_names_to_endpoints,
        top_21_providers: top_21_providers,
        next_42_providers: next_42_providers,
        top_100_providers: top_100_providers
    }
    return res;
}

const get_provider_endpoints = (provider) => {
    let res = {
        http: [],
        https: []
    }

    each(provider.nodes, node => {
        if (node.http_server_address) res.http.push(node.http_server_address);
        if (node.https_server_address) res.https.push(node.https_server_address);
    });

    if (res.http.length === 0 && res.https.length === 0) {
        //console.log('provider', provider);
        //throw 'No endpoints found for provider ' + provider.name;
    }

    return res;
}
// An observable that is also a latency check.

const get_provider_info_latency = async (provider, protocol_timeouts = {
    http: 3000,
    https: 3000
}) => {
    //console.log('1) provider', provider);
    //let [info, http_info] = await get('https://api.dev04.cryptolions.io/api/v1/table');

    let endpoints = get_provider_endpoints(provider);
    //console.log('endpoints', endpoints);

    let res = {
        http: [],
        https: []
    }
    // use fns in order to do this in sequence

    for (let http_endpoint of endpoints.http) {
        let [endpoint_info, http_info] = await endpoint_get_info('http://' + http_endpoint, protocol_timeouts.http);
        //console.log('--------------');
        //console.log('endpoint_info', endpoint_info);
        //console.log('http_info', http_info);
        res.http.push([endpoint_info, http_info]);
    }

    for (let https_endpoint of endpoints.https) {
        let [endpoint_info, https_info] = await endpoint_get_info('https://' + https_endpoint, protocol_timeouts.https);
        //console.log('--------------');
        //console.log('endpoint_info', endpoint_info);
        //console.log('https_info', https_info);
        res.https.push([endpoint_info, https_info]);
    }
    return [provider.name, res];

    //let res = {
    //    http: http()
    //}
    // test http latencies
    // Try all in parallel?
    //  7 at once would work well.

    // parallel downloading of a bunch of them.
    //let [info, http_info] = post();

}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// could be an observable, returning latency results ASAP.
const get_providers_info_latency = (providers, protocol_timeouts = {
    http: 3000,
    https: 3000
}) => obs((next, complete, error) => {

    console.log('get_providers_info_latency');
    console.log('providers.length', providers.length);
    console.log('protocol_timeouts', protocol_timeouts);

    let c = providers.length;


    // and delay this a little bit.
    //  do in batches of 4 at 500 ms apart

    let batch_size = 8;
    let batch_delay = 500;

    let i = 0;

    each(providers, provider => {
        (async () => {
            //let [info, latency] = await get_provider_info_latency(provider);
            // The info alongside the delay
            let batch_num = Math.floor(i / batch_size);
            //console.log('batch_num', batch_num);
            i++;
            let ms_delay = batch_delay * batch_num;

            await delay(ms_delay);

            try {
                let provider_info_latency = await get_provider_info_latency(provider, protocol_timeouts);

                //console.log('provider_info_latency', provider_info_latency);
                next([ms_delay, provider_info_latency]);
                c--;
                //console.log('c', c);
                if (c === 0) {
                    complete();
                }
            } catch (err) {
                c--;
                //console.log('c', c);
                if (c === 0) {
                    complete();
                }
            }

        })();

    });
    return [];
});


const latency_filter = (arr_info_latencies) => {
    let res = [];
    let request_latency_complient_http = [];
    let request_latency_complient_https = [];

    each(arr_info_latencies, res_info_latency => {
        //console.log('res_info_latency', res_info_latency);
        let [delay, il] = res_info_latency;
        let [provider_name, info_latency] = il;
        //console.log('provider_name', provider_name);
        //console.log('info_latency', info_latency);

        let {
            http,
            https
        } = info_latency;
        //console.log('http', http);
        //console.log('https', https);
        each(http, http_endpoint => {
            //console.log('http_endpoint', http_endpoint);
            let [endpoint_info, http_info] = http_endpoint;
            if (endpoint_info) {
                request_latency_complient_http.push([provider_name, endpoint_info, http_info]);
            }
        });
        each(https, https_endpoint => {
            //console.log('https_endpoint', https_endpoint);
            let [endpoint_info, https_info] = https_endpoint;
            if (endpoint_info) {
                request_latency_complient_https.push([provider_name, endpoint_info, https_info]);
            }
        });

        /*
        res.push({
            http: request_latency_complient_http,
            https: request_latency_complient_https
        });
        */
    });

    console.log('request_latency_complient_http.length', request_latency_complient_http.length);
    console.log('request_latency_complient_https.length', request_latency_complient_https.length);
    return {
        http: request_latency_complient_http,
        https: request_latency_complient_https
    };

}

/*
const get_http_provider_block = async (endpoint, block_num) => {
    let pr_post =
    let [block, http_info] = await post('http://' + endpoint + '/v1/chain/get_block', JSON.stringify({
        block_num_or_id: block_num
    }));
    //console.log('block', block);

    //let {timestamp, producer, r_block_num} = block;

    return block;

}
*/
const get_http_provider_block = (endpoint, block_num) => {
    let abort;
    let p_res = prom(async (solve, jettison) => {

        try {
            let pr = post('http://' + endpoint + '/v1/chain/get_block', JSON.stringify({
                block_num_or_id: block_num
            }));
            abort = pr.abort;

            let [block, http_info] = await pr;
            solve(block);
        } catch (err) {
            jettison(err);
        }


    });
    p_res.abort = abort;
    return p_res;
}


const dist_get_block = (endpoints, block_num) => {
    // use HTTP

    return prom((solve, jettison) => {
        let nodes = [];
        let http_servers = [];
        each(endpoints, ep => {
            each(ep.nodes, node => nodes.push(node));
        });
        //console.log('nodes', nodes);
        each(nodes, node => {
            if (node.http_server_address) {
                http_servers.push(node.http_server_address);
            }
        });
        //console.log('http_servers', http_servers);

        let solved = false;

        // Definitely would help to be able to cancel other requests.
        //  After the 2nd?

        let arr_promises = [];

        each(http_servers, async http_server => {
            // Be able to abort calls too.
            let pr = get_http_provider_block(http_server, block_num);
            arr_promises.push(pr);
            // track error count....
            try {
                let current_block = await pr;
                //console.log('current_block', current_block);
                solve(current_block);

                each(arr_promises, pr2 => {
                    //console.log('pr2.abort', pr2.abort);
                    if (pr !== pr2) pr2.abort();
                });

            } catch (err) {


            }



            /*
            if (!solved) {
                solved = true;
                solve(current_block);

            }
            */
        });
    });



    // get the block num for each of those addresses.

    // http get on all of them

    // use event driven model here...







}

//  and then there is chain latency too
// request_latency_thresholded_providers
/*
const latency_threshold_providers = async protocol_ms_thresholds => {



}
*/

module.exports = {
    download_network_table: download_network_table,
    get_network_table: get_network_table,
    endpoint_get_info: endpoint_get_info,
    get_top_providers_info: get_top_providers_info,
    get_providers_info_latency: get_providers_info_latency,
    latency_filter: latency_filter,
    dist_get_block: dist_get_block
}