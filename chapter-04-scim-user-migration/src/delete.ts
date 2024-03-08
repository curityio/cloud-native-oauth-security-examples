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
