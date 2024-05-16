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
import { CodeAuthorizer } from '../security/codeAuthorizer.js';
import { PolicyAuthorizer } from '../security/policyAuthorizer.js';
import { RolePermissions } from '../security/rolePermissions.js';
import { OrdersController } from './ordersController.js';
import { OrdersRepository } from './ordersRepository.js';
import { OrdersService } from './ordersService.js';
/*
 * A basic form of dependency injection to load data and wire up business logic classes
 */
export class ObjectFactory {
    configuration;
    rolePermissions;
    constructor(configuration) {
        this.configuration = configuration;
        this.rolePermissions = null;
    }
    /*
     * Load data and wire up the controller object with its dependencies
     */
    async initialize() {
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
    createCodeAuthorizer(claims) {
        return new CodeAuthorizer(claims, this.rolePermissions);
    }
    /*
     * Create an authorizer that calls a policy engine
     */
    createPolicyAuthorizer(configuration, accessToken) {
        return new PolicyAuthorizer(configuration, accessToken);
    }
}
