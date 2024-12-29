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
 * During development the app uses a lightweight web host and sets strong security headers
 * Equivalent headers would later be set when the SPA is deployed to a remote web host
 */
let policy = "default-src 'none';";
policy += " script-src 'self';";
policy += " connect-src 'self' https://api.webapp.example;";
policy += " child-src 'self';";
policy += " img-src 'self';";
policy += " style-src 'self' https://cdn.jsdelivr.net;";
policy += " object-src 'none';";
policy += " frame-ancestors 'none';";
policy += " base-uri 'self';";
policy += " form-action 'self'";

const dirname = process.cwd();
let devServer: WebpackDevServerConfiguration = {
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
    headers: [
        {
            key: 'content-security-policy',
            value: policy,
        },
        {
            key: 'strict-transport-security',
            value: 'max-age=31536000; includeSubdomains; preload',
        },
        {
            key: 'x-frame-options',
            value: 'DENY',
        },
        {
            key: 'x-xss-protection',
            value: '1; mode=block',
        },
        {
            key: 'x-content-type-options',
            value: 'nosniff',
        },
        {
            key: 'referrer-policy',
            value: 'same-origin',
        },
    ],
};

let devConfig: webpack.Configuration = {
    mode: 'development',
    devtool: 'source-map',
    devServer,
};

export default merge(baseConfig, devConfig);
