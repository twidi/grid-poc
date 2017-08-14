var path = require('path');
var webpack = require('webpack');
var _ = require('lodash');

var baseConfig = require('./base');

var config = _.merge({
  entry: [
    'webpack-dev-server/client?http://0.0.0.0:8000',
    'webpack/hot/only-dev-server',
    './app/main'
  ],
  cache: true,
  debug: true,
  devtool: 'source-map',
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin()
  ]
}, baseConfig);

// Add needed loaders
config.module.loaders.push({
  test: /\.jsx?$/,
  loader: 'react-hot!babel?presets[]=react,presets[]=es2015,plugins[]=transform-react-display-name',
  exclude: /(node_modules|bower_components)/,
  include: path.join(__dirname, '/../app')
});

module.exports = config;
