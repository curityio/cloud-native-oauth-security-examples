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
import express from 'express';
import { Configuration } from './configuration.js';
import { ErrorHandler } from './errors/errorHandler.js';
import { ObjectFactory } from './logic/objectFactory.js';
import { OAuthFilter } from './security/oauthFilter.js';
// Load OAuth configuration
const configuration = new Configuration();
// Do some wiring up of objects
const objectFactory = new ObjectFactory(configuration);
const controller = await objectFactory.initialize();
// Configure OAuth middleware
const application = express();
const oauthFilter = new OAuthFilter(configuration, objectFactory);
application.use('/*', ErrorHandler.catch(oauthFilter.validateAccessToken));
// Configure API routes
application.get('/orders', ErrorHandler.catch(controller.listOrders));
application.get('/orders/:id/details', ErrorHandler.catch(controller.getOrderDetails));
// Configure an unhandled exception handler
application.use('/*', ErrorHandler.onUnhandledException);
// Start listening for API requests
application.listen(configuration.port, () => {
    console.log(`API is listening on port ${configuration.port}`);
});
