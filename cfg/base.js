const path = require('path');
const autoprefixer = require('autoprefixer');

// Needed to load CSS (and fonts) in parallel
// var ExtractTextPlugin = require('extract-text-webpack-plugin');

const host = '0.0.0.0';
const port = 8000;
const publicPath = '/';

module.exports = {
    host,
    port,
    debug: true,
    output: {
        path: path.join(__dirname, '/../dist'),
        filename: 'main.js',
        publicPath
    },
    devServer: {
        contentBase: './app/',
        historyApiFallback: true,
        hot: true,
        host,
        port,
        publicPath,
        noInfo: false,
        disableHostCheck: true
    },
    resolve: {
        extensions: ['', '.js']
    },
    module: {
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
    postcss: [autoprefixer({ browsers: ['last 2 versions'] })]
  // plugins: [ new ExtractTextPlugin('styles.css') ]

};
