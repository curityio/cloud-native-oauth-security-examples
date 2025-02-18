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

import webpack from 'webpack';
import {merge} from 'webpack-merge';
import baseConfig from './webpack.common.js';

/*
 * When deploying to a real web host, you should include recommended web security headers and a content security policy.
 * This should only allow access to trusted hosts, like the backend for frontend.
 * https://owasp.org/www-project-secure-headers/
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

const prodConfig: webpack.Configuration = {
  mode: 'production',
};

export default merge(baseConfig, prodConfig);
