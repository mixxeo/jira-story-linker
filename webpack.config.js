const path = require("path");

module.exports = {
  entry: "./widget-src/code.tsx",
  output: {
    path: path.resolve(__dirname, "widget-src"),
    filename: "code.js",
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
};
