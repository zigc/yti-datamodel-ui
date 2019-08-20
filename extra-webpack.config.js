const path = require('path');
const tsconfig = require('./tsconfig.json');

const config = {
  files: [],
  ignore: false,
  compilerOptions: Object.assign({}, tsconfig.compilerOptions, {
    module: 'commonjs',
    typeRoots: [ 'node_modules/@types' ],
    types: [ 'node', 'webpack' ]
  })
};

require('ts-node').register(config);
const NgAnnotatePlugin = require('./ng-annotate.plugin.ts').NgAnnotatePlugin;

module.exports = {
  resolve: {
    alias: {
      'proxy-polyfill': path.resolve(__dirname, 'node_modules/proxy-polyfill/proxy.min.js'),
      'jsonld': path.resolve(__dirname, 'node_modules/jsonld/dist/node6/lib/jsonld.js')
    }
  },
  plugins: [
    new NgAnnotatePlugin()
  ]
};
