/* eslint-disable no-console */
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const config = require('./webpack.config');
const open = require('open');

new WebpackDevServer(webpack(config), config.devServer)
.listen(config.port, config.host, err => {
    if (err) {
        console.log(err);
    }
    console.log(`Listening at localhost:${config.port}`);
    console.log('Opening your system browser...');
    // open(`http://localhost:${config.port}/webpack-dev-server/`);
    open(`http://localhost:${config.port}/`);
});
