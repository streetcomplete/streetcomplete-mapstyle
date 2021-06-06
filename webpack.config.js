export default {
  mode: 'production',
  entry: './js/main.js',
  output: {
    filename: '[name].min.js',
    publicPath: 'dist/'
  },
  devServer: {
    watchContentBase: true,
    publicPath: '/dist/',
    compress: true,
    port: 8000,
    watchOptions: {
      ignored: ['.git', 'node_modules']
    }
  }
};
