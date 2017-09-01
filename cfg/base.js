const path = require('path');
const autoprefixer = require('autoprefixer');
const webpack = require('webpack');
const CircularDependencyPlugin = require('circular-dependency-plugin');

// Needed to load CSS (and fonts) in parallel
// var ExtractTextPlugin = require('extract-text-webpack-plugin');

const host = '0.0.0.0';
const port = 8000;
const publicPath = '/';

module.exports = {
    webpackConfig: {
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
            extensions: ['.js']
        },
        module: {
            rules: [
                {
                    test: /\.css$/,
                    use: [
                        {
                            loader: 'style-loader'
                        },
                        {
                            loader: 'css-loader'
                        }
                    ]
                },
                {
                    test: /\.(png|jpg|gif|woff|woff2|svg|ttf|eot|otf)(\?.+)?$/,
                    use: [
                        {
                            loader: 'url-loader?limit=8192'
                        }
                    ]
                }
            ]
        }
    },
    webpackPlugins: [
        // new ExtractTextPlugin('styles.css'),
        new webpack.LoaderOptionsPlugin({
            options: {
                context: __dirname,
                postcss: [
                    autoprefixer
                ]
            }
        }),
        new webpack.NamedModulesPlugin(),
        new CircularDependencyPlugin({
            exclude: /node_modules/,
            failOnError: false
        })
    ]
};
