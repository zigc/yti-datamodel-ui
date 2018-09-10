// webpackLoader initialization copied from @angular-devkit/build-angular/src/angular-cli-files/models/webpack-configs/typescript.js @ 0.7.4

const g = typeof global !== 'undefined' ? global : {};
const webpackLoader = g['_DevKitIsLocal'] ? require.resolve('@ngtools/webpack') : '@ngtools/webpack';

module.exports = {
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ng-annotate-loader',
            options: {
              ngAnnotate: "ng-annotate-patched",
              es6: true
            }
          },
          {
            loader: webpackLoader
          }
        ]
      }
    ]
  }
};
