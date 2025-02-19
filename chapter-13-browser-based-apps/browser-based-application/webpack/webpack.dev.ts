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
 * During development, use a content security policy that restricts the allowed domains.
 * The SPA only allows fetch requests to its APIs and only runs scripts from its web origin.
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
    /*
    * During development the app sets a strong content security policy.
    * Equivalent headers should also be set when the SPA is deployed to its production web host.
    * Also consider using other recommended security headers in development and deployed systems.
    * - https://infosec.mozilla.org/guidelines/web_security
    */
    headers: [
        {
            key: 'content-security-policy',
            value: policy,
        },
    ],
};

let devConfig: webpack.Configuration = {
    mode: 'development',
    devtool: 'source-map',
    devServer,
};

export default merge(baseConfig, devConfig);
