/// <reference types="node" />

import * as path from 'path';
import * as webpack from 'webpack';
import { Configuration } from 'webpack';
const AddAssetHtmlPlugin = require('add-asset-html-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

export const commonConfig = {

  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      'proxy-polyfill': path.resolve(__dirname, 'node_modules/proxy-polyfill/proxy.min.js')
    }
  },

  module: {
    rules: [
      { test: /\.js$/,                 loaders: ['strip-sourcemap-loader'] },
      { test: /\.css$/,                loaders: ['style-loader', 'css-loader'] },
      { test: /\.scss$/,               loaders: ['style-loader', 'css-loader', 'sass-loader'] },
      { test: /\.ts$/, enforce: 'pre', loaders: ['tslint-loader'] },
      {
        test: /\.ts$/,
        loaders: [
          'ng-annotate-loader',
          'ts-loader',
          'angular2-template-loader',
          'strip-sourcemap-loader'
        ]
      },
      { test: /\.woff(\?.+)?$/,        loaders: ['url-loader?limit=10000&mimetype=application/font-woff'] },
      { test: /\.woff2(\?.+)?$/,       loaders: ['url-loader?limit=10000&mimetype=application/font-woff'] },
      { test: /\.ttf(\?.+)?$/,         loaders: ['file-loader'] },
      { test: /\.eot(\?.+)?$/,         loaders: ['file-loader'] },
      { test: /\.svg(\?.+)?$/,         loaders: ['file-loader'] },
      { test: /\.html/,                loaders: ['raw-loader'] },
      { test: /\.po$/,                 loaders: ['json-loader', 'po-loader?format=mf'] },
      { test: /\.png$/,                loaders: ['url-loader?mimetype=image/png'] },
      { test: /\.gif$/,                loaders: ['url-loader?mimetype=image/gif'] }
    ]
  }
};

const fastRebuild = true;

export function createConfig(build: boolean): Configuration {

  const outputPath = path.join(__dirname, 'public');
  const assetsPath = build ? path.join(outputPath, 'assets') : outputPath;

  const buildEnv = {
    NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
    GIT_DATE: JSON.stringify(process.env.GIT_DATE),
    GIT_HASH: JSON.stringify(process.env.GIT_HASH),
    FINTO_URL: JSON.stringify(process.env.FINTO_URL),
    API_ENDPOINT: JSON.stringify(process.env.API_ENDPOINT)
  };

  const serveEnv = {
    NODE_ENV: JSON.stringify('local')
  };

  const buildPlugins = [
    new webpack.optimize.UglifyJsPlugin({
      compress: { warnings: false },
      sourceMap: true
    })
  ];
  const servePlugins = [ new webpack.HotModuleReplacementPlugin() ];

  const plugins = [
    new webpack.DefinePlugin({ 'process.env': build ? buildEnv : serveEnv }),
    new webpack.DllReferencePlugin({
      context: __dirname,
      manifest: require(path.join(outputPath, 'vendor-manifest.json'))
    }),
    new HtmlWebpackPlugin({ template: 'src/index.html', filename: build ? '../index.html' : 'index.html' }),
    new AddAssetHtmlPlugin({
      filepath: require.resolve(path.join(outputPath, require(path.join(outputPath, 'assets.json')).vendor.js)),
      includeSourcemap: true
    }),
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.LoaderOptionsPlugin({ debug: !build }),
    ...(build ? buildPlugins : servePlugins),
  ];

  return Object.assign({}, commonConfig, {
    entry: {
      init: './src/init.ts'
    },
    output: {
      path: assetsPath,
      filename: build ? '[name].[chunkhash].js' : '[name].js',
      publicPath: build ? '/assets/' : '/'
    },
    devtool: build ? 'source-map' : fastRebuild ? 'cheap-module-source-map' : 'source-map' as 'source-map'|'cheap-module-source-map',
    plugins
  });
}
