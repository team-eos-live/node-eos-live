const lang = require('./lang-mini');
const fnl = require('./fnl');
const oext = require('./obext');
const request = require("./request");
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
    each
} = lang;
const {
    prom,
    obs
} = fnl;

//const NTPClient = require('@destinationstransfers/ntp');
// 
//"@destinationstransfers/ntp": "^1.1.0",
// should I use raw HTTP rather than the request module?
//  That would help get the timings of when headers are received vs when the completed document is received.

const p_request = promisify(request);
const p_post = promisify(request.post);

let default_api_endpoints = ["https://api.eossweden.se", "https://api.eosdublin.io", "http://api.hkeos.com", "https://api.eosnewyork.io", 'https://node1.zbeos.com',
    "https://node2.eosphere.io", "http://peer2.eoshuobipool.com:8181",
    "http://mainnet.eoscalgary.io:80", "https://node2.liquideos.com:8883", "https://nodes.eos42.io", "https://api.eoslaomao.com", "http://eos-bp.bitfinex.com:8888",
    "https://mainnet.libertyblock.io:7777", "https://api.jeda.one", "http://peer1.eoshuobipool.com:8181", "https://mainnet.eoscannon.io", "https://node.eosflare.io",
    "https://api.eosgeneva.io", "https://api1.eosasia.one", "https://api.bitmars.one", "https://mainnet1.eoscochain.io", "https://publicapi-mainnet.eosauthority.com",
    "http://api-mainnet.starteos.io", "http://api-mainnet1.starteos.io", "https://eos.unlimitedeos.com:9999", "http://api.eostribe.io", "https://api.eosstore.co", "http://api.bp.antpool.com",
    "https://mainnet.meet.one", "https://eosapi.nodepacific.com", "https://api.cypherglass.com", "https://api.eosargentina.io", "https://mars.fn.eosbixin.com", "https://eu.eosdac.io",
    "https://api.eosrio.io", "https://api.eosbeijing.one", "https://api.eostitan.com", "https://rpc.eosys.io",
    "https://api.oraclechain.io", "http://api.eos.wiki:38888", "https://mainnet.genereos.io", "https://node1.eosphere.io", "https://api.proxy1a.sheos.org",
    "https://bp.eosvolga.one", "https://api.main.alohaeos.com", "https://eosapi.blockmatrix.network", "https://api.eosdetroit.io", "https://bp.eosnigeria.io:8899", "http://bp.eos.vote:8888",
    "http://api.mainnet.eos.eosgermany.online:8888"
];

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
  
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


default_api_endpoints = shuffle(default_api_endpoints);




// 0.0.1.1
//  Much less polling to find the times of the latest blocks.
//  We know a block comes in 500ms after the previous.
// 

// Need some more performance / reliability improvements so that it 

// https://api.eosdetroit.io:443

var CircularBuffer = require("./circular-buffer");

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

// would be nice to keep a record of failed and suceeded requests.

class EOS_Live_Node extends Evented_Class {
    constructor(spec) {
        super(spec);
        // api_endpoint

        this.api_endpoint = spec.api_endpoint;
        this.ms_min_polling = spec.ms_min_polling;
        this.last_block_info_num = -1;
        //console.log('1) this.last_block_info_num', this.last_block_info_num);
        this._pending_blocks = {};

        prop(this, 'timeout', 2000);
        prop(this, 'chain_head_block_num', -1);

        // Connect to single EOS node?
        //  Multiple nodes to connect to, maintain multiple EOS_Live_Node objects.
        // Could use a single EOS_Live_Node for the moment.
        // measured latencies
        let repairing = false;
        this.error_count = 0;

        this.on('error', err => {
            this.error_count++;

            let {
                code
            } = err;

            let repair = () => {
                repairing = true;

                console.log('ERROR - REPAIR EOS_Live_Node error api_endpoint', this.api_endpoint);
                //console.log('this.has_error', this.has_error);

                if (this.has_error) {
                    let c = 1,
                        delay_factor = 60000;

                    // Timout random factor 

                    let base_timeout = 10000;
                    let timeout = 60000;

                    // 12 * 800




                    let base_ms_timeout_err_500 = 12 * 800;
                    //let timeout_500 = 10000;
                    //let 

                    if (code === 500) {
                        let process_fix = (timeout = 0) => {
                            setTimeout(async () => {
                                let fixed = await this.attempt_repair();
                                //console.log('fixed', fixed);

                                if (fixed) {
                                    this.has_error = false;
                                    console.log('EOS node repaired', this.api_endpoint);
                                    repairing = false;
                                    this.raise('repaired');
                                } else {
                                    process_fix();
                                }
                            }, (timeout));
                        }
                        process_fix(base_ms_timeout_err_500);
                    } else {
                        let process_fix = (timeout = 60000) => {
                            setTimeout(async () => {
                                let fixed = await this.attempt_repair();
                                //console.log('fixed', fixed);

                                if (fixed) {
                                    this.has_error = false;
                                    console.log('EOS node repaired', this.api_endpoint);
                                    repairing = false;
                                    this.raise('repaired');
                                } else {
                                    process_fix();
                                }
                            }, (timeout * Math.random()) + base_timeout);
                        }
                        process_fix(timeout);
                    }
                }
            }

            if (!repairing) {
                repair();
            }
            // then attempt repair.
            //  for it to be successfully repaired, it must undergo a bit of a repair test.
            // then raise a repaired event.
            //  
        });
        this.latencies = {};
    }
    async attempt_repair() {
        // try to download an info item
        // then try to download the latest block.
        try {
            let info = await this.info;
            //console.log('attempt_repair info', info);
            let num = info.data.head_block_num;
            //let block = await this.block(num);
            return true;
        } catch (err) {
            return false;
        }
    }
    http_post(path, data = '') {
        //console.log('this.last_block_info_num', this.last_block_info_num);
        // {form:{key:'value'}}

        // Make it not try to post while it has an error?
        //console.log('http_post path', path);
        //console.trace();

        return prom(async (solve, jettison) => {
            let url = liburl.resolve(this.api_endpoint, path);
            let res_req;
            let t_pre = Date.now();

            //console.log('this.timeout', this.timeout);
            if (data) {

                try {
                    res_req = await p_post(url, {
                        body: JSON.stringify(data),
                        timeout: this.timeout
                    });
                } catch (err) {
                    jettison(err);
                }
            } else {
                try {
                    res_req = await p_post(url, {
                        body: '',
                        timeout: this.timeout
                    });
                } catch (err) {
                    jettison(err);
                }
            }
            let t_post = Date.now();
            let latency = t_post - t_pre;
            //console.log('res_req', res_req);

            if (res_req) {

                let {
                    statusCode,
                    statusMessage,
                    headers,
                    body
                } = res_req;
                //console.log('statusCode', statusCode);
                //console.log('statusMessage', statusMessage);
                //console.log('url', url);

                this.raise('http_request', {
                    'url': url,
                    'method': 'POST',
                    'latency': latency,
                    'statusCode': statusCode,
                    'statusMessage': statusMessage
                });

                if (statusCode === 200) {
                    //console.log('statusCode', statusCode);
                    //console.log('statusMessage', statusMessage);
                    //console.log('api_endpoint', this.api_endpoint);
                    //console.log('body' ,body);
                    let data = JSON.parse(body);
                    //console.log('data', data);

                    solve({
                        'data': data,
                        'latency': latency
                    });
                    //solve(data);
                } else {
                    //console.log('http_post ERROR: res_req', res_req);

                    console.log('statusCode', statusCode);
                    console.log('statusMessage', statusMessage);
                    console.log('api_endpoint', this.api_endpoint);

                    //console.trace();

                    this.has_error = true;
                    this.error_code = statusCode;

                    // raise an error event.
                    // or change to has_error
                    // then be able to fix it somewhat later.

                    this.raise('error', {
                        'api_endpoint': this.api_endpoint,
                        'path': path,
                        'code': statusCode,
                        'message': statusMessage,
                        'method': 'POST'
                    });

                    // too many requests, we could consider ourselves banned?
                    //  or temporary ban.
                    // cooldown.

                    //jettison(res_req);
                    jettison(new Error('HTTP POST request failure'));
                }
            } else {
                jettison(new Error('HTTP POST request failure'));
            }
            //console.log('Object.keys(res_req)', Object.keys(res_req));
            // response
        });
    }

