/*
    0.0.2 - Hunter algorithm.
*/

const fnl = require('fnl');
const oext = require('obext');
const util = require("util");
const {
    promisify
} = util;
const liburl = require('url');

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

// https://api.eosnetworkmonitor.io/api/v1/table
// https://api.dev04.cryptolions.io/api/v1/table
//  Would be a very good map of endpoints.

const eos_info = require('./eos-info');

const EOS_Blockchain_Microsim = require('./eos-chain-microsim');



//const NTPClient = require('@destinationstransfers/ntp');
// 
//"@destinationstransfers/ntp": "^1.1.0",
// should I use raw HTTP rather than the request module?
//  That would help get the timings of when headers are received vs when the completed document is received.

// "http://api-mainnet1.starteos.io", "http://bp.eos.vote:8888",


const raceToSuccess = (promises) => {
    let numRejected = 0;

    return new Promise(
        (resolve, reject) =>
        promises.forEach(
            promise =>
            promise.then(resolve).catch(
                () => {
                    if (++numRejected === promises.length) reject();
                }
            )
        )
    );
}

const shuffle = (array) => {
    var currentIndex = array.length,
        temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}


//default_api_endpoints = shuffle(default_api_endpoints);

const p_delay = (ms) => {
    return prom((solve, jettison) => {
        setTimeout(() => {
            solve();
        }, ms)
    })
}


// 0.0.1.1
//  Much less polling to find the times of the latest blocks.
//  We know a block comes in 500ms after the previous.
// 

// Need some more performance / reliability improvements so that it 

// https://api.eosdetroit.io:443

var CircularBuffer = require("circular-buffer");

// Rotating request and results log
//  This would be the best way to get version 1 able to produce a useful report of where performance success and problems lie.


// Server should start by getting block info from the servers, doign a latency and time sync test.

// Want to deal with the time offsets from the server's UTC times in the blockchains.

// Block behind by x ms 

// Block_Info just to start with, hopwever staggered / 4 parallel reqs.

// External rotating logs using pm2 will probably be best.
// Request_Diagnostic_Buffer

// so every HTTP request that the app makes goes into the buffer
//  url, time requested, time first received any response, time response finished, error code, error message, (error body)
//  being able to get a request diagnosis buffer would help spot various problems / the best servers.




class Last_Requests_Diagnostic_Log {
    constructor(spec) {
        let cbuf_requests = new CircularBuffer(1024);
        this.log = (data => {
            cbuf_requests.enq([Date.now(), data]);
        });
        this.toArray = this.toarray = () => {
            return cbuf_requests.toarray();
        }
    }
}


