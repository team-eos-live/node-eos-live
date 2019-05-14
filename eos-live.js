/*
    0.0.2 - Hunter algorithm.

    Secondary version of this would be written on a much higher level.

    

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

//  Will get the eos-live object to raise events for eos blocks
//  Probably using 'next' or next, {block:...}

// Downloding observables with extra observable metadata will be very useful.
//  Will have very useful features that will allow functions to be written that pass them around.

// multi(ofn 1, ofn 2)


// find_api(extract_url(?._), '/v1/table')

// functions that return multiple pieces of data at different stages
//  metadata about the main data
//  timestamps for downloading
//  timestamps at proportions complete
//  current / latest proportion complete


//const EventEmitter = require('events');

// https://api.eosnetworkmonitor.io/api/v1/table
// https://api.dev04.cryptolions.io/api/v1/table
//  Would be a very good map of endpoints.

const eos_info = require('./eos-info');

const EOS_Blockchain_Microsim = require('./eos-chain-microsim');

// Wants to provide both the output and the metadata




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

// Maintaining a small cache of eos network data would be very useful.

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

// also observer function / object / pattern

// something that consumes an observable's data
// multi-observer


// Could make it larger still.
//  Store logged info on every http request that takes place
//  Or limit the size of observable logs.

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


// Some type of unstable info object?
// Updating info object?


class Updating_Info extends Evented_Class {
    constructor(spec) {
        spec = spec || {};
        super(spec);
        this._ = {};
    }
    set(key, value) {
        this._[key] = value;
        this.raise('change', {
            key: key,
            value: value
        });
    }
}


//console.log('pre eos live class');


// Why not make EOS_Live an observable?
//  it will have its built in logging.

// Logs shouldn't get infinitely big.



class EOS_Live extends Evented_Class {

    // Nice if eos-live were to log its own events.


    // Want to change this to use the 'discover-data' module.

    // Then can use similar / easy syntax to get the data going back in history.
    //  Or starting from the beginning.


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

        // Tell the microsim who the block producers are.

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

        // Improve the data analysis capability.
        //  Http logging
        //  Make it so it takes more measurements of latency of data.
        //   

        // Get started automatically in terms of keeping / getting in sync with block timings.
        //  More within the constructor too.
        (async () => {

            let nm_endpoints_scan = async () => {
                //console.log('nm_endpoints_scan');
                // https://api.dev04.cryptolions.io/api/v1/table
                // 'https://api.eosnetworkmonitor.io/api/v1/table'
                //let tbl = await eos_info.get_network_table();
                // eos_info will need to hold more of its own info.

                // get tiered providers info


                // Endpoint discovery
                // Use discover-data-sources
                //  That will have tools for order and latency.

                // Distributed HTTP get


                //console.log('pre t get_top_providers_info');

                //let t = await eos_info.get_top_providers_info();

                //console.log('pre get_top_providers_info');

                // Caching of top providers info would be useful.

                let {
                    top_21_providers,
                    next_84_providers,
                    map_names_to_endpoints,
                    top_180_providers
                } = await eos_info.get_top_providers_info();

                //console.log('!!', !!top_21_providers);

                // raise an eos-live event
                //  or a log event.

                // Would be interesting to store the whole eos-live log in ram
                //  alternatively to store the most recent 64k log items or something like that
                //  allow streaming of eos-live log?
                //  downloading of?
                //  downloading of, with authentication?

                // for the moment, this 'log' data will be data relevant to the rest of the app.
                //  then decide if it's OK to serve it.



                
                // top 63
                ///let top_63_providers = top_100.slice(0, 63);
                let map_top_180 = {};
                each(top_180_providers, provider => {
                    map_top_180[provider.name] = provider;
                })
                //let map_top_100 = top_100_providers.map(x => x.name);
                // Will try all at once.
                //let top_63_info_latency = eos_info.info_latency()
                //console.log('pre top_21_info_latency');
                //console.log('top_21_providers.length', top_21_providers.length);
                //console.log('top_21_providers', top_21_providers);

                let top_21_providers_sorted_by_name = clone(top_21_providers).sort(function compare( a, b ) {
                    if ( a.name < b.name ){
                      return -1;
                    }
                    if ( a.name > b.name ){
                      return 1;
                    }
                    return 0;
                  })
                //console.log('top_21_providers_sorted_by_name', top_21_providers_sorted_by_name);
                let top_21_providers_sorted_names = top_21_providers_sorted_by_name.map(a => a.name);
                //console.log('top_21_providers_sorted_names', top_21_providers_sorted_names);
                micro_sim.top_21_providers_sorted_names = top_21_providers_sorted_names;
                //throw 'stop';


                // Different tiers
                // Sub 100 ms
                // 
                // Or get from 2nd tier...
                let map_protocol_latency_thresholds = {
                    http: 2000,
                    https: 2000
                }

                // Function to take measurement of each

                //let http_tiers = [100, 475, 900];
                //let tiered_http_endpoints = [[], [], []];


                // Getting the high tiers of latency and attempting to include one or two of the lowest latency endpoints would be nice.

                //let top_21_info_latency = await eos_info.get_providers_info_latency(top_21_providers, map_protocol_latency_thresholds);
                //console.log('top_21_info_latency', top_21_info_latency);
                // Some will have delays.
                //throw 'stop';
                // Too many requests at once?
                let next_84_info_latency = await eos_info.get_providers_info_latency(next_84_providers, map_protocol_latency_thresholds);
                // Get the latencies, but don't threshold low ere.

                //console.log('next_42_info_latency', next_42_info_latency);
                // Latency filter... 
                let filtered_sub_bp_endpoints = eos_info.latency_filter(next_84_info_latency);

                //console.log('filtered_sub_bp_endpoints.length', filtered_sub_bp_endpoints.length);

                let map_filtered_http = {};
                //each(filtered_sub_bp_endpoints.http, x => map_filtered_http[x[0]] = [x[1], x[2]]);
                each(filtered_sub_bp_endpoints.http, x => map_filtered_http[x[0]] = x[1]);
                //console.log('map_filtered_http', map_filtered_http);
                let map_endpoint_delays = {};
                let max_delay = -1;
                each(next_84_info_latency, info => {
                    //console.log('info', info);
                    let [delay, info2] = info;
                    if (delay > max_delay) max_delay = delay;

                    // put it into tiers....


                    let [name, endpoint_nodes] = info2;
                    map_endpoint_delays[name] = delay;
                });
                //console.log('map_endpoint_delays', map_endpoint_delays);
                //throw 'stop';
                let max_http_hbn = -1;
                let map_endpoint_hbns = {};
                each(map_filtered_http, (info, name) => {
                    map_endpoint_hbns[name] = info.head_block_num;
                    // compensate for the delay as well.
                    //  it would have advanced a bit.
                    let delay_compensation = Math.round((max_delay - map_endpoint_delays[name]) / 500);
                    let comp_hbn = delay_compensation + info.head_block_num;
                    if (comp_hbn > max_http_hbn) max_http_hbn = comp_hbn;
                });
                // Start ahead, then introduce necessary delays and retries.
                //micro_sim.head_block_num = max_http_hbn + 1;
                //micro_sim.head_block_num = max_http_hbn - 1;
                micro_sim.head_block_num = max_http_hbn;
                // Block results cache?
                //  Allow comparisons....
                // on pulse...
                //console.log('map_endpoint_hbns', map_endpoint_hbns);
                //console.log('max_http_hbn', max_http_hbn);
                let map_endpoint_hbn_behind = {};
                each(map_endpoint_hbns, (hbn, name) => {
                    // compensate the ones that were not delayed.
                    let delay_compensation = Math.round((max_delay - map_endpoint_delays[name]) / 500);
                    //let delay_compensation = 0;
                    map_endpoint_hbn_behind[name] = max_http_hbn - hbn - delay_compensation;
                });
                // Need to account for the delays that were in the HTTP requests.
                //console.log('map_endpoint_hbn_behind', map_endpoint_hbn_behind);
                let blocks_behind_threshold = 4;
                let map_http_endpoints_matching_thresholds = {};
                each(map_endpoint_hbn_behind, (behind, name) => {
                    //console.log('behind', behind);
                    if (behind <= blocks_behind_threshold) {
                        map_http_endpoints_matching_thresholds[name] = map_filtered_http[name];
                    };
                });
                //throw 'stop';
                //console.log('map_http_endpoints_matching_thresholds l', Object.entries(map_http_endpoints_matching_thresholds).length);
                //console.log('Object.keys(map_http_endpoints_matching_thresholds)', Object.keys(map_http_endpoints_matching_thresholds));
                let sub_bp_names = Object.keys(map_http_endpoints_matching_thresholds);
                // have these going on a sequence.
                let num_racing_requests = 4;
                //EventEmitter.defaultMaxListeners = 24;
                let i = 0;
                
                let pool_size = sub_bp_names.length;

                let map_blocks_received = {};
                let map_blocks_got = {};

                micro_sim.on('pulse', e_pulse => {
                    //console.log('!!e_pulse', !!e_pulse);

                    // Want to have the predicted BP within the pulse data

                    // Want to generate metadata showing what has been downloaded and with what latency / success from the system.

                    // use a data downloader that profides a performance analysis / metadata object.
                    // The pulse event could have a number of expected block producer endpoints that would have it first.

                    let delayed = 0;
                    // Can the pulse get ahead?
                    //  The micro-sim could do a bit more to keep its pulse checked.
                    //  The micro-sim could make some requests too, but should be fed data.
                    // get_block_from_sub_bps
                    let wide_hbn = e_pulse.wide_hbn;
                    //console.log('wide_hbn', wide_hbn);
                    let retry_count = 0;
                    map_blocks_received[wide_hbn] = map_blocks_received[wide_hbn] || 'pending';
                    let attempt_dl = (wide_hbn) => {

                        if (!map_blocks_got[wide_hbn]) {
                            (async () => {
                                // Alternator

                                //console.log('attempt_dl wide_hbn', wide_hbn);
                                // go through the list 4 at a time.
                                // who to distribute it too.

                                // worth checking the predicted block producers



                                let endpoint_index_selection = () => {
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
                                    return req_ep_indexes;
                                }

                                let endpoint_selection = () => {
                                    let req_ep_indexes = endpoint_index_selection();
                                    //console.log('req_ep_indexes', req_ep_indexes);
                                    req_ep_indexes = shuffle(req_ep_indexes);
                                    //
                                    let req_endpoint_names = shuffle(req_ep_indexes.map(x => sub_bp_names[x]));
                                    //console.log('req_endpoint_names', req_endpoint_names);
                                    let endpoints = req_endpoint_names.map(x => map_top_180[x]);
                                    return endpoints;
                                }

                                let endpoints = endpoint_selection();

                                //console.log('endpoints', endpoints);
                                //console.log('wide_hbn', wide_hbn);

                                try {

                                    // on second attempt use the second tier endpoints?

                                    // or third attempt and onwards.
                                    //  giving the primary endpoints a rest.

                                    let block;
                                    if (delayed === 0) {
                                        block = await eos_info.dist_get_block(endpoints, wide_hbn, 4000);
                                    } else {
                                        block = await eos_info.dist_get_block(endpoints, wide_hbn, 4000);
                                    }

                                    //let 

                                    //console.log('block', block);
                                    //console.log('wide_hbn', wide_hbn);
                                    //console.log('map_blocks_received[wide_hbn]', map_blocks_received[wide_hbn]);

                                    //micro_sim.feed_block(block);
                                    //this.raise('block', block);


                                    let attempt_raise = (wide_hbn, block) => {
                                        if (map_blocks_received[wide_hbn - 1] === 'pending') {
                                            setTimeout(() => {
                                                attempt_raise(wide_hbn, block);
                                            }, 25);
                                        } else {
                                            //if (!(map_blocks_received[wide_hbn] === true)) {
                                            if (!map_blocks_got[wide_hbn]) {
                                                map_blocks_got[wide_hbn] = true
                                                map_blocks_received[wide_hbn] = true;
                                                micro_sim.feed_block(block);
                                                this.raise('block', block);
                                            }
                                        }
                                    }
                                    attempt_raise(wide_hbn, block);
                                } catch (err) {
                                    // delay the micro-sim pulse for 0.25s
                                    // try 0.5s delay - only 1 delay introduced.

                                    console.log('failed get wide_hbn', wide_hbn, err);

                                    if (delayed < 1) {
                                        if (delayed < 10) micro_sim.delay_pulse(300);
                                    } else {
                                        if (delayed < 10) micro_sim.delay_pulse(1000);
                                    }
                                    
                                    delayed++;
                                    retry_count++;
                                    //console.log('wide_hbn retry_count', wide_hbn, retry_count);
                                    setTimeout(() => {
                                        attempt_dl(wide_hbn);
                                    }, 125 + (delayed * 125));
                                }
                            })();
                        }
                    }
                    attempt_dl(wide_hbn);
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


    /*

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
    */

    endpoint_get_block_header_state(str_endpoint, block_num) {
        return this.endpoint_http_post(str_endpoint, '/v1/chain/get_block_header_state', {
            "block_num_or_id": block_num
        })
    }

    get http_history() {

        // History of all HTTP requests.

        //console.log('this.req_diag_log', this.req_diag_log);
        return this.req_diag_log.toArray();
    }

}


// bp.json file for any block producer says where their api endpoints are
// finding producer account names from the blockchain?

// Need a utility to save to the database.
// eos-live-save
//   connects it up to a database


// save_eos_data
//  saves the data into a simple database.

//  saves to disk
//  could save as json

// maybe want some kind of functional data pipeline

// Want to use basic-cms for the website.
//  Should set up postgres on a local network machine to try it out.
//  Want to get the eos-live website up and running with managed content.


if (require.main === module) {

    // Want to get history blocks too.
    // Get blocks going back to 1


    // EOS_Live_History

    // Or use a numbered API to get specific blocks.

    // this module was run directly from the command line as in node xxx.js
    (async () => {
        // minimist for command line args
        const eos_live = new EOS_Live();
        //console.log('EOS_Live obj created');

        // would be nice to be able to view eos-live log events.



        eos_live.on('block', block => {
            console.log('eos-live event: got block.block_num', block.block_num);

            const s_block = JSON.stringify(block);
            console.log('s_block.length', s_block.length);
            console.log('block.transactions.length', block.transactions.length);

        });
    })();
} else {
    // this module was not run directly from the command line and probably loaded by something else
}

module.exports = EOS_Live;