    http_get(path) {
        //console.log('this.last_block_info_num', this.last_block_info_num);
        return prom(async (solve, jettison) => {
            let url = liburl.resolve(this.api_endpoint, path);

            let t_pre = Date.now();

            let res_req = await p_request(url, {
                timeout: this.timeout
            });
            let t_post = Date.now();
            let latency = t_post - t_pre;
            //console.log('res_req', res_req);
            //console.log('Object.keys(res_req)', Object.keys(res_req));

            let {
                statusCode,
                statusMessage,
                headers,
                body
            } = res_req;
            //console.log('statusCode', statusCode);
            //console.log('statusMessage', statusMessage);
            //console.log('url', url);

            if (statusCode === 200) {
                //console.log('200: latency', latency);
                let data = JSON.parse(body);
                solve({
                    'data': data,
                    'latency': latency
                });
            } else {

                console.log('statusCode', statusCode);
                console.log('statusMessage', statusMessage);
                console.log('url', url);
                this.has_error = true;

                this.raise('error', {
                    'api_endpoint': this.api_endpoint,
                    'path': path,
                    'code': statusCode,
                    'message': statusMessage,
                    'method': 'GET'
                });
                // a different error object.
                jettison(new Error('HTTP GET request failure'));
                //jettison(res_req);
            }
            // response
        });
    }

    // Double attempt with each
    block(i_num) {
        if (is_array(i_num)) {
            // Error handling in these though?
            return Promise.all(i_num.map(n => this.block(n)));
        } else {
            if (this._pending_blocks[i_num] instanceof Promise) {
                return this._pending_blocks[i_num];
            } else {
                // But if the HTTP post fails here.
                // this.has_error = true;

                return prom(async (solve, jettison) => {

                    if (this.has_error) {

                        jettison(new Error('EOS_Live_Node already is erroring'));
                    } else {
                        try {
                            //console.log('pre get block post');

                            // Should retry once...
                            let p = this.http_post('v1/chain/get_block', {
                                "block_num_or_id": i_num
                            });

                            this._pending_blocks[i_num] = p;
                            let res = await p;
                            //let {data, latency} = await p;
                            delete this._pending_blocks[i_num];
                            //console.log('block res', res);
                            solve(res);
                        } catch (err) {

                            try {
                                //console.log('pre get block post');
                                // Should retry once...

                                let p = this.http_post('v1/chain/get_block', {
                                    "block_num_or_id": i_num
                                });

                                this._pending_blocks[i_num] = p;
                                let res = await p;
                                //let {data, latency} = await p;
                                delete this._pending_blocks[i_num];
                                //console.log('block res', res);
                                solve(res);
                            } catch (err) {
                                //jettison(err);
                                //console.log('err', err);
                                console.log('ERROR block this.api_endpoint', this.api_endpoint);
                                //console.log('statusCode', statusCode);
                                //console.log('statusMessage', statusMessage);
                                //console.log('url', url);
                                this.has_error = true;
                                this.raise('error', err);
                                // a different error object.

                                //console.trace();

                                jettison(new Error('HTTP POST request failure'));
                            }
                        }
                    }
                });
            }
        }
    }

    get info() {
        //(async() => {
        //    let 
        //})();

        // get_info
        //console.log('this.last_block_info_num', this.last_block_info_num);

        return this.http_post('v1/chain/get_info');

        // and send back latency info
    }

    poll_info(ms_interval) {
        if (ms_interval) {
            if (ms_interval < this.ms_min_polling) {
                throw 'Invalid polling interval (too low)' + ms_interval;
            }
        } else {
            ms_interval = this.ms_min_polling;
        }

        //console.log('*** this.last_block_info_num', this.last_block_info_num);

        return obs((next, complete, error) => {
            let that = this;
            let interval;

            let latencies_buffer = new CircularBuffer(10);
            const do_poll = async () => {

                try {

                    let {
                        data,
                        latency
                    } = await this.info;
                    //console.log('* info', info);

                    //console.log('[data, latency]', [data, latency]);

                    latencies_buffer.enq(latency);

                    let arr = latencies_buffer.toarray();

                    let sum = arr.reduce((a, b) => a + b);
                    let avg = sum / arr.length;

                    //console.log('latencies_buffer.toarray()', latencies_buffer.toarray());
                    //console.log('avg latency', avg, this.api_endpoint);

                    this.latencies.info = avg;

                    let {
                        head_block_num
                    } = data;
                    //console.log('head_block_num', head_block_num);

                    //console.log('that.last_block_info_num', that.last_block_info_num);

                    if (head_block_num > that.last_block_info_num) {
                        that.last_block_info_num = head_block_num;
                        //console.log('info', info);
                        next(data);

                    }
                } catch (err) {
                    //console.log('err', err);

                    //console.log('poll error on endpoint ' + this.api_endpoint);
                    //console.trace();
                    // error is the message itself...

                    clearInterval(interval);
                    error(err);

                }
                //return prom(async (solve, jettison) => {
                //})
            }
            do_poll();
            interval = setInterval(do_poll, ms_interval);

            return [];
        });
    }

    poll_head_block_num(ms_interval) {
        return obs((next, complete, error) => {

            if (ms_interval) {
                if (ms_interval < this.ms_min_polling) {
                    throw 'Invalid polling interval (too low)' + ms_interval;
                }
            } else {
                ms_interval = this.ms_min_polling;
            }

            let obs_info = this.poll_info(ms_interval);

            obs_info.on('next', data => {
                let {
                    head_block_num
                } = data;
                this.raise('change', {
                    'name': 'head_block_num',
                    'value': head_block_num
                });
                next(head_block_num);
            });
            obs_info.on('error', err => {
                console.log('poll_head_block_num obs_info err', err);

                this.has_error = true;


                error(err);
            })
            return [];
        })
    }


