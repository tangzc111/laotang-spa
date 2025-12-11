const { resolve } = require('path');
const merge = require('webpack-merge');
const argv = require('yargs-parser')(process.argv.slice(2));
const _mode = argv.mode || 'development';
const _mergeConfig = require(`./config/webpack.${_mode}.js`);

const webpackBaseConfig = {
  entry: {
    main: resolve('src/index.tsx'),
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /(node_modules)/,
        use: {
          // `.swcrc` can be used to configure swc
          loader: 'swc-loader',
        },
      },
    ],
  },
  resolve: {
    alias: {
      "@": resolve("src/"),
      "@components": resolve("src/components"),
      "@hooks": resolve("src/hooks"),
      "@pages": resolve("src/pages"),
      "@layouts": resolve("src/layouts"),
      "@routes": resolve("src/routes"),
      "@assets": resolve("src/assets"),
      "@stores": resolve("src/stores"),
      "@service": resolve("src/service"),
      "@utils": resolve("src/utils"),
      "@lib": resolve("src/lib"),
      "@constants": resolve("src/constants"),
      "@connections": resolve("src/connections"),
      "@abis": resolve("src/abis"),
      "@types": resolve("src/types"),
    },
    extensions: [".js", ".ts", ".tsx", ".jsx", ".css"],
    fallback: {
      // stream: require.resolve('stream-browserify'),
    },
  },
};

module.exports = merge.default(webpackBaseConfig, _mergeConfig);