class EOS_Live_Hunter extends Evented_Class {
    constructor(spec) {
        spec = spec || {};
        super(spec);
        // Connect to single EOS node?
        //  Multiple nodes to connect to, maintain multiple EOS_Live_Node objects.
        // Could use a single EOS_Live_Node for the moment.
        let connections = this.connections = [];
        let mcbe = this.map_connections_by_endpoints = {};



        let micro_sim = new EOS_Blockchain_Microsim();
        let req_diag_log = this.req_diag_log = new Last_Requests_Diagnostic_Log();

        this.map_blocks_are_received = {};
        this.num_last_block_received = -1;

        //let api_endpoints = this.api_endpoints = default_api_endpoints;

        //let [best_connections, middle_tier_connections, slow_connections, too_slow_connections, broken_connections, banned_from_connections] = this.connection_tiers = [[], [], [], [], [], []];
        // best connections under 25 ms

        //  or higher cutoff point.

        // then once we have these worked out, we can only query the top ones to get the latest blockchain numbers and data, to get the best latency.
        // middle tier could be used more to download older / more historic data.
        //  not as necessary for real-time or almost real-time.

        // Get the head blocks.
        //  (also get latencies)

        // Get started automatically in terms of keeping / getting in sync with block timings.
        //  More within the constructor too.
        (async () => {

            let nm_endpoints_scan = async () => {
                console.log('nm_endpoints_scan');
                // https://api.dev04.cryptolions.io/api/v1/table
                // 'https://api.eosnetworkmonitor.io/api/v1/table'
                //let tbl = await eos_info.get_network_table();

                let {
                    top_21_providers,
                    next_42_providers,
                    map_names_to_endpoints,
                    top_100_providers
                } = await eos_info.get_top_providers_info();
                // top 63

                ///let top_63_providers = top_100.slice(0, 63);

                let map_top_100 = {};
                each(top_100_providers, provider => {
                    map_top_100[provider.name] = provider;
                })

                //let map_top_100 = top_100_providers.map(x => x.name);
                // Will try all at once.


                //let top_63_info_latency = eos_info.info_latency()
                //console.log('pre top_21_info_latency');
                console.log('top_21_providers.length', top_21_providers.length);

                let map_protocol_latency_thresholds = {
                    http: 800,
                    https: 1200
                }


                //let top_21_info_latency = await eos_info.get_providers_info_latency(top_21_providers, map_protocol_latency_thresholds);


                //console.log('top_21_info_latency', top_21_info_latency);
                // Some will have delays.
                //throw 'stop';



                // Too many requests at once?

                let next_42_info_latency = await eos_info.get_providers_info_latency(next_42_providers, map_protocol_latency_thresholds);
                console.log('next_42_info_latency', next_42_info_latency);

                // Latency filter... 
                let filtered_sub_bp_endpoints = eos_info.latency_filter(next_42_info_latency);


                //console.log('filtered_sub_bp_endpoints', filtered_sub_bp_endpoints);

                let map_filtered_http = {};
                //each(filtered_sub_bp_endpoints.http, x => map_filtered_http[x[0]] = [x[1], x[2]]);
                each(filtered_sub_bp_endpoints.http, x => map_filtered_http[x[0]] = x[1]);
                //console.log('map_filtered_http', map_filtered_http);
                let map_endpoint_delays = {};
                let max_delay = 0;

                each(next_42_info_latency, info => {
                    //console.log('info', info);
                    let [delay, info2] = info;
                    if (delay > max_delay) max_delay = delay;
                    let [name, endpoint_nodes] = info2;

                    map_endpoint_delays[name] = delay;
                });

                console.log('map_endpoint_delays', map_endpoint_delays);

                //throw 'stop';

                let max_http_hbn = -1;

                let map_endpoint_hbns = {};
                each(map_filtered_http, (info, name) => {
                    map_endpoint_hbns[name] = info.head_block_num;
                    // compensate for the delay as well.
                    //  it would have advanced a bit.
                    let delay_compensation = (max_delay - map_endpoint_delays[name]) / 500;
                    let comp_hbn = delay_compensation + info.head_block_num;
                    if (comp_hbn > max_http_hbn) max_http_hbn = comp_hbn;

                });

                micro_sim.head_block_num = max_http_hbn;
                // Block results cache?
                //  Allow comparisons....
                // on pulse...
                console.log('map_endpoint_hbns', map_endpoint_hbns);
                console.log('max_http_hbn', max_http_hbn);

                let map_endpoint_hbn_behind = {};

                each(map_endpoint_hbns, (hbn, name) => {
                    // compensate the ones that were not delayed.
                    let delay_compensation = (max_delay - map_endpoint_delays[name]) / 500;
                    //let delay_compensation = 0;
                    map_endpoint_hbn_behind[name] = max_http_hbn - hbn - delay_compensation;
                });
                // Need to account for the delays that were in the HTTP requests.

                console.log('map_endpoint_hbn_behind', map_endpoint_hbn_behind);

                let blocks_behind_threshold = 3;

                let map_http_endpoints_matching_thresholds = {};
                each(map_endpoint_hbn_behind, (behind, name) => {
                    console.log('behind', behind);
                    if (behind <= blocks_behind_threshold) {
                        map_http_endpoints_matching_thresholds[name] = map_filtered_http[name];
                    }
                });

                //throw 'stop';
                console.log('map_http_endpoints_matching_thresholds l', Object.entries(map_http_endpoints_matching_thresholds).length);
                console.log('Object.keys(map_http_endpoints_matching_thresholds)', Object.keys(map_http_endpoints_matching_thresholds));
                let sub_bp_names = Object.keys(map_http_endpoints_matching_thresholds);
                // have these going on a sequence.
                let num_racing_requests = 5;
                let i = 0;
                let pool_size = sub_bp_names.length;
                let map_blocks_received = {};

                micro_sim.on('pulse', e_pulse => {
                    //console.log('e_pulse', e_pulse);

                    // Can the pulse get ahead?
                    //  The micro-sim could do a bit more to keep its pulse checked.
                    //  The micro-sim could make some requests too, but should be fed data.





                    let wide_hbn = e_pulse.wide_hbn;
                    let retry_count = 0;
                    let attempt_dl = () => {
                        (async () => {
                            // go through the list 4 at a time.
                            // who to distribute it too.
                            let req_ep_indexes = [];
                            let c = 0;
                            while (c < num_racing_requests) {
                                req_ep_indexes.push(i);
                                i++;
                                if (i === pool_size) {
                                    i = 0;
                                }
                                c++;
                            }
                            req_ep_indexes = shuffle(req_ep_indexes);
                            //console.log('req_ep_indexes', req_ep_indexes);
                            let req_endpoint_names = req_ep_indexes.map(x => sub_bp_names[x]);
                            //console.log('req_endpoint_names', req_endpoint_names);
                            let endpoints = req_endpoint_names.map(x => map_top_100[x]);
                            //console.log('endpoints', endpoints);
                            map_blocks_received[wide_hbn] = 'pending';
                            try {
                                let block = await eos_info.dist_get_block(endpoints, wide_hbn);
                                //console.log('block', block);
                                map_blocks_received[wide_hbn] = block;
                                let attempt_raise = () => {
                                    if (map_blocks_received[wide_hbn - 1] === 'pending') {
                                        setTimeout(attempt_raise, 20);
                                    } else {
                                        micro_sim.feed_block(block);
                                        this.raise('block', block);
                                    }
                                }
                                attempt_raise();
                            } catch (err) {
                                retry_count++;
                                console.log('wide_hbn retry_count', wide_hbn, retry_count);
                                attempt_dl();
                            }

                        })();
                    }
                    attempt_dl();
                })
            }
            nm_endpoints_scan();

        })();
    }



