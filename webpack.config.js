export default {
  mode: 'production',
  entry: './js/main.js',
  output: {
    filename: '[name].min.js',
    publicPath: 'dist/'
  },
  devServer: {
    static: {
      directory: './',
      watch: {
        ignored: ['.git', 'node_modules']
      }
    },
    port: 8000
  }
};