    _poll_blocks(ms_interval) {

        // get the distributed poll headers.

        return obs((next, complete, error) => {
            let obs_poll_info = this.poll_head_block_num(ms_interval);

            let prev_latest_head_block_num = -1;

            obs_poll_info.on('next', async latest_head_block_num => {
                //console.log('latest_head_block_num', latest_head_block_num);

                let intervening_block_nums = [];
                if (prev_latest_head_block_num > -1) {
                    for (let b = prev_latest_head_block_num + 1; b <= latest_head_block_num; b++) {
                        intervening_block_nums.push(b);
                    }
                    //console.log('intervening_block_nums', intervening_block_nums);
                    prev_latest_head_block_num = latest_head_block_num;
                    let intervening_blocks = await this.block(intervening_block_nums);
                    //console.log('intervening_blocks', intervening_blocks);
                    //console.log('intervening_blocks.length', intervening_blocks.length);
                    //each(intervening_blocks, ib => console.log('ib.transactions.length', ib.transactions.length));
                    each(intervening_blocks, ib => next(ib));
                } else {
                    prev_latest_head_block_num = latest_head_block_num;
                    let latest_block = await this.block(latest_head_block_num);
                    next(latest_block);
                    //console.log('latest_block', latest_block);
                    //console.log('latest_block.transactions.length', latest_block.transactions.length);
                }
            });
            // obs_poll_info.error?
            return [];
        })
    }

    poll_blocks(ms_interval) {

        // get the distributed poll headers.

        return obs((next, complete, error) => {
            //let obs_poll_info = this.poll_head_block_num(ms_interval);

            //let prev_latest_head_block_num = -1;

            // get the lastest block.

            // be able to tell this the latest block number

            //let intervening_blocks = await this.block(intervening_block_nums);

            // dont try to get the intervening blocks any longer

            (async () => {


                // only 


                try {
                    // does not catch up when behind though.


                    // need to try until success

                    //  



                    let latest_block = await this.block(this.chain_head_block_num);
                    //console.log('latest_block', latest_block);
                    next(latest_block.data);

                    setInterval(async () => {
                        //console.log('this.chain_head_block_num', this.chain_head_block_num);

                        // only do the poll if its not in an error state.

                        if (!this.has_error) {
                            try {
                                let latest_block = await this.block(this.chain_head_block_num);
                                //console.log('!!latest_block', !!latest_block);
                                next(latest_block.data);
                            } catch (err) {

                                //console.log('err', err);
                            }
                        }




                    }, ms_interval)

                } catch (err) {

                    //console.log('err', err);
                }

                // then on interval, get that latest one


            })();


            /*

            obs_poll_info.on('next', async latest_head_block_num => {
                //console.log('latest_head_block_num', latest_head_block_num);

                let intervening_block_nums = [];
                if (prev_latest_head_block_num > -1) {
                    for (let b = prev_latest_head_block_num + 1; b <= latest_head_block_num; b++) {
                        intervening_block_nums.push(b);
                    }
                    //console.log('intervening_block_nums', intervening_block_nums);
                    prev_latest_head_block_num = latest_head_block_num;
                    let intervening_blocks = await this.block(intervening_block_nums);
                    //console.log('intervening_blocks', intervening_blocks);
                    //console.log('intervening_blocks.length', intervening_blocks.length);
                    //each(intervening_blocks, ib => console.log('ib.transactions.length', ib.transactions.length));
                    each(intervening_blocks, ib => next(ib));
                } else {
                    prev_latest_head_block_num = latest_head_block_num;
                    let latest_block = await this.block(latest_head_block_num);
                    next(latest_block);
                    //console.log('latest_block', latest_block);
                    //console.log('latest_block.transactions.length', latest_block.transactions.length);
                }
            });

            */
            // obs_poll_info.error?
            return [];
        })
    }

    /*
    stream() {
        return obs((next, complete, error) => {
            // use websocket connection?

            var options = {
                method: 'POST',
                url: liburl.resolve(this.api_endpoint, 'v1/net/connect')
            };
            request(options, function (error, response, body) {
                if (error) throw new Error(error);

                console.log('response', response);
                console.log('Object.keys(response)', Object.keys(response));

                console.log('body', body);
            });
            return [];
        })
    }
    */
}


class EOS_Live extends Evented_Class {
    constructor(spec) {
        spec = spec || {};
        super(spec);

        // Connect to single EOS node?
        //  Multiple nodes to connect to, maintain multiple EOS_Live_Node objects.

        // Could use a single EOS_Live_Node for the moment.

        let connections = this.connections = [];
        let mcbe = this.map_connections_by_endpoints = {};
        this.ms_min_endpoint_polling = 500;

        // then filter into faster and slower connections.

        // three connection tiers
        //  the top connections with the fastest results
        //  others which are working OK
        //  those which are too slow (or errors)

        // best_connections
        // middle_tier_connections
        // worst_connections
        // broken_connections
        // banned_connections


        // this.performance_mode = 'low' / 'high'
        //  eos live node timeout   4000   2000
        //  



        // low performance
        //  only 4 to 9 nodes within speed criteria



        /*

        this.tier_ms_requirements = [
            ['best', 25],
            ['middle', 180],
            ['slow', 400]
        ]
        */

        // Finding the difference between local time and server time.

        this.tier_ms_requirements = {
            'best': 36,
            'middle': 180,
            'slow': 600
        };
        let req_diag_log = this.req_diag_log = new Last_Requests_Diagnostic_Log();

        this.map_blocks_are_received = {};
        this.num_last_block_received = -1;


        //let [best_connections, middle_tier_connections, slow_connections, too_slow_connections, broken_connections, banned_from_connections] = this.connection_tiers = [[], [], [], [], [], []];

        // best connections under 25 ms

        //  or higher cutoff point.

        // then once we have these worked out, we can only query the top ones to get the latest blockchain numbers and data, to get the best latency.
        // middle tier could be used more to download older / more historic data.
        //  not as necessary for real-time or almost real-time.


        (async () => {
            // Liely best to ignore ntp for the oment.

            // Getting the latest times from the blocks.

            // Repeat on the fastest connections every 0.5s

            let ntp_test = async () => {
                let ms_d0 = Date.now();

                const ntp_date = await NTPClient.getNetworkTime({
                    timeout: 10000, // timeout in ms, default is 10sec
                    //server: 'time.google.com', // ntp server address
                    server: 'time.windows.com', // ntp server address
                    port: 123, // NTP server port
                })

                console.log('ntp_date', ntp_date);

                //let d = new Date(ntp_date);
                //console.log('d', d);

                let ms_d = ntp_date.getTime();
                let ms_now = Date.now();
                let ms_diff = ms_d0 - ms_d;

                console.log('ms_d0', ms_d0);
                console.log('ms_d', ms_d);
                console.log('ms_diff', ms_diff);

                throw 'stop';
            }

            let api_endpoints = spec.api_endpoints;

            let start_all_endpoints = () => {
                each(api_endpoints || default_api_endpoints, api_endpoint => {
                    let new_node = new EOS_Live_Node({
                        'api_endpoint': api_endpoint,
                        'ms_min_polling': this.ms_min_endpoint_polling
                    });
                    mcbe[api_endpoint] = new_node;
                    new_node.on('http_request', req => {
                        req_diag_log.log(req);
                    });
                    connections.push(new_node);
                });

                setImmediate(() => {
                    this.raise('ready');
                })
            }
            start_all_endpoints();

            // Then do the analysis on the latencies / speed.
            //  Want to try pinging each of them twice a second.

            // The proxy endpoint may be very useful too.

        })();
    }

