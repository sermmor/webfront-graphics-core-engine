// const HTMLWebpackPlugin = require('html-webpack-plugin');
// const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
// const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
    context: __dirname,

    mode: 'development',
    // mode: 'production',
    // optimization: {
    //     minimizer: [
    //         new UglifyJsPlugin({
    //             uglifyOptions: {
    //                 output: {
    //                     comments: false
    //                 }
    //             }
    //         })
    //     ]
    // },

    entry: {
        // 'spin-to-win': './src/spin-to-win.ts'
        demo: './src/main.ts'
    },

    devtool: 'source-map',

    output: {
        path: __dirname + '/dist',
        filename: '[name].js'
    },

    resolve: {
        extensions: ['.js', '.ts']
    },

    module: {
        rules: [
            {
                test: /\.ts$/,
                use: ['awesome-typescript-loader']
            },
            {
                test: /\.svg$/,
                use: ['raw-loader']
            }
        ]
    },

    devServer: {
        port: '8085',
        host: '0.0.0.0'
    },

    // plugins: [
    //     new HTMLWebpackPlugin({
    //         template: './src/index.html'
    //     }),
    //     new CopyWebpackPlugin([
    //         {
    //             from: './fonts',
    //             to: './fonts'
    //         },
    //         // {
    //         //     from: './src/ae-animations',
    //         //     to: './ae-animations'
    //         // },
    //         {
    //             from: './assets',
    //             to: './assets'
    //         }
    //     ]),
    //     // new webpack.ProvidePlugin({
    //     //     PIXI: 'pixi.js'
    //     // })
    //     // new webpack.DefinePlugin({
    //     //     __DEV__: false,
    //     //     __PROD__: true,
    //     //     'process.env': {
    //     //         NODE_ENV: JSON.stringify('production')
    //     //     }
    //     // })
    // ]
};
