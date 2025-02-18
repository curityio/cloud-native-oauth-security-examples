/*
 *  Copyright 2024 Curity AB
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import path from 'path';
import webpack from 'webpack';
import {Configuration as WebpackDevServerConfiguration} from 'webpack-dev-server';
import {merge} from 'webpack-merge';
import baseConfig from './webpack.common.js';

/*
 * A pure SPA experience is used for web development, using a lightweight static server
 */
const dirname = process.cwd();
let devConfig: webpack.Configuration = {
    mode: 'development',
};

let devServerConfig: WebpackDevServerConfiguration = {
    server: {
        type: 'https',
        options: {
            key: '../../resources/apigateway/external-certs/democluster.ssl.key',
            cert: '../../resources/apigateway/external-certs/democluster.ssl.pem',
        },
    },
    static: {
        directory: path.join(dirname, './dist'),
    },
    port: 3000,
    historyApiFallback: {
        index: 'index.html'
    },
    hot: true,
    allowedHosts: [
        'www.webapp.example'
    ],
};

devConfig.devServer = devServerConfig;
export default merge(baseConfig, devConfig);
