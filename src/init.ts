const pw = require('please-wait');

const logo = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
const backgroundColor = '#FFFFFF';

function loadingScreen() {

  return pw.pleaseWait({
    logo,
    backgroundColor,
    loadingHtml: `<p class='loading-message'>Loading...</p><div class="spinner"></div>`
  });
}

if (Modernizr.es5syntax && Modernizr.svg) {

  const waitScreen = loadingScreen();

  require.ensure(
    ['./main'],
    (require: NodeRequire) => {
      console.log('requiring main');
      require('./main').done.then(() => waitScreen.finish(), (err: any) => console.log('err', err))
    },
    (error: any) => {
      console.log('error', error);
    },
    'app'
  );

} else {

  pw.pleaseWait({
    logo,
    backgroundColor,
    loadingHtml: `<p class='loading-message'>Pahoittelemme, mutta selaimesi ei tue tätä sovellusta / Unfortunately your browser doesn't support this application</p>`
  });
}
