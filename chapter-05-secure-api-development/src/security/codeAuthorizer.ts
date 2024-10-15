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

import {OrderDetails} from '../entities/orderDetails.js';
import {AuthorizationResult} from './authorizationResult.js';
import {Authorizer} from './authorizer.js';
import {ClaimsPrincipal} from './claimsPrincipal.js';
import {RolePermissions} from './rolePermissions.js';

/*
 * An authorization strategy that applied claims-based authorization in code
 * The code uses claims from the access token and also volatile role permissions that are not part of the token
 */
export class CodeAuthorizer implements Authorizer {

    private readonly claims: ClaimsPrincipal;
    private rolePermissions: RolePermissions;

    public constructor(claims: ClaimsPrincipal, rolePermissions: RolePermissions) {
        this.claims = claims;
        this.rolePermissions = rolePermissions;
    }

    /*
     * Attribute based authorization for a single resource
     */
    public async canViewOrder(order: OrderDetails): Promise<AuthorizationResult> {
    
        // Users (e.g. customers) who can own orders, can view their orders
        if (this.rolePermissions.canOwnOrders(this.claims.roles) &&
            order.summary.customerId === this.claims.customerId) {
            
                return new AuthorizationResult(true);
        }

        // Users (e.g. administrators) who can list orders for a region 
        // must login and use strong authentication and can then access an order of their region 
        if (this.rolePermissions.canListOrdersForRegionalUsers(this.claims.roles) &&
            this.claims.levelOfAssurance >= 2 &&
            this.claims.region === order.summary.region) {
            
                return new AuthorizationResult(true);
        }

        return new AuthorizationResult(false);
    }

    /*
     * Attribute based authorization for a collection resource that returns output attributes used for data access
     */
    public async canListOrdersForRegionalUsers(): Promise<AuthorizationResult> {

        // Users who can list orders of a region (e.g. administrators) 
        // must login and use strong authentication and can then access all orders for their region
        if (this.rolePermissions.canListOrdersForRegionalUsers(this.claims.roles) && 
            this.claims.levelOfAssurance >= 2) {

                return new AuthorizationResult(true, {region: this.claims.region});
        }
        
        return new AuthorizationResult(false);
    }

    /*
     * Attribute based authorization for a collection resource that returns output attributes used for data access
     */
    public async canListOwnedOrders(): Promise<AuthorizationResult> {

        // Users who can own orders, can list their orders
        if (this.rolePermissions.canOwnOrders(this.claims.roles)) {
            return new AuthorizationResult(true, {customerId: this.claims.customerId!});
        }
        
        return new AuthorizationResult(false);
    }
}
