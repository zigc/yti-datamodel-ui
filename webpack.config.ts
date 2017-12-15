import * as path from 'path';
import * as webpack from 'webpack';
import { Configuration } from 'webpack';
const AddAssetHtmlPlugin = require('add-asset-html-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

export const commonConfig: Configuration = {

  resolve: {
    modules: [path.resolve(__dirname, 'src'), 'node_modules'],
    extensions: ['.ts', '.js'],
    alias: {
      'proxy-polyfill': path.resolve(__dirname, 'node_modules/proxy-polyfill/proxy.min.js')
    }
  },

  module: {
    rules: [
      { test: /\.js$/,                 use: ['strip-sourcemap-loader'] },
      { test: /\.css$/,                use: ['style-loader', 'css-loader'] },
      { test: /\.scss$/,               use: ['style-loader', 'css-loader', 'sass-loader'], exclude: new RegExp('.*?components.*') },
      { test: /\.scss$/,               use: ['exports-loader?module.exports.toString()', 'css-loader', 'sass-loader'], include: new RegExp('.*?components.*') },
      { test: /\.ts$/, enforce: 'pre', use: ['tslint-loader'], exclude: path.resolve(__dirname, 'node_modules')},
      {
        test: /\.ts$/,
        use: [
          'ng-annotate-loader',
          'ts-loader',
          'angular2-template-loader',
          'strip-sourcemap-loader'
        ]
      },
      { test: /\.woff(\?.+)?$/,        use: ['url-loader?limit=10000&mimetype=application/font-woff'] },
      { test: /\.woff2(\?.+)?$/,       use: ['url-loader?limit=10000&mimetype=application/font-woff'] },
      { test: /\.ttf(\?.+)?$/,         use: ['file-loader'] },
      { test: /\.eot(\?.+)?$/,         use: ['file-loader'] },
      { test: /\.svg(\?.+)?$/,         use: ['file-loader'] },
      { test: /\.html/,                use: ['raw-loader'] },
      { test: /\.po$/,                 use: ['json-loader', 'po-loader?format=mf'] },
      { test: /\.png$/,                use: ['url-loader?mimetype=image/png'] },
      { test: /\.gif$/,                use: ['url-loader?mimetype=image/gif'] }
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