    time_predictive_stream() {
        console.log('time_predictive_stream');
        let eos_live = this;
        return obs((next, complete, error) => {

            let requested = {},
                received = {};
            let prev_block_num = -1;
            //let last_handled_contig = -1;
            let processed = {};

            let send_block = block => {
                //console.log('send_block', block.block_num);

                if (prev_block_num === -1) {
                    processed[block.block_num] = true;
                    next(block);
                } else {

                    let attempt_send = () => {
                        if (processed[block.block_num - 1]) {
                            processed[block.block_num] = true;
                            //console.log('sending block.block_num', block.block_num);
                            next(block);
                        } else {
                            setTimeout(attempt_send, 75);
                        }
                    }
                    attempt_send();
                }
            }

            let hblock = async block => {
                // needs another layer of filtering.
                //  don't release a block until the previous ones have been released.

                let block_num = block.block_num;
                this.map_blocks_are_received[block_num] = true;


                if (block_num > this.num_last_block_received && this.num_last_block_received > -1) {

                    // can notice a diff here... but it could be too late.

                }
                this.num_last_block_received = block_num;



                requested[block_num] = true;
                //console.log('block_num', block_num);

                if (received[block_num] === true) {

                } else {
                    received[block_num] = true;
                    if (block_num > prev_block_num) {
                        // work out how many more.
                        if (prev_block_num > -1) {
                            let diff = block_num - prev_block_num;
                            //console.log('diff', diff);
                            if (diff > 1) {
                                // download the rest
                                // missing on receiving a block. ???
                                let missing = [];
                                for (let c = prev_block_num; c < block_num; c++) {
                                    if (!requested[c]) missing.push(c);
                                    requested[c] = true;
                                }
                                // Better to collect missing blocks as the time advances.
                                // Block_Timer could be a useful class to make.

                                // Would be better to use a very different method overall.
                                //  Catch up elsewhere.


                                console.log('[after later block received], old blocks missing', missing);

                                // get the missing blocks... by firing them off
                                // get these blocks quickly...
                                // however, a different one could have got that original block by now.
                                let r_missing = await eos_live.block(missing);
                                // by now
                                let missing_blocks = (r_missing).map(x => x.data);
                                //console.log('missing_blocks.length', missing_blocks.length);

                                each(missing_blocks, mb => {
                                    //raise(block);
                                    //this.raise('new_block', mb);
                                    send_block(mb);
                                });
                                //this.raise('new_block', block);
                                //raise(block);
                                send_block(block);
                                each(eos_live.fastest_connections, fconn => {
                                    if (block_num + 1 > fconn.chain_head_block_num) {
                                        // work out which blocks are missing.
                                        //  here - before the system does its polling.

                                        fconn.chain_head_block_num = block_num + 1;
                                    } else {

                                    }
                                });
                            } else {
                                //this.raise('new_block', block);
                                //raise(block);
                                send_block(block);
                                each(eos_live.fastest_connections, fconn => {
                                    if (block_num + 1 > fconn.chain_head_block_num) {
                                        // work out which blocks are missing.
                                        fconn.chain_head_block_num = block_num + 1;
                                    } else {

                                    }
                                });
                            }
                        } else {
                            //this.raise('new_block', block);
                            send_block(block);
                            //raise(block);
                            each(eos_live.fastest_connections, fconn => {

                                if (block_num + 1 > fconn.chain_head_block_num) {
                                    // work out which blocks are missing.
                                    fconn.chain_head_block_num = block_num + 1;
                                } else {}

                            });
                        }
                        prev_block_num = block_num;
                    }
                }
                // a buffer of 7ttt
                //console.log('eos_live.fastest_connections.length', eos_live.fastest_connections.length);
                // then get the next block num soon.
            }

            let fastest_endpoints = [];
            //  fastest for themselves to get EOS blocks.

            let using_fastest_endpoints = async () => {
                console.log('pre get info');
                let info = await this.info_latency_test();

                // map which server has which head block num
                // map latencies?
                //console.log('info', info);

                this.latency_info = info;
                this.ms_latency_info_set = Date.now();

                // a autosorted list would help.
                //  that would be Collection or B+ tree.

                let max_block_num = -1;
                let map_item_block_nums = {};

                let arr_addr_lats = [];
                let map_addr_lats = {};
                let arr_addr_low_lats = [];

                //const ms_low_lat = 250;

                // not exactly low.
                //  500 could be considered low.
                //  just want fast enough for frequent polling of where we think the block should be.
                //const ms_low_lat = 1800;

                const ms_low_lat = 2600;

                let lastest_low_lat;
                let low_lat_head_block_number = -1;

                each(info, item => {
                    //console.log('item', item);
                    let [addr, latency, obj] = item;
                    arr_addr_lats.push([addr, latency]);
                    map_addr_lats[addr] = latency;

                    if (obj) {
                        let data = obj.data;
                        //console.log('data', data);

                        //map_item_block_nums[addr] = {};

                        let head_block_num = data.head_block_num;
                        let hbn_addr;


                        if (head_block_num > max_block_num) {
                            max_block_num = head_block_num;
                            //map_item_block_nums[addr][head_block_num] = 
                            hbn_addr = addr;
                        } else {

                        }

                        if (latency <= ms_low_lat) {
                            arr_addr_low_lats.push([item, head_block_num]);
                            if (head_block_num > low_lat_head_block_number) {
                                low_lat_head_block_number = head_block_num;
                                lastest_low_lat = [item, head_block_num];
                            }
                        }
                        map_item_block_nums[head_block_num] = map_item_block_nums[head_block_num] || {};
                        map_item_block_nums[head_block_num][addr] = data;
                    }
                });

                //console.log('map_item_block_nums[max_block_num]', map_item_block_nums[max_block_num]);
                //console.log('map_item_block_nums[max_block_num - 1]', map_item_block_nums[max_block_num - 1]);
                //console.log('map_item_block_nums[max_block_num - 2]', map_item_block_nums[max_block_num - 2]);

                // Scan to see how far behind various ones are.

                // Likely best to use the very newest.

                /*
                let first_bps = Object.entries(map_item_block_nums[max_block_num]);
                let second_bps, third_bps;
                if (map_item_block_nums[max_block_num - 1]) {
                    second_bps = Object.entries(map_item_block_nums[max_block_num - 1]);
                }
                if (map_item_block_nums[max_block_num - 2]) {
                    third_bps = Object.entries(map_item_block_nums[max_block_num - 2]);
                }
                */

                let nth_addrs = [];

                //let third_bps = Object.entries(map_item_block_nums[max_block_num - 2]);

                //console.log('first_bps.length', first_bps.length);
                //console.log('second_bps.length', second_bps.length);
                //console.log('third_bps.length', third_bps.length);

                //console.log('first_bps', first_bps);

                //let first_addrs = first_bps.map(x => [x[0], map_addr_lats[x[0]]]);
                //let second_addrs = second_bps.map(x => [x[0], map_addr_lats[x[0]]]);
                //let third_addrs = third_bps.map(x => [x[0], map_addr_lats[x[0]]]);

                //console.log('first_addrs', first_addrs);

                //console.log('second_addrs', second_addrs);
                //console.log('third_addrs', third_addrs);

                for (let c = 0; c < 5; c++) {
                    if (map_item_block_nums[max_block_num - c]) {
                        nth_addrs[c] = [Object.entries(map_item_block_nums[max_block_num - c]).map(x => [x[0], map_addr_lats[x[0]]])];
                        if (c <= 5) {
                            //fastest_endpoints = fastest_endpoints.concat(nth_addrs[c]);
                            each(nth_addrs[c], ep => each(ep, ep2 => fastest_endpoints.push(ep2[0])));
                        }
                    } else {
                        nth_addrs[c] = [];
                    }
                    //console.log('nth_addrs[c].length', c, nth_addrs[c].length);
                }
                console.log('nth_addrs', nth_addrs);
                console.log('arr_addr_low_lats', arr_addr_low_lats);
                console.log('nth_addrs', nth_addrs);
                //console.log('nth_addrs[0]', nth_addrs[0]);
                //console.log('nth_addrs[1]', nth_addrs[1]);
                console.log('lastest_low_lat', lastest_low_lat);
                // then get the exact time date.

                let lll_data = lastest_low_lat[0][2].data;
                console.log('lll_data', lll_data);
                let s_hbt = lll_data.head_block_time + 'Z';

                // first received block time
                //  then we can use time offsets to work out where it should be.
                // and catch-up blocks too...

                let hbt = new Date(s_hbt);
                //console.log('hbt', hbt);
                let ms_hbt = hbt.getTime();
                //console.log('ms_hbt', ms_hbt);

                let ms_now = Date.now();
                let ms_block_behind_system = ms_now - ms_hbt;
                console.log('ms_block_behind_system', ms_block_behind_system);

                let ms_started = Date.now();
                let hbn_start = max_block_num;

                console.log('fastest_endpoints', fastest_endpoints);
                // then assign these ones as being the ones to run the queries from

                let fastest_connections = shuffle(fastest_endpoints).map(x => this.map_connections_by_endpoints[x]);
                console.log('fastest_connections.length', fastest_connections.length);

                if (fastest_connections.length < 4) {
                    //this.performance_mode = 'low'
                    throw 'Requires at least 4 medium or low latency connections. Currently available: ' + fastest_connections.length;

                } else if (fastest_connections.length < 10) {
                    this.performance_mode = 'low';

                    each(this.connections, conn => {
                        conn.timeout = 4000;
                    });

                } else {
                    this.performance_mode = 'high';
                }

                let delay_per_endpoint = 800;

                let ms_poll_staggering = delay_per_endpoint / fastest_connections.length;
                if (this.performance_mode === 'low') {
                    ms_poll_staggering = 125;
                }
                
                this.fastest_connections = fastest_connections;
                    let latest_head_block_num = -1;
                    let prev_head_block_num = -1;

                    each(fastest_connections, (fc, i) => {
                        // poll each of them every 0.8s for the latest blocks.
                        fc.chain_head_block_num = low_lat_head_block_number;
                        // but stagger the starts
                        setTimeout(() => {
                            //let obs_fc = fc.poll_blocks(380);
                            //let obs_fc = fc.poll_blocks(1600);
                            // Hammer the servers much less

                            // Before it does any HTTP get requests, it would be nice to have back blocks that have not been polled or have not been received.

                            let obs_fc = fc.poll_blocks(delay_per_endpoint);

                            // and then poll for the latest some time later on
                            obs_fc.on('next', block_data => {
                                //console.log('block_data', block_data);
                                if (latest_head_block_num > -1) {
                                    if (block_data.block_num > latest_head_block_num) {
                                        latest_head_block_num = block_data.block_num

                                        //console.log('latest_head_block_num', latest_head_block_num);
                                        // work out where it should be...

                                        let ms_now = Date.now();
                                        let ms_running = ms_now - ms_started;
                                        //console.log('ms_running', ms_running);

                                        let projected_block_progress = Math.floor(ms_running / 500);
                                        //console.log('projected_block_progress', projected_block_progress);
                                        // projected block number
                                        let projected_block_num = hbn_start + projected_block_progress;

                                        let num_blocks_behind_head = 4;

                                        projected_block_num = projected_block_num - num_blocks_behind_head;
                                        // could have a lesser timed block target... make it 0.5s easier and slower.
                                        //console.log('projected_block_num', projected_block_num);
                                        // then if this gets ahead, we need to catch up.
                                        let projected_blocks_behind = projected_block_num - latest_head_block_num;

                                        // Can still get behind.
                                        // Preemptive getting in all cases would be best.
                                        //  eos-live-hunter
                                        //   eos-live implemented with a different algorithm.

                                        //console.log('projected_blocks_behind', projected_blocks_behind);
                                        // need to catch up with the blocks.

                                        // This would be a better place to catch up.

                                        // Map received...
                                        // This would be the time to get the missing ones.

                                        // and the latest that has been received...

                                        if (projected_blocks_behind > 0) {
                                            // update the nodes to the newest head.
                                            // also get the data from some othes.
                                            // doing catch up here would help too.
                                            // get the missing ones before the result comes in.
                                            // Ask all of the fastest connections to attempt to get these missing blocks.
                                            // Or maybe just1/2 of them.
                                            // have it so the nodes work out which are missing?
                                            // And get them before the next ones come in.
                                            each(fastest_connections, fconn => {
                                                fconn.chain_head_block_num = projected_block_num;
                                            });
                                        }
                                        //let block_num_diff = latest_head_block_num - block_data.block_num;
                                        //console.log('block_num_diff', block_num_diff);
                                    } else {

                                    }
                                    //this.raise('block', block_data);
                                    hblock(block_data);
                                } else {
                                    //console.log('block_data.block_num', block_data.block_num);
                                    latest_head_block_num = block_data.block_num;
                                    //this.raise('block', block_data);
                                    hblock(block_data);
                                }
                                if (prev_head_block_num > -1) {
                                    // diff
                                }
                            })
                        }, i * ms_poll_staggering);
                        // and then start polling based on that latest block number
                    });
            }
            using_fastest_endpoints();
            return [];
        })
    }

