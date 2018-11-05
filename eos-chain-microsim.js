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

class EOS_Blockchain_Microsim extends Evented_Class {
    constructor(spec) {
        super(spec);

        prop(this, 'head_block_num', -1);
        prop(this, 'block_producer_names');

        let hbn = -1;
        let i_pulse;

        let o_pulse;

        // But getting the latest blocks from the block providers too...

        



        this.on('change', (e_change) => {
            console.log('e_change', e_change);

            let {name, old, value} = e_change;
            hbn = value;

            if (name === 'head_block_num') {
                if (old === -1) {
                    o_pulse = {
                        'wide_hbn': hbn
                    }
                    this.raise('pulse');
                    i_pulse = setInterval(() => {
                        hbn++;
                        o_pulse = {
                            'wide_hbn': hbn
                        }
                        this.raise('pulse', o_pulse);
                    }, 500);
                }
            }
        })
        // and a head block number property

        this.feed_block = block => {
            console.log('feed_block');
            console.log('keys(block)', keys(block));


            let {timestamp, producer, block_num} = block;
            console.log('block_num producer', block_num, producer)

        }




    }
}


module.exports = EOS_Blockchain_Microsim;