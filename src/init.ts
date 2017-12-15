/// <reference path="augment.d.ts" />

import './vendor/modernizr';
import './styles/loading.scss';
// import { config } from './config';
const pw = require('please-wait');

const logo = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
const backgroundColor = '#FFFFFF';

function loadingScreen() {
  // if (config.environment !== 'local') {
    return pw.pleaseWait({
      logo,
      backgroundColor,
      loadingHtml: `<p class='loading-message'>Loading...</p><div class="spinner"></div>`
    });
  // } else {
  //   return {
  //     finish() {}
  //   };
  // }
}

if (Modernizr.es5syntax && Modernizr.svg) {

  const waitScreen = loadingScreen();

  require.ensure(['./main'], require => {
    require('./main').done.then(() => waitScreen.finish());
  }, 'app');
} else {

  pw.pleaseWait({
    logo,
    backgroundColor,
    loadingHtml: `<p class='loading-message'>Pahoittelemme, mutta selaimesi ei tue tätä sovellusta / Unfortunately your browser doesn't support this application</p>`
  });
}