    /*
    get_top_n_endpoints(n) {

        // test by blocktimes?

    }
    */
    // get the info 4 times a second....

    get info() {
        // get_info

        // get the info shared between different connections
        return this.connections[0].info;
    }

    poll_info(ms_interval) {
        // poll multiple connections.
        return this.connections[0].poll_info(ms_interval);
    }

    get random_connection() {
        let i = Math.floor(Math.random() * this.connections.length);
        //console.log('1) i', i);
        //console.log('this.connections.length', this.connections.length);
        // if the connection has an error, select again...
        let c = this.connections[i];
        while (c.has_error) {
            c = this.random_connection;
        }
        return c;
    }

    get random_best_connection() {

        if (this.connection_tiers) {
            let [best_connections, middle_tier_connections, slow_connections, too_slow_connections, broken_connections, banned_from_connections] = this.connection_tiers;
            //console.log('best_connections.length', best_connections.length);
            if (best_connections.length > 0) {
                let i = Math.floor(Math.random() * best_connections.length);
                //console.log('2) i', i);
                let c = best_connections[i];
                while (c.has_error) {
                    c = this.random_best_connection;
                }
                //let c = best_connections[i];
                return c;
            } else {
                return this.random_connection;
            }

        } else {
            return this.random_connection;
        }
    }

    get random_good_connection() {
        if (this.connection_tiers) {
            let [best_connections, middle_tier_connections, slow_connections, too_slow_connections, broken_connections, banned_from_connections] = this.connection_tiers;
            //console.log('best_connections.length', best_connections.length);
            //console.log('middle_tier_connections.length', middle_tier_connections.length);
            let conns = best_connections.concat(middle_tier_connections);
            //console.log('mid+ conns.length', conns.length);
            if (conns.length > 0) {
                let i = Math.floor(Math.random() * conns.length);
                //console.log('2) i', i);
                let c = conns[i];
                while (c.has_error) {
                    c = this.random_good_connection;
                }
                //let c = best_connections[i];
                return c;
            } else {
                return this.random_connection;
            }

        } else {
            return this.random_connection;
        }
    }

