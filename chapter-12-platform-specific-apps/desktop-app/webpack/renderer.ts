import path from 'path';
import webpack from 'webpack';

const dirname = process.cwd();
const config: webpack.Configuration = {

    target: 'web',
    mode: 'development',
    devtool: 'source-map',
    context: path.resolve(dirname, './src'),

    entry: {
        app: ['./renderer.tsx']
    },
    
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                use: [{
                    loader: 'ts-loader',
                    options: {
                        onlyCompileBundledFiles: true,
                        configFile: '../tsconfig-renderer.json',
                    },
                }],
                exclude: /node_modules/
            }
        ]
    },
    
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    
    output: {
        path: path.resolve(dirname, './dist'),
        filename: '[name].bundle.js',
    },
    
    optimization: {
        splitChunks: {
            cacheGroups: {
                vendor: {
                    chunks: 'initial',
                    name: 'vendor',
                    test: /node_modules/,
                    enforce: true
                },
            }
        }
    }
}

export default config;
