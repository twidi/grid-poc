/* eslint-disable no-console */
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const config = require('./webpack.config');
const open = require('open');

new WebpackDevServer(webpack(config), config.devServer)
.listen(config.devServer.port, config.devServer.host, err => {
    if (err) {
        return;
    }
    console.log(`Listening at localhost:${config.devServer.port}`);
    console.log('Opening your system browser...');
    // open(`http://localhost:${config.devServer.port}/webpack-dev-server/`);
    open(`http://localhost:${config.devServer.port}/`);
});
