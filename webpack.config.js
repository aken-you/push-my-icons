const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
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
    extensions: [".ts", ".js", ".tsx", ".jsx"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        include: path.resolve(__dirname, "packages"),
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
  ],
};
