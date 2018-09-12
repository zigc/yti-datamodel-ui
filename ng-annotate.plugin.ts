const ngAnnotate = require('ng-annotate-patched');
const SourceMapSource = require('webpack-core/lib/SourceMapSource');

export class NgAnnotatePlugin {

  apply(compiler: any) {

    const ngAnnotateOptions = {
      add: true,
      sourceMap: false
    };

    compiler.hooks.compilation.tap('NgAnnotateWebpackPlugin', function(compilation: any) {
      compilation.hooks.optimizeChunkAssets.tapAsync('NgAnnotateWebpackPlugin', function(chunks: any, callback: any) {

        for (const chunk of chunks) {
          for (const file of chunk.files) {
            if (file.endsWith('.js') && file !== 'vendor.js') {

              const asset = compilation.assets[file];
              const annotatedSource = ngAnnotate(asset.source(), ngAnnotateOptions);

              if (annotatedSource.errors) {
                throw new Error(file + ': ' + annotatedSource.errors);

              }

              compilation.assets[file] = new SourceMapSource(annotatedSource.src, file, asset.map());
            }
          }
        }

        callback();
      });
    });
  }
}