    // can make use of slow connections too

    get random_usable_connection() {
        if (this.connection_tiers) {
            let [best_connections, middle_tier_connections, slow_connections, too_slow_connections, broken_connections, banned_from_connections] = this.connection_tiers;
            //console.log('best_connections.length', best_connections.length);
            //console.log('middle_tier_connections.length', middle_tier_connections.length);

            let best_mid_conns = best_connections.concat(middle_tier_connections);
            let conns;
            if (best_mid_conns.length >= 5) {
                conns = best_mid_conns;
            } else {
                conns = best_connections.concat(middle_tier_connections, slow_connections);
            }
            //let 
            //console.log('mid+ conns.length', conns.length);

            if (conns.length > 0) {
                let i = Math.floor(Math.random() * conns.length);
                //console.log('2) i', i);

                let c = conns[i];
                while (c.has_error) {
                    c = this.random_good_connection;
                }
                //let c = best_connections[i];
                return c;
            } else {
                return this.random_connection;
            }

        } else {
            return this.random_connection;
        }
    }


    // want an overall polling frequency.
    // maximum polling frequency per block provider.

    assign_connection_tiers() {
        let [best_connections, middle_tier_connections, slow_connections, too_slow_connections, broken_connections, banned_from_connections] = this.connection_tiers || [
            [],
            [],
            [],
            [],
            [],
            []
        ];

        [best_connections, middle_tier_connections, slow_connections, too_slow_connections, broken_connections, banned_from_connections] = this.connection_tiers = [
            [],
            [],
            [],
            [],
            //broken_connections || [], banned_from_connections || []
            [],
            []
        ];

        let tr = this.tier_ms_requirements;
        each(this.connections, conn => {
            //console.log('conn.latencies', conn.latencies);

            if (conn.has_error) {

                if (conn.error_code === 429) {
                    banned_from_connections.push(conn);
                } else {
                    broken_connections.push(conn);
                }

            } else {
                let ms_info_latency = Math.round(conn.latencies.info);
                //console.log('ms_info_latency', ms_info_latency);
                //console.log('tr.best', tr.best);

                if (ms_info_latency <= tr.best) {
                    best_connections.push(conn);
                } else if (ms_info_latency <= tr.middle) {
                    middle_tier_connections.push(conn);
                } else if (ms_info_latency <= tr.slow) {
                    slow_connections.push(conn);
                } else {
                    too_slow_connections.push(conn);
                }
            }
            //console.log(conn.api_endpoint.padEnd(64), Math.round(conn.latencies.info));
        })
    }


    poll_head_block_num(ms_interval) {


        // split between different nodes.

        // that interval per node.
        //  staggered throughout that interval.

        // interval per endpoint.

        // want to do the polling with a specified delay.


        return obs((next, complete, error) => {

            let ms_staggering = ms_interval / this.connections.length;
            let hbn = -1;

            each(this.connections, (connection, c) => {
                let delay = ms_staggering * c;
                setTimeout(() => {

                    let obs_conn_hb = connection.poll_head_block_num(ms_interval);
                    obs_conn_hb.on('next', ohbn => {
                        //console.log('ohbn', ohbn);

                        // Observe the average latencies of each of them.

                        if (ohbn > hbn) {
                            hbn = ohbn;
                            next(hbn);
                        }

                    });

                }, delay);
                //console.log('delay', delay);
            });

            let process_latencies = () => {

                /*

                each(this.connections, conn => {
                    //console.log('conn.latencies', conn.latencies);
                    console.log(conn.api_endpoint.padEnd(64), Math.round(conn.latencies.info));
                })
                */

                this.assign_connection_tiers();
                //console.log('this.connection_tiers', this.connection_tiers);

                let [best_connections, middle_tier_connections, slow_connections, too_slow_connections, broken_connections, banned_from_connections] = this.connection_tiers;

                let log_connection_tiers = () => {
                    console.log('best_connections.length', best_connections.length);
                    console.log('middle_tier_connections.length', middle_tier_connections.length);
                    console.log('slow_connections.length', slow_connections.length);
                    console.log('too_slow_connections.length', too_slow_connections.length);
                    console.log('broken_connections.length', broken_connections.length);
                    console.log('banned_from_connections.length', banned_from_connections.length);
                }
                //log_connection_tiers();


                this.raise('change', {
                    'name': 'connection_tiers',
                    'value': this.connection_tiers
                })
            }
            setInterval(process_latencies, 5000);
            return [];
        });


        // Poll between them, and spread the timings
        //  Combine the results

        //return this.connections[0].poll_head_block_num(ms_interval);
    }

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
            return Promise.all(i_num.map(n => this.block(n)));
        } else {
            //return this.connections[0].block(i_num);
            let res, rbc;

            // parallel_post
            //  and post to the lowest latency servers.

            // choose 1/2 at random from the lowest 10 latency servers.

            let raceToSuccess = (promises) => {
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

            // 10 too much, and then that block function should repeat attempts if it fails.

            // Want something like a random selection of those lowest latency nodes.


            let num_parallel_attempts = 4;
            if (this.performance_mode === 'low') {
                num_parallel_attempts = 3;
            }
            let llns = this.lowest_latency_nodes(num_parallel_attempts);
            //console.log('llns', llns);
            return raceToSuccess(llns.map(enode => enode.block(i_num)));

            //let lati = this.latency_info;
            //console.log('lati', lati);

            let random_attempts_then_give_up = () => {
                return prom(async (solve, jettison) => {
                    try {
                        rbc = this.random_best_connection;
                        //rbc = this.random_usable_connection;
                        // random_usable_connection
                        //console.log('!!rbc', !!rbc);
                        res = await rbc.block(i_num);
                    } catch (err) {
                        try {
                            rbc = this.random_good_connection;
    
                            //rbc = this.random_usable_connection;
                            // random_usable_connection
                            //console.log('!!rbc', !!rbc);
                            res = await rbc.block(i_num);
    
                        } catch (err) {
    
                            // repeat it.
                            rbc = this.random_good_connection;
                            //rbc = this.random_usable_connection;
                            //console.log('!!rbc', !!rbc);
                            res = await rbc.block(i_num);
                            jettison(err);
                            //console.log('REPEATING - failed random best connection get block');
                        }
                        // repeat it.
    
                        //console.log('REPEATING - failed random best connection get block');
                    }
                    //return res;
                    solve(res);
                })
            }
            // random_good_connection

            //(async() => {

            //})();
        }
    }

    poll_blocks(ms_interval) {

        // Optionally download from multiple, for redundency.

        // distributed poll blocks

        // want to just poll the blocks coming from the best / top connections.

        // poll the head block num

        // call the distributed get block function that gets a block (with one of the top tier providers chosen at random).

        // Performance mode:
        //  fast - from top tier providers, fallback to middle tier.
        //    or fast mode is not available unless there is a top tier node available.
        //  wide - from top and middle tier providers

        return obs((next, complete, error) => {
            let prev_head_block_num = -1;
            let map_block_nums_already_returned = {};

            let obs_block_number = this.poll_head_block_num(ms_interval);
            obs_block_number.on('next', async head_block_num => {
                //console.log('head_block_num', head_block_num);
                // the block num diffs
                let intervening_block_nums = [];
                if (prev_head_block_num > -1) {
                    let diff = head_block_num - prev_head_block_num;
                    //console.log('diff', diff);
                    for (let b = prev_head_block_num + 1; b <= head_block_num; b++) {
                        intervening_block_nums.push(b);
                    }
                } else {
                    intervening_block_nums.push(head_block_num);
                }
                //console.log('intervening_block_nums', intervening_block_nums);
                // then get those intervening blocks.
                try {
                    //console.log('pre bwl');
                    let blocks_with_latencies = await this.block(intervening_block_nums);
                    //console.log('blocks_with_latencies', blocks_with_latencies);
                    let blocks = blocks_with_latencies.map(x => x.data);
                    //console.log('blocks', blocks);
                    //console.log('blocks.length', blocks.length);
                    each(blocks, block => {
                        if (!map_block_nums_already_returned[block.block_num]) {
                            map_block_nums_already_returned[block.block_num] = true;
                            // wait until all previous blocks up to that have been done.
                            let potentially_next = (block) => {
                                if (map_block_nums_already_returned[block.block_num - 1]) {
                                    next(block);
                                } else {
                                    setTimeout(() => {
                                        potentially_next(block);
                                    }, 10);
                                }
                            }
                            potentially_next(block);
                        }
                    });
                    prev_head_block_num = head_block_num;

                } catch (err) {
                    //console.log('not throwing err', err);
                    // The error was with a node connection.
                    //  Could get that node connection to fix itself and make a test.
                    //console.trace();
                }
                //let head_block = this.
            })

            return [];
        });

        //return this.connections[0].poll_blocks(ms_interval);
    }

    async info_latency_test(arr_endpoints) {
        // get the info from every block producer

        // with a specified delay for starting?
        //  certain number in parallel?

        // Promises with a delay?

        // Doing set number of parallel processing is useful.

        // staggering by 100 ms start would help.

        arr_endpoints = arr_endpoints || this.connections.map(x => x.api_endpoint);

        // Maybe connections have not been set up.
        //  May want to do the latentency checks just using the api endpoints.

        console.log('info_latency_test');
        const p_delay = (ms) => {
            return prom((solve, jettison) => {
                setTimeout(() => {
                    solve();
                }, ms)
            })
        }

        let c = 0;
        let delay_factor = 120;

        // time out while getting the connection info.
        // can set a timeout parameter on the node.

        return (await Promise.all(this.connections.map(async conn => {
            await p_delay(delay_factor * c++);

            try {
                let ci = await conn.info;
                let res = (ci).latency;
                return [conn.api_endpoint, res, ci];
            } catch (err) {
                return [conn.api_endpoint, err];
            }
        }))).sort((a, b) => a[1] < b[1] ? -1 : 1);

        //console.log('infos', infos);
    }

    get http_history() {
        console.log('this.req_diag_log', this.req_diag_log);
        return this.req_diag_log.toArray();
    }

    // Doesn't seem to worth with proper streaming and the full connection API.
    stream() {

        console.log('stream');


        /*

        return obs((next, complete, error) => {
            (async () => {


            })();
            return [];
        })

        */

        return this.time_predictive_stream();




        // Need more advanced stream.

        //  Want to get latencies along with the block info too.



        // Getting better logged errors and service disruptions could make the most sense.

        // Timing anticipation seems very important.

        // An overhaul to this seems important.
        //  Polling to get blocks seems effective.

        // However, one request to a very low latency server, coupled with time correlation will help a lot with this.

        // Synchronised timing mode downloading looks to be the most effective.
        //  Maybe best to leave for version 2.0

        // Command line options look to be the best
        //  Include features that better allow command line diagnostics.


        // Optionally download from multiple, for redundency.

        // distributed poll blocks

        // want to just poll the blocks coming from the best / top connections.

        // poll the head block num

        // call the distributed get block function that gets a block (with one of the top tier providers chosen at random).

        // more intelligent system - know the timings, and be able to anticipate when to make the requests for the new block.


        // request sent time
        //  block timestamp
        //   response received time.


        // offset from req sent time to the block timestamp.
        //  send future block requests on that same time sync.

        // Performance mode:
        //  fast - from top tier providers, fallback to middle tier.
        //    or fast mode is not available unless there is a top tier node available.
        //  wide - from top and middle tier providers

        // Use polling to provide a stream

        //return this.poll_blocks(1000);

        /*

        return obs((next, complete, error) => {

            (async() => {
                let latencies = await this.info_latency_test();
                console.log('latencies', latencies);

                // open up streams to the lowest latency BPs.

                let fastest_node = this.map_connections_by_endpoints[latencies[2][0]];
                console.log('fastest_node', fastest_node);

                let obs_fastest_stream = fastest_node.stream();
                obs_fastest_stream.on('next', data => {
                    console.log('fastest stream data', data);
                });

            })();

            return [];
        });

        */

        //return this.connections[0].poll_blocks(ms_interval);
    }

}


