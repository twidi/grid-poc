const path = require('path');
const CircularDependencyPlugin = require('circular-dependency-plugin');

module.exports = {
    devtool: 'inline-source-map',
    module: {
        rules: [
            {
                test: /\.(png|jpg|gif|woff|woff2|css|sass|scss|less|styl)$/,
                use: [
                    {
                        loader: 'null-loader'
                    }
                ]
            },
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                include: [
                    path.join(__dirname, '/../app'),
                    path.join(__dirname, '/../specs')
                ],
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: ['react', 'es2015']
                        }
                    }
                ]
            }
        ]
    },
    plugins: [
        new CircularDependencyPlugin({
            exclude: /node_modules/,
            failOnError: false,
            onDetected({paths, compilation}) {
                compilation.errors.push(new Error(paths.join(' -> ')));
            }
        })
    ]
};
