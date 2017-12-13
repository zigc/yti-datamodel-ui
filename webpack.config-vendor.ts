/// <reference types="node" />

import * as path from 'path';
import * as webpack from 'webpack';
const AssetsPlugin = require('assets-webpack-plugin');

const skippedDependencies = ['font-awesome', 'yti-common-ui'];

export function createConfig(build: boolean): webpack.Configuration {

  const outputPath = path.join(__dirname, 'public');
  const assetsPath = build ? path.join(outputPath, 'assets') : outputPath;

  const buildPlugins = [
    new webpack.optimize.UglifyJsPlugin({
      compress: { warnings: false },
      sourceMap: true
    })
  ];

  const servePlugins: webpack.Plugin[] = [];

  return {
    entry: {
      'vendor': Array.from(Object.keys(require('./package.json').dependencies)).filter(dep => skippedDependencies.indexOf(dep) === -1)
    },
    output: {
      path: assetsPath,
      filename: build ? '[name].[hash].js' : '[name].js',
      publicPath: build ? '/assets/' : '/',
      library: '[name]_lib'
    },
    plugins: [
      new AssetsPlugin({ path: outputPath, filename: 'assets.json' }),
      new webpack.DllPlugin({
        path: outputPath + '/' + '[name]-manifest.json',
        name: '[name]_lib'
      }),
      new webpack.LoaderOptionsPlugin({ debug: !build }),
      new webpack.ContextReplacementPlugin(
        /angular(\\|\/)core(\\|\/)@angular/,
        path.join(__dirname, 'src'),
        {}
      ),
      ...(build ? buildPlugins : servePlugins)
    ],
    resolve: {
      alias: {
        'proxy-polyfill': path.resolve(__dirname, 'node_modules/proxy-polyfill/proxy.min.js')
      }
    },
    devtool: build ? 'source-map' : 'cheap-module-source-map',
  };
}
