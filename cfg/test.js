var path = require('path');

module.exports = {
  devtool: 'eval',
  module: {
    loaders: [
      {
        test: /\.(png|jpg|gif|woff|woff2|css|sass|scss|less|styl)$/,
        loader: 'null-loader'
      },
      {
        test: /\.jsx?$/,
        loader: 'babel',
        exclude: /(node_modules|bower_components)/,
        query: {
          presets: ['react', 'es2015']
        },
        include: [
          path.join(__dirname, '/../app'),
          path.join(__dirname, '/../specs'),
        ]
      }
    ]
  }
};
