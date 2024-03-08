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

    // Read existing customer user
    const customersBuffer = await fs.readFile('./data/customers.json');
    const customers = JSON.parse(customersBuffer.toString()) as Customer[];

    // Migrate each record
    for await (const customer of customers) {

        // Use SCIM to create the user at the authorization server
        const accountId = await scimClient.migrateUser(customer);
        console.log(`Migrated customer ${customer.id} to user account ${accountId}`);

        // Remove personal user data from the customer data
        delete customer.userName;
        delete customer.email;
        delete customer.country;
        delete customer.roles;
    }

    // Write the migrated customer data
    await fs.writeFile('../data/customers-migrated.json', JSON.stringify(customers, null, 2));

} catch (e: any) {

    if (e instanceof MigrationError) {
        console.log(e.getDetails());
    }
}
