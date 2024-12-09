import path from 'path';
import webpack from 'webpack';

const dirname = process.cwd();
const config: webpack.Configuration = {

    target: 'electron-main',
    mode: 'development',
    devtool: 'source-map',
    context: path.resolve(dirname, './src'),

    entry: {
        app: ['./main.ts']
    },
    
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: [{
                    loader: 'ts-loader',
                    options: {
                        onlyCompileBundledFiles: true,
                        configFile: '../tsconfig-main.json',
                    },
                }],
                exclude: /node_modules/
            }
        ]
    },
    
    resolve: {
        extensions: ['.ts', '.js']
    },
    
    experiments: {
        outputModule: true,
    },
    
    output: {
        path: path.resolve(dirname, './dist'),
        filename: 'main.bundle.js',
        chunkFormat: 'module',
    }
}

export default config;
