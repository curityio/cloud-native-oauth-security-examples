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

/*
 * A minimal OAuth client that authenticates and gets a user level access token
 */

import {login} from './oauth/oauthClient.js'
import {getOrdersList, getOrderById} from './apiClient.js'
import {ApplicationError} from './applicationError.js';

try {

    console.log('Console client is authenticating a user via the system browser ...');
    const accessToken = await login();
    console.log('Authentication successful: access token received');

    console.log('Console client is calling API to get a list of orders ...');
    const orders = await getOrdersList(accessToken);
    console.log(JSON.stringify(orders, null, 2));

    console.log('Console client is calling API to get order details by ID ...');
    const order = await getOrderById('20882', accessToken);
    console.log(JSON.stringify(order, null, 2));

    process.exit();

} catch (e: any) {

    if (e instanceof ApplicationError) {
        console.log(e.toDisplayFormat());    
    } else {
        console.log(`Problem encountered: ${e.message}`);
    }
}
