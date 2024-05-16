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

import {Request, Response} from 'express';
import {ApiError} from '../errors/apiError.js';
import {ErrorHandler} from '../errors/errorHandler.js';
import {OrdersService} from './ordersService.js';

/*
 * The controller is the REST entry point and returns REST responses
 */
export class OrdersController {

    private readonly service: OrdersService;

    public constructor(service: OrdersService) {

        this.service = service;
        this.listOrders = this.listOrders.bind(this);
        this.getOrderDetails = this.getOrderDetails.bind(this);
    }

    /*
     * Return the list of orders the user is authorized to view
     */
    public async listOrders(request: Request, response: Response) : Promise<void> {
        
        const orders = await this.service.listOrders(response.locals.authorizer);
        response.setHeader('Content-Type', 'application/json');
        response.status(200).send(JSON.stringify(orders));
    }

    /*
     * Return details for a particular order the user is authorized to view
     */
    public async getOrderDetails(request: Request, response: Response) : Promise<void> {

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
