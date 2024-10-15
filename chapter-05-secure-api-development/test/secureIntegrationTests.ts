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

import assert from 'assert';
import {generateKeyPair} from 'jose';
import {ApiClient} from './apiClient.js';
import {MockAuthorizationServer} from './mockAuthorizationServer.js';
import {TokenProperties} from './tokenProperties.js';

describe('OAuth API Tests', () => {

    const apiBaseUrl = 'http://localhost:3000';
    const authorizationServer = new MockAuthorizationServer();

    /*
     * Create keys and setup the JWKS URI once, before all tests run
     */
    before( async () => {
        await authorizationServer.start();
    });

    /*
     * Free resources ones all tests have completed
     */
    after( async () => {
        await authorizationServer.stop();
    });

    it ('A malformed access token results in a 401 status', async () => {

        const accessToken = 'abc123';
        const apiClient = new ApiClient(apiBaseUrl);
        const [statusCode, error] = await apiClient.getOrders(accessToken);

        assert.strictEqual(statusCode, 401);
        assert.strictEqual(error.code, 'invalid_token');
    });

    it ('An access token with an invalid issuer results in a 401 status', async () => {

        const token = new TokenProperties();
        token.iss = 'https://malicious-issuer.example'

        const accessToken = await authorizationServer.issueMockAccessToken(token);
        const apiClient = new ApiClient(apiBaseUrl);
        const [statusCode, error] = await apiClient.getOrders(accessToken);

        assert.strictEqual(statusCode, 401);
        assert.strictEqual(error.code, 'invalid_token');
    });

    it ('An access token with an invalid audience results in a 401 status', async () => {

        const token = new TokenProperties();
        token.aud = 'other.audience.example'

        const accessToken = await authorizationServer.issueMockAccessToken(token);
        const apiClient = new ApiClient(apiBaseUrl);
        const [statusCode, error] = await apiClient.getOrders(accessToken);

        assert.strictEqual(statusCode, 401);
        assert.strictEqual(error.code, 'invalid_token');
    });

    it ('An expired access token results in a 401 status', async () => {

        const token = new TokenProperties();
        token.exp = Date.now() / 1000 - 30;

        const accessToken = await authorizationServer.issueMockAccessToken(token);
        const apiClient = new ApiClient(apiBaseUrl);
        const [statusCode, error] = await apiClient.getOrders(accessToken);

        assert.strictEqual(statusCode, 401);
        assert.strictEqual(error.code, 'invalid_token');
    });

    it ('An access token with an invalid signature results in a 401 status', async () => {

        const token = new TokenProperties();

        const maliciousKeypair = await generateKeyPair('ES256');
        const accessToken = await authorizationServer.issueMockAccessToken(token, maliciousKeypair);
        const apiClient = new ApiClient(apiBaseUrl);
        const [statusCode, error] = await apiClient.getOrders(accessToken);

        assert.strictEqual(statusCode, 401);
        assert.strictEqual(error.code, 'invalid_token');
    });

    it ('An access token with an invalid scope results in a 403 status', async () => {

        const token = new TokenProperties();
        token.scope = 'openid marketing'

        const accessToken = await authorizationServer.issueMockAccessToken(token);
        const apiClient = new ApiClient(apiBaseUrl);
        const [statusCode, error] = await apiClient.getOrders(accessToken);

        assert.strictEqual(statusCode, 403);
        assert.strictEqual(error.code, 'insufficient_scope');
    });

    it ('An access token with missing required claims results in a 403 status', async () => {

        const token = new TokenProperties();
        delete token.region;

        const accessToken = await authorizationServer.issueMockAccessToken(token);
        const apiClient = new ApiClient(apiBaseUrl);
        const [statusCode, error] = await apiClient.getOrders(accessToken);

        assert.strictEqual(statusCode, 403);
        assert.strictEqual(error.code, 'insufficient_scope');
    });

   it ('Customers get a filtered list of orders with only their data', async () => {

        const token = new TokenProperties();
        token.customerId = '2099';

        const accessToken = await authorizationServer.issueMockAccessToken(token);
        const apiClient = new ApiClient(apiBaseUrl);
        const [statusCode, orders] = await apiClient.getOrders(accessToken);

        assert.strictEqual(statusCode, 200);
        
        assert.ok(orders.length > 0, "Empty list of orders");
        
        orders.forEach(order => {
            assert.strictEqual(order.customerId, token.customerId)
        });
    });

    it ('Customers can access details for one of their own orders', async () => {

        const token = new TokenProperties();
        token.customerId = '2099';

        const accessToken = await authorizationServer.issueMockAccessToken(token);
        const apiClient = new ApiClient(apiBaseUrl);
        const [statusCode, orders] = await apiClient.getOrderDetails('20881', accessToken);

        assert.strictEqual(statusCode, 200);
        assert.ok(orders, "Order exists");
        assert.strictEqual(orders.summary.customerId, token.customerId);
    });

    it ('Customers get a 404 status for non-existent order details', async () => {

        const token = new TokenProperties();
        token.customerId = '2099';

        const accessToken = await authorizationServer.issueMockAccessToken(token);
        const apiClient = new ApiClient(apiBaseUrl);
        const [statusCode, error] = await apiClient.getOrderDetails('99999', accessToken);

        assert.strictEqual(statusCode, 404);
        assert.strictEqual(error.code, 'not_found');
    });

    it ('Customers get a 404 status for order details of other customers', async () => {

        const token = new TokenProperties();
        token.customerId = '2099';
      
        const accessToken = await authorizationServer.issueMockAccessToken(token);
        const apiClient = new ApiClient(apiBaseUrl);
        const [statusCode, error] = await apiClient.getOrderDetails('20882', accessToken);

        assert.strictEqual(statusCode, 404);
        assert.strictEqual(error.code, 'not_found');
    });

    it ('Administrators get a filtered list of orders for their region', async () => {

        const token = new TokenProperties();
        token.customerId = '7791';
        token.roles = ['admin'];
        token.region = 'USA';
        token.levelOfAssurance = 2;

        const accessToken = await authorizationServer.issueMockAccessToken(token);
        const apiClient = new ApiClient(apiBaseUrl);
        const [statusCode, orders] = await apiClient.getOrders(accessToken);

        assert.strictEqual(statusCode, 200);
        assert.ok(orders.length > 0, "Empty list of orders");
        
        orders.forEach(order => {
            assert.strictEqual(order.region, token.region)
        });
    });

    it ('Administrators can get order details for customers in their region', async () => {
        
        const token = new TokenProperties();
        token.customerId = '7791';
        token.roles = ['admin'];
        token.region = 'USA';
        token.levelOfAssurance = 2;

        const accessToken = await authorizationServer.issueMockAccessToken(token);
        const apiClient = new ApiClient(apiBaseUrl);
        const [statusCode, order] = await apiClient.getOrderDetails('20882', accessToken);

        assert.strictEqual(statusCode, 200);
        assert.strictEqual(order.summary.region, token.region);
    });

    it ('Administrators cannot get order details for customers in other regions', async () => {
        
        const token = new TokenProperties();
        token.customerId = '7791';
        token.roles = ['admin'];
        token.region = 'USA';
        token.levelOfAssurance = 2;

        const accessToken = await authorizationServer.issueMockAccessToken(token);
        const apiClient = new ApiClient(apiBaseUrl);
        const [statusCode, order] = await apiClient.getOrderDetails('21996', accessToken);
        assert.strictEqual(statusCode, 404);
    });
});
