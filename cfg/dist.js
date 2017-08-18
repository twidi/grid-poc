const path = require('path');
const webpack = require('webpack');
const _ = require('lodash');

const baseConfig = require('./base');

const config = _.merge({
    entry: path.join(__dirname, '../app/main'),
    cache: false,
    devtool: 'sourcemap',
    plugins: [
        new webpack.optimize.DedupePlugin(),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': '"production"'
        }),
        new webpack.optimize.UglifyJsPlugin({ compress: { warnings: false } }),
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.optimize.AggressiveMergingPlugin(),
        new webpack.NoErrorsPlugin()
    ]
}, baseConfig);

config.module.loaders.push({
    test: /\.(js|jsx)$/,
    loader: 'babel',
    exclude: /(node_modules|bower_components)/,
    query: {
        presets: ['react', 'es2015']
    },
    include: path.join(__dirname, '/../app')
});

module.exports = config;
