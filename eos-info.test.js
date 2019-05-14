const eos_info = require('./eos-info');

test('downloads the network table', async () => {

  // Download network map from eosnetworkinfo

  let {
    top_21_providers,
    next_84_providers,
    map_names_to_endpoints,
    top_180_providers
} = await eos_info.get_top_providers_info();
    console.log('top_21_providers.length', top_21_providers.length);

    await expect(top_21_providers.length).toEqual(21);
  

  //expect(sum(1, 2)).toBe(3);
});