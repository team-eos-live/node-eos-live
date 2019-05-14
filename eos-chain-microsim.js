const {
    Evented_Class,
    each,
    clone,
    arrayify
} = require('lang-mini');


const {
    prop,
    field
} = require('obext');

const keys = Object.keys;
var CircularBuffer = require("circular-buffer");

const ms_pulse = 490;

// Could very quickly get the history when it starts.
//  Such as the last 20 blocks
//   To work out where it will shift bp

// Better prediction of which will be the block producer would help.
//  Then we can grab the status and latest blocks from that bp.
//  Improving this so that it predicts which is the block producer would be the best route.

// Pulsed_Microsim
// Pulsed_Simulator





class EOS_Blockchain_Microsim extends Evented_Class {
    constructor(spec) {
        super(spec);

        prop(this, 'head_block_num', -1);
        prop(this, 'top_21_providers_sorted_names');

        let hbn = -1;
        let i_pulse;

        let o_pulse;

        // But getting the latest blocks from the block providers too...

        let cb_last_bp_names = new CircularBuffer(1024);
        // And timestamps too

        // Focused head block number.

        let t_last_pulse;

        this.start_pulse = (ms_interval = ms_pulse) => {
            //console.log('start pulse');
            // calculate the expected producer.
            //  could have a small number of expected block producers if not sure.
            //  then it will home in on which bp it actually is.

            // an ongoing list of last_bps and timestamps would be useful. A circular buffer.
            // last_bp_name



            o_pulse = {
                'wide_hbn': hbn
            }
            this.raise('pulse', o_pulse);

            // Check that the number is not being advanced too fast.
            //  Don't want the pulse to be restarted too soon, don't want the hbn to get too far advanced.

            // Don't want this 

            if (i_pulse) clearInterval(i_pulse);

            i_pulse = setInterval(() => {
                hbn++;
                o_pulse = {
                    'wide_hbn': hbn
                }

                t_last_pulse = Date.now();
                this.raise('pulse', o_pulse);
            }, ms_interval);
        }

        this.on('change', (e_change) => {
            //console.log('e_change', e_change);

            let {
                name,
                old,
                value
            } = e_change;
            hbn = value;

            if (name === 'head_block_num') {
                if (old === -1) {
                    this.start_pulse(ms_pulse);
                }
            }
        });


        this.delay_pulse = (ms_delay) => {
            //console.log('pulse delayed', ms_delay);

            // Will log the pulse delay within the eos-live log data itself.

            // Observables with automated logging will be very useful.
            //  Could have a default max size of 1024 ^ 2 where old log items get removed.

            // Possibly create a 64 bit? 128 bit? 256 bit? log guid.
            //  A log guid with a random and somewhat long key length would be really useful for keeping the logs of various observables.
            //   Could also only create the observable's log (with guid) when the log gets written for the first time.
            // Could also make the guid a feature of the observable.
            // UUID rfc4122
            



            // timing between the beginning of the pulse and the end...
            //  not taken into account so far.

            let ms_since_last_pulse = Date.now() - t_last_pulse;
            //console.log('delay pulse', ms_delay, 'ms_since_last_pulse', ms_since_last_pulse);
            let pulse_offset = ms_pulse - ms_since_last_pulse;
            //console.log('pulse_offset', pulse_offset);
            if (pulse_offset < 0) pulse_offset = 0;
            let ms_wait = ms_delay + pulse_offset;
            //console.log('wait time', ms_wait);

            clearInterval(i_pulse);

            setTimeout(() => {
                this.start_pulse(ms_pulse);
            }, ms_wait);
        }

        // and a head block number property

        this.feed_block = block => {
            //console.log('feed_block', block);
            //console.log('keys(block)', keys(block));

            if (block) {
                let {
                    timestamp,
                    producer,
                    previous,
                    new_producers,
                    block_num
                } = block;
                console.log('microsim feed_block block_num producer, previous, new_producers', block_num, producer, previous, new_producers);

                // Verify it against the 21bp list

                // need to be able to predict which block producers to use / check.
                // use the sorted list of them.


                // Predict the block producers for other future blocks.
            }
        }
    }
}


module.exports = EOS_Blockchain_Microsim;