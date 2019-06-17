// inspired by https://github.com/jeffling/ng-annotate-webpack-plugin/

const ngAnnotate = require('ng-annotate-patched');
const SourceMapSource = require('webpack-sources/lib/SourceMapSource');

export class NgAnnotatePlugin {

  apply(compiler: any) {

    compiler.hooks.compilation.tap('NgAnnotateWebpackPlugin', (compilation: any) => {
      compilation.hooks.optimizeChunkAssets.tapAsync('NgAnnotateWebpackPlugin', (chunks: any, callback: any) => {

        for (const chunk of chunks) {
          for (const file of chunk.files) {
            if (file.endsWith('.js') && file.includes('main') && !file.includes('map')) {

              const { source, map } = compilation.assets[file].sourceAndMap();

              const annotated = ngAnnotate(source, {
                add: true,
                sourceMap: true,
                map: {
                  inFile: file,
                  sourceRoot: ''
                }
              });

              if (annotated.errors) {
                throw new Error(file + ': ' + annotated.errors);
              }

              compilation.assets[file] = map ? new SourceMapSource(annotated.src, file, JSON.parse(annotated.map), source, map)
                                             : new SourceMapSource(annotated.src, file, map);
            }
          }
        }

        callback();
      });
    });
  }
}
