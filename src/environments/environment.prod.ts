export const environment = {
  production: true,
  // url: 'http://localhost:3000/',
  url: 'https://health-api.cuidame.tech/',
  wsUrl: window.location.protocol.startsWith('https')
    ? 'wss://' + window.location.host + '/ws'
    : 'ws://' + window.location.host + '/ws',
};
