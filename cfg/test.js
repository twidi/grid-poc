const path = require('path');

module.exports = {
    devtool: 'source-map',
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
    }
};
