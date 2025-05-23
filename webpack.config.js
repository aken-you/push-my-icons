const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const HtmlInlineScriptPlugin = require("html-inline-script-webpack-plugin");

module.exports = (env, argv) => ({
  mode: argv.mode === "production" ? "production" : "development",

  // This is necessary because Figma's 'eval' works differently than normal eval
  devtool: argv.mode === "production" ? false : "inline-source-map",

  entry: {
    plugin: "./packages/plugin/index.ts",
    ui: "./packages/ui/index.tsx",
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },

  resolve: {
    extensions: [".ts", ".js", ".tsx", ".jsx", ".css"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        include: path.resolve(__dirname, "packages"),
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader", "postcss-loader"],
        include: path.resolve(__dirname, "packages/ui"),
      },
      {
        test: /\.svg/,
        type: "asset/inline",
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      inject: "body",
      template: "./packages/ui/index.html",
      filename: "ui.html",
      chunks: ["ui"],
    }),
    new HtmlInlineScriptPlugin({
      htmlMatchPattern: [/ui.html/],
      scriptMatchPattern: [/.js$/],
    }),
  ],
});
