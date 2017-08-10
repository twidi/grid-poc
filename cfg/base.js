var path = require('path');
var autoprefixer = require('autoprefixer');

// Needed to load CSS (and fonts) in parallel
// var ExtractTextPlugin = require('extract-text-webpack-plugin');

var port = 8000;
var srcPath = path.join(__dirname, '/../app');
var publicPath = '/';

module.exports = {
  port: port,
  debug: true,
  output: {
    path: path.join(__dirname, '/../dist'),
    filename: 'main.js',
    publicPath: publicPath
  },
  devServer: {
    contentBase: './app/',
    historyApiFallback: true,
    hot: true,
    port: port,
    publicPath: publicPath,
    noInfo: false
  },
  resolve: {
    extensions: ['', '.js']
  },
  module: {
    // preLoaders: [
    //   {
    //     test: /\.(js|jsx)$/,
    //     include: path.join(__dirname, 'src'),
    //     loader: 'eslint-loader'
    //   }
    // ],
    loaders: [
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader'
      },
      {
        test: /\.(png|jpg|gif|woff|woff2|svg|ttf|eot|otf)(\?.+)?$/,
        loader: 'url-loader?limit=8192'
      }
    ]
  },
  postcss: [ autoprefixer({ browsers: ['last 2 versions'] }) ],
  // plugins: [ new ExtractTextPlugin('styles.css') ]

};
