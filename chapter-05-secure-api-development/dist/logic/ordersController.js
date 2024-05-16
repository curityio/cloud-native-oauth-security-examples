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
import { ApiError } from '../errors/apiError.js';
import { ErrorHandler } from '../errors/errorHandler.js';
/*
 * The controller is the REST entry point and returns REST responses
 */
export class OrdersController {
    service;
    constructor(service) {
        this.service = service;
        this.listOrders = this.listOrders.bind(this);
        this.getOrderDetails = this.getOrderDetails.bind(this);
    }
    /*
     * Return the list of orders the user is authorized to view
     */
    async listOrders(request, response) {
        const orders = await this.service.listOrders(response.locals.authorizer);
        response.setHeader('Content-Type', 'application/json');
        response.status(200).send(JSON.stringify(orders));
    }
    /*
     * Return details for a particular order the user is authorized to view
     */
    async getOrderDetails(request, response) {
        const result = await this.service.getOrderDetails(request.params.id, response.locals.authorizer);
        if (result.error) {
            const error = new ApiError(404, 'not_found', 'Resource not found for user', result.error);
            ErrorHandler.writeErrorResponse(error, response);
            return;
        }
        response.setHeader('Content-Type', 'application/json');
        response.status(200).send(JSON.stringify(result.data));
    }
}