    // want an overall polling frequency.
    // maximum polling frequency per block provider.

    lowest_latency_nodes(i_num) {
        let lati = this.latency_info;
        let res = [];
        for (let c = 0; c < i_num; c++) {
            res.push(this.map_connections_by_endpoints[lati[c][0]]);
        }
        return res;
    }


    block(i_num) {
        if (is_array(i_num)) {
            // get the latencies too.
            //return Promise.all(i_num.map(n => this.block(n)));

            throw 'NYI';
            // Maybe don't use


        } else {

            // Have a process to be sure to get every block.
            //  
            // Intelligently request from the block producer first.
            //  


            //return this.connections[0].block(i_num);
            let res, rbc;

            // parallel_post
            //  and post to the lowest latency servers.

            // choose 1/2 at random from the lowest 10 latency servers.



            // 10 too much, and then that block function should repeat attempts if it fails.
            // Want something like a random selection of those lowest latency nodes.

        }
    }

    network_monitor_table() {
        // https://api.eosnetworkmonitor.io/api/v1/table

    }

    endpoint_get_block_header_state(str_endpoint, block_num) {
        return this.endpoint_http_post(str_endpoint, '/v1/chain/get_block_header_state', {
            "block_num_or_id": block_num
        })
    }

    get http_history() {
        console.log('this.req_diag_log', this.req_diag_log);
        return this.req_diag_log.toArray();
    }

}


// bp.json file for any block producer says where their api endpoints are


// finding producer account names from the blockchain?



if (require.main === module) {
    // this module was run directly from the command line as in node xxx.js
    (async () => {
        // minimist for command line args
        const eos_live = new EOS_Live_Hunter();
        eos_live.on('block', block => {
            console.log('block.block_num', block.block_num);
        });
    })();
} else {
    // this module was not run directly from the command line and probably loaded by something else
}

module.exports = EOS_Live_Hunter;