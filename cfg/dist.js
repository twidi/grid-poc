const path = require('path');
const webpack = require('webpack');
const _ = require('lodash');

const baseConfig = require('./base');

const config = _.merge({
    entry: path.join(__dirname, '../app/main'),
    cache: false,
    devtool: 'sourcemap',
    plugins: baseConfig.webpackPlugins.concat([
        new webpack.optimize.DedupePlugin(),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': '"production"'
        }),
        new webpack.optimize.UglifyJsPlugin(),
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.optimize.AggressiveMergingPlugin(),
        new webpack.NoErrorsPlugin()
    ])
}, baseConfig.webpackConfig);

config.module.rules.push({
    test: /\.js$/,
    exclude: /(node_modules|bower_components)/,
    include: path.join(__dirname, '/../app'),
    use: [
        {
            loader: 'babel-loader',
            options: {
                presets: ['react', 'es2015']
            }
        }
    ]
});

module.exports = config;
