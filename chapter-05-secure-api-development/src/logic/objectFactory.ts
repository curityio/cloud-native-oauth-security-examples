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
import {Authorizer} from '../security/authorizer.js';
import {ClaimsPrincipal} from '../security/claimsPrincipal.js';
import {CodeAuthorizer} from '../security/codeAuthorizer.js';
import {PolicyAuthorizer} from '../security/policyAuthorizer.js';
import {RolePermissions} from '../security/rolePermissions.js';
import {OrdersController} from './ordersController.js';
import {OrdersRepository} from './ordersRepository.js';
import {OrdersService} from './ordersService.js';

/*
 * A basic form of dependency injection to load data and wire up business logic classes
 */
export class ObjectFactory {

    private readonly configuration: Configuration;
    private rolePermissions: RolePermissions | null;

    public constructor(configuration: Configuration) {
        this.configuration = configuration;
        this.rolePermissions = null;
    }

    /*
     * Load data and wire up the controller object with its dependencies
     */
    public async initialize(): Promise<OrdersController> {

        const repository = new OrdersRepository();
        await repository.load();

        if (this.configuration.authorizationStrategy !== 'policy') {

            this.rolePermissions = new RolePermissions();
            this.rolePermissions.load();
        }

        const service = new OrdersService(repository);
        return new OrdersController(service);
    }

    /*
     * Create an authorizer depending on the configured strategy
     */
    public createCodeAuthorizer(claims: ClaimsPrincipal): Authorizer {
        return new CodeAuthorizer(claims, this.rolePermissions!);
    }

    /*
     * Create an authorizer that calls a policy engine
     */
    public createPolicyAuthorizer(configuration: Configuration, accessToken: string): Authorizer {
        return new PolicyAuthorizer(configuration, accessToken);
    }
}
