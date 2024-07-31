const axios = require('axios');
const headers = {
  'User-Agent': 'svitlobot-monitor v1.0.8',
  'Accept-Language': 'uk-UA,uk;q=0.9',
};
axios
  .get('https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=50.4346578&lon=30.5312405&zoom=18&addressdetails=1&layer=address', {
    headers,
  })
  .then(({data}) => console.log(data));
