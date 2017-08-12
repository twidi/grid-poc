var webpackCfg = require('./webpack.config');

module.exports = function(config) {
  config.set({
    basePath: '',
    browsers: [ 'Chrome' ],
    client: {
        clearContext: false
    },
    files: [
      'specs/index.js'
    ],
    port: 8080,
    captureTimeout: 60000,
    frameworks: [ 'jasmine' ],
    singleRun: false,
    autoWatch: true,
    autoWatchBatchDelay: 300,
    reporters: ['kjhtml' ],
    preprocessors: {
      'specs/index.js': [ 'webpack', 'sourcemap' ]
    },
    webpack: webpackCfg,
    webpackServer: {
      noInfo: true
    }
  });
};
