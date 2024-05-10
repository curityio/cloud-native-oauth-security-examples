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

import fs from 'fs-extra';
import {Configuration} from './configuration.js';
import {Customer} from './customer.js';
import {MigrationError} from './migrationError.js';
import {ScimClient} from './scimClient.js';
import {TokenClient} from './tokenClient.js';

try {

    // Load the migration script's configuration
    const configBuffer = await fs.readFile('configuration.json');
    const configuration = JSON.parse(configBuffer.toString()) as Configuration;

    // Authenticate and get an access token with SCIM access to user accounts
    const tokenClient = new TokenClient(configuration);
    const accessToken = await tokenClient.authenticate();

    // Create the SCIM client
    const scimClient = new ScimClient(configuration, accessToken);

    // Process and delete each customer user
    const customersBuffer = await fs.readFile('./data/customers.json');
    const customers = JSON.parse(customersBuffer.toString()) as Customer[];
    for await (const customer of customers) {

        const accountId = await scimClient.deleteUser(customer);
        if (accountId) {
            console.log(`Deleted user account ${accountId} from authorization server`);
        }
    }

} catch (e: any) {

    if (e instanceof MigrationError) {
        console.log(e.getDetails());
    }
}
