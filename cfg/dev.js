const path = require('path');
const webpack = require('webpack');
const _ = require('lodash');

const baseConfig = require('./base');

const config = _.merge({
    entry: [
        'webpack-dev-server/client?http://0.0.0.0:8000',
        'webpack/hot/only-dev-server',
        './app/main'
    ],
    cache: true,
    devtool: 'source-map',
    plugins: baseConfig.webpackPlugins.concat([
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoEmitOnErrorsPlugin()
    ])
}, baseConfig.webpackConfig);

// Add needed loaders
config.module.rules.push({
    test: /\.js$/,
    exclude: /(node_modules|bower_components)/,
    include: path.join(__dirname, '/../app'),
    use: [
        {
            loader: 'babel-loader'
        }
    ]
});

module.exports = config;
