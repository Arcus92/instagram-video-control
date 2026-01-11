const path = require('path');
const ESLintPlugin = require('eslint-webpack-plugin');

module.exports = {
    entry: {
        instagram: './src/ts/instagram/index.ts',
        popup: './src/ts/popup/index.ts',
    },
    mode: 'development',
    devtool: 'inline-source-map',
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist', 'js'),
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    plugins: [new ESLintPlugin()],
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
};
