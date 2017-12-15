require('core-js');
require('css.escape');
const path = require('path');
const tsconfig = require('./tsconfig.json');
const tsconfigPaths = require('tsconfig-paths');

const config = {
  files: [],
  ignore: false,
  compilerOptions: Object.assign({}, tsconfig.compilerOptions, {
    typeRoots: [ 'node_modules/@types', 'types' ],
    types: [ 'node', 'webpack', 'karma', 'protractor' ]
  })
};

require('ts-node').register(config);

tsconfigPaths.register({
  baseUrl: tsconfig.compilerOptions.baseUrl || '.',
  paths: tsconfig.compilerOptions.paths || {}
});

if (process.argv.length !== 3) {
  throw new Error('Must contain exactly one parameter');
} else {
  require(path.join(__dirname, 'scripts', process.argv[2]));
}
