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
/*
 * A convenience wrapper to expose type-safe claims to the API
 */
export class ClaimsPrincipal {
    scope;
    sub;
    customerId;
    roles;
    region;
    levelOfAssurance;
    constructor(claims) {
        this.scope = this.getClaim(claims, 'scope');
        this.sub = this.getClaim(claims, 'sub');
        this.customerId = this.getClaim(claims, 'customer_id', false);
        this.roles = this.getClaim(claims, 'roles');
        this.region = this.getClaim(claims, 'region');
        this.levelOfAssurance = this.getClaim(claims, 'level_of_assurance');
    }
    enforceRequiredScope(requiredScope) {
        const scopes = this.scope.split(' ');
        if (scopes.indexOf(requiredScope) === -1) {
            const info = `Required scope is '${requiredScope}' and received access token has scope '${this.scope}'`;
            throw new ApiError(403, 'insufficient_scope', 'The access token is not entitled to call this API', info);
        }
    }
    hasCustomerRole() {
        return (this.roles.indexOf('customer') !== -1);
    }
    hasAdminRole() {
        return (this.roles.indexOf('admin') !== -1);
    }
    getClaim(claims, name, required = true) {
        const value = claims[name];
        if (!value && required) {
            throw new ApiError(403, 'insufficient_scope', `The access token does not contain the required ${name} claim`);
        }
        return value;
    }
}
