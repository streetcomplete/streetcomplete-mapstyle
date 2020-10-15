const path = require('path');

module.exports = {
  mode: 'production',
  watch: true,
  entry: './js/main.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].min.js',
    publicPath: 'dist/'
  },
  devServer: {
    contentBase: __dirname,
    watchContentBase: true,
    publicPath: '/dist/',
    compress: true,
    port: 8000,
    watchOptions: {
      ignored: ['.git', 'node_modules']
    }
  }
};
