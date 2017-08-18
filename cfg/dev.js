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
