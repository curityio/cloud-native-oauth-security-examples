import fs from 'fs-extra';
import {Configuration} from './configuration.js';
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

    // Use the SCIM client to retrieve all customers
    const scimClient = new ScimClient(configuration, accessToken);
    const userAccounts = await scimClient.listAllUsers();

    // Render the results
    console.log(JSON.stringify(userAccounts, null, 2));

} catch (e: any) {

    if (e instanceof MigrationError) {
        console.log(e.getDetails());
    }
}
