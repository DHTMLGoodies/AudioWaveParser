// require the path module
const path = require('path');
// const CleanWebpackPlugin = require('clean-webpack-plugin');

const baseConfig = {
    entry: {
        app: './src/index.ts',
        worker: './src/AudioWaveParser.ts'
    },
    // entry: './src/index.ts',
    optimization: {
        // We no not want to minimize our code.
        minimize: true
    },
    resolve: {
        // Add `.ts` and `.tsx` as a resolvable extension.
        extensions: [".ts", ".tsx", ".js"]
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    output: {
        // path: path.resolve(__dirname, 'dist'),
        // filename: 'index.js',
        libraryTarget: 'umd',
        publicPath: '/dist/',
    },
    externals: {},
    mode: 'production'
};


module.exports = function (env) {

    env = env || 'development';

    console.log(`This is ${env} build`);

    // if (env === "development") {
    //     baseConfig.devtool = 'inline-source-map';
    //     baseConfig.devServer = {
    //         contentBase: path.resolve(__dirname, 'app'),
    //         watchContentBase: true, // watchContentBase only listens for root level appearantly.
    //     }
    //     baseConfig.mode = "development";
    // }

    return baseConfig;
}