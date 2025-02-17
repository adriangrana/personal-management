const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const webpack = require('webpack');


module.exports = {
  mode: process.env.NODE_ENV || 'development',
  entry: path.resolve(__dirname, 'src', 'index.tsx'), // ✅ Corregido
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
    publicPath: "/", // 👈 Asegura que los archivos se carguen correctamente
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    fallback: {
      process: require.resolve('process/browser'),
      buffer: require.resolve('buffer/'),
    },
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.scss$/,  // Detecta archivos .scss
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
    ],
  },
  plugins: [
    new Dotenv(), // 🔹 Carga variables desde .env
    new webpack.ProvidePlugin({
      process: 'process/browser', // 🔹 Define `process.env`
      Buffer: ['buffer', 'Buffer'],
    }),
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
  cache: false, 
  devServer: {
    host: "0.0.0.0",
    port: 3000, // Asegúrate de que el puerto está abierto en el firewall
    allowedHosts: "all", // Permite conexiones desde cualquier dispositivo en la red
    historyApiFallback: true,
    open: true,
    hot: true,
    liveReload: true,
  },
};
