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

import {Configuration} from '../configuration.js';
import {OrderDetails} from '../entities/orderDetails.js';
import {AuthorizationResult} from './authorizationResult.js';
import {Authorizer} from './authorizer.js';
import axios, {AxiosRequestConfig} from 'axios';

/*
 * An authorization strategy that asks an external policy engine for authorization decisions
 * The policy engine uses claims from the access token and also volatile role permissions that are not part of the token
 */
export class PolicyAuthorizer implements Authorizer {

    private readonly accessToken: string;
    private readonly configuration: Configuration;

    public constructor(configuration: Configuration, accessToken: string) {
        this.accessToken = accessToken;
        this.configuration = configuration;
    }

    /*
     * Attribute based authorization for a single resource
     */
    public async canViewOrder(order: OrderDetails): Promise<AuthorizationResult> {
        return await this.callPolicyEngine("view", "order", order);
    }

    /*
     * Attribute based authorization for a collection resource
     */
    public async canListOrdersForRegionalUsers(): Promise<AuthorizationResult> {
        return await this.callPolicyEngine("list", "order",);
    }

    /*
     * Attribute based authorization for a collection resource
     */
    public async canListOwnedOrders(): Promise<AuthorizationResult> {
        return await this.callPolicyEngine("list", "order");
    }

    /*
     * Send a request to the policy engine and receive a response in this format:
        { 
            "result": {
                "allowed": true|false, 
                "condition": {Record<string,string>}
            }
        }
     */
    private async callPolicyEngine(action: String, type: String, order?: OrderDetails): Promise<AuthorizationResult> {
        
        const options = {
            url: this.configuration.policyEndpoint,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            data: {
                input: {
                    accessToken: this.accessToken,
                    action,
                    type,
                }
            }
        } as AxiosRequestConfig;

        if (order) {
            options.data.input.order = {
                customerId : order.summary.customerId,
                region: order.summary.region,
            };
        }

        const axiosResponse = await axios(options);
        return new AuthorizationResult(axiosResponse.data.result.allowed, axiosResponse.data.result.condition);
    }
}
