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
  plugins: [
    new NgAnnotatePlugin()
  ]
};