// bp.json file for any block producer says where their api endpoints are


// finding producer account names from the blockchain?



if (require.main === module) {
    // this module was run directly from the command line as in node xxx.js
    (async () => {

        // minimist for command line args



        const eos_live = new EOS_Live({
            //'api_endpoints': ['https://api.eosdetroit.io:443']
            // 
            // https://node1.zbeos.com
            //'api_endpoints': ['https://publicapi-mainnet.eosauthority.com']

            // https://node.eosflare.io/bp.json

            // https://eossweden.org/bp.json

            // "https://api.eosdublin.io"
            // http://api1.eosdublin.io:80

            // splitting the requests between them will be fine.
            //  could load further endpoints, possibly.

            // https://eos.greymass.com:443
            // https://api.eosnewyork.io

            // https://api.eosio.cr:80
            // http://api.hkeos.com:80

            // "https://mainnet.eosamsterdam.net"

            // "https://eos.greymass.com:443", <= not working properly for me.

            // Seems broken. "https://api.bp.fish",

            'api_endpoints': ["https://api.eossweden.se", "https://api.eosdublin.io", "http://api.hkeos.com", "https://api.eosnewyork.io", 'https://node1.zbeos.com',
                "https://node2.eosphere.io", "http://peer2.eoshuobipool.com:8181",
                "http://mainnet.eoscalgary.io:80", "https://node2.liquideos.com:8883", "https://node1.eosphere.io", "https://nodes.eos42.io", "https://api.eoslaomao.com", "http://eos-bp.bitfinex.com:8888",
                "https://mainnet.libertyblock.io:7777", "https://api.jeda.one", "http://peer1.eoshuobipool.com:8181", "https://mainnet.eoscannon.io", "https://node.eosflare.io",
                "https://api.eosgeneva.io", "https://api1.eosasia.one", "https://api.bitmars.one", "https://mainnet1.eoscochain.io", "https://publicapi-mainnet.eosauthority.com",
                "http://api-mainnet.starteos.io", "http://api-mainnet1.starteos.io", "https://eos.unlimitedeos.com:9999", "http://api.eostribe.io", "https://api.eosstore.co", "http://api.bp.antpool.com",
                "https://mainnet.meet.one", "https://eosapi.nodepacific.com", "https://api.cypherglass.com", "https://api.eosargentina.io", "https://mars.fn.eosbixin.com", "https://eu.eosdac.io",
                "https://api.eosrio.io", "https://api.eosbeijing.one", "http://peer1.eoshuobipool.com:8181", "https://api.eostitan.com", "https://rpc.eosys.io",
                "https://api.oraclechain.io", "http://api.eos.wiki:38888", "https://mainnet.genereos.io", "https://node1.eosphere.io", "https://api.main.alohaeos.com", "https://api.proxy1a.sheos.org",
                "https://bp.eosvolga.one", "https://api.main.alohaeos.com", "https://eosapi.blockmatrix.network", "https://api.eosdetroit.io", "https://bp.eosnigeria.io:8899", "http://bp.eos.vote:8888",
                "http://api.mainnet.eos.eosgermany.online:8888"
            ],

            '_api_endpoints': ["https://api.eossweden.se", "https://api1.eosasia.one", "http://eos-bp.bitfinex.com:8888", "https://api.eosgeneva.io", "http://mainnet.eoscalgary.io:80"]

        });
        console.log('!!eos_live', !!eos_live);

        let prev_block_num = -1;
        let requested = {};
        let released = {};
        let received = {};

        /*
        let raise = block => {
            let bn = block.block_num;
            console.log('bn', bn);
            // if the previous one has been requested but not released...

            let release = () => {
                if (requested[bn - 1] &&! released[bn - 1]) {
                    // timeout to try to raise it in the future.
                    released[bn] = true;
                    eos_live.raise('new_block', block);
                } else {
                    // Wait for that block to arrive.
                    // wait a little while, then release if poss
                    setTimeout(release, 100);
                }
            }
            release();
        }
        */

        let stream_blockchain = () => {
            console.log('stream_blockchain');
            let obs_stream = eos_live.stream();
            obs_stream.on('next', block => {
                //console.log('block', block);
                console.log('block.block_num', block.block_num);
            })

        }
        stream_blockchain();

        /*
        eos_live.on('new_block', new_block => {
            //console.log('eas live new_block', new_block);
            let block_num = new_block.block_num;
            console.log('new block_num', block_num);
            //console.trace();

            //console.log('eos_live.fastest_connections.length', eos_live.fastest_connections.length);
            // then get the next block num soon.
        });
        */

        eos_live.on('_ready', () => {

            console.log('eos live ready');


            // /db_size/get

            //let info = await eos_live.info;
            //console.log('info', info);

            // wizboxsender

            let view_block_actors = (block) => {
                const data = block;
                each(data.transactions, tr => {
                    //console.log('tr.trx', tr.trx);
                    //console.log('Object.keys(tr.trx)', Object.keys(tr.trx));
                    //console.log('typeof tr.trx', typeof (tr.trx));

                    if (typeof tr.trx === 'object') {
                        //console.log('Object.keys(tr.trx)', Object.keys(tr.trx));
                    }

                    if (tr.trx.transaction) {

                        let action_actors = [];
                        let map_action_actors = {};

                        //console.log('tr.trx.transaction.actions', tr.trx.transaction.actions);
                        //console.log('Object.keys(tr.trx.transaction)', Object.keys(tr.trx.transaction));

                        //console.log('(tr.trx.transaction.actions.length)', (tr.trx.transaction.actions.length));

                        each(tr.trx.transaction.actions, action => {
                            //console.log('action:', action);

                            if (action.authorization) {
                                each(action.authorization, auth => {
                                    action_actors.push(auth.actor);
                                    map_action_actors[auth.actor] = true;
                                })
                            };
                        });

                        console.log('action_actors', action_actors);

                        if (map_action_actors['wizboxsender']) {
                            console.log('tr', tr);
                            console.log('tr.trx.transaction.actions', tr.trx.transaction.actions);
                            console.log('tr.trx.transaction.actions[0].data', tr.trx.transaction.actions[0].data);

                            if (tr.trx.transaction.actions[0].data.trx) {
                                console.log('tr.trx.transaction.actions[0].data.trx.actions', tr.trx.transaction.actions[0].data.trx.actions);
                            }
                            //console.log('tr.trx.transaction.actions[0].data.trx.actions', tr.trx.transaction.actions[0].data.trx.actions);
                        }
                    }
                })
            }

            let observe_block_actors = () => {
                let obs_blocks = eos_live.poll_blocks(1000);
                obs_blocks.on('next', data => {
                    //console.log('obs_blocks data', data);
                    //console.log('Object.keys(obs_blocks data)', Object.keys(data));
                    //console.log('obs_blocks data.trx', data.trx);
                    view_block_actors(data);
                });

                eos_live.on('change', e_change => {
                    let {
                        name,
                        value
                    } = e_change;
                    if (name === 'connection_tiers') {
                        // connection tiers changed.

                        // restart the polling?
                        //  change the delays for some of those items?

                    }
                })
            }
            //observe_block_actors();

            let observe_block_numbers = () => {
                let obs_blocks = eos_live.poll_blocks(1000);
                obs_blocks.on('next', data => {
                    //console.log('obs_blocks data', data);

                    let {
                        block_num
                    } = data;

                    console.log('block_num', block_num);
                    //console.log('Object.keys(obs_blocks data)', Object.keys(data));
                    //console.log('obs_blocks data.trx', data.trx);
                    //view_block_actors(data);
                });

                eos_live.on('change', e_change => {
                    let {
                        name,
                        value
                    } = e_change;
                    if (name === 'connection_tiers') {
                        // connection tiers changed.

                        //console.log('e_change', e_change);

                        let {
                            name
                        } = e_change;

                        // connection_tiers

                        if (name === 'connection_tiers') {
                            // a change to the connection tiers.

                        }

                        // restart the polling?
                        //  change the delays for some of those items?

                    }
                })
            }
            //observe_block_numbers();

            let observe_block_producers = () => {
                let obs_blocks = eos_live.poll_blocks(1000);
                obs_blocks.on('next', data => {
                    //console.log('obs_blocks data', data);
                    //console.log('obs_blocks Object.keys(data)', Object.keys(data));
                    console.log('block_num', data.block_num);
                    console.log('obs_blocks data.producer', data.producer);
                    console.log('obs_blocks data.producer_signature', data.producer_signature);
                    console.log('');
                    //console.log('obs_blocks data.new_producers', data.new_producers);

                    // producer_signature


                    let {
                        block_num
                    } = data;

                    //console.log('Object.keys(obs_blocks data)', Object.keys(data));
                    //console.log('obs_blocks data.trx', data.trx);
                    //view_block_actors(data);
                });

                eos_live.on('change', e_change => {
                    let {
                        name,
                        value
                    } = e_change;
                    if (name === 'connection_tiers') {
                        // connection tiers changed.
                        //console.log('e_change', e_change);

                        let {
                            name
                        } = e_change;

                        // connection_tiers

                        if (name === 'connection_tiers') {
                            // a change to the connection tiers.

                        }

                        // restart the polling?
                        //  change the delays for some of those items?

                    }
                })
            }
            //observe_block_producers();

            // different type of polling.
            //  block download in response to block number polling.


            // does not work


            let observe_dist_block_numbers = () => {
                let obs_numbers = eos_live.poll_head_block_num(1000);
                obs_numbers.on('next', data => {
                    console.log('obs_numbers data', data);
                })
            }
            //observe_dist_block_numbers();


            let latancy_check = async () => {
                let ltc = await eos_live.info_latency_test();
                console.log('ltc', ltc);
            }
            //latancy_check();



            /*
            let obs_eos = eos_live.subscribe();
            obs_eos.on('next', data => {
                console.log('data', data);
            });
            */
        })



    })();
} else {
    // this module was not run directly from the command line and probably loaded by something else
}

module.exports = EOS_Live;