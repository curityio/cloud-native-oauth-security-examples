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
import fs from 'fs-extra';
/*
 * Represents volatile business permissions that map to the role in the access token
 * The permissions themselves are not part of the access token
 */
export class RolePermissions {
    data = null;
    async load() {
        const buffer = await fs.readFile('data/rolePermissions.json');
        this.data = JSON.parse(buffer.toString());
    }
    canOwnOrders(accessTokenRoles) {
        return this.isPermissionInRoles(accessTokenRoles, p => p.canOwnOrders);
    }
    canEditOrderPrice(accessTokenRoles) {
        return this.isPermissionInRoles(accessTokenRoles, p => p.canEditOrderPrice);
    }
    canListOrdersForAllUsers(accessTokenRoles) {
        return this.isPermissionInRoles(accessTokenRoles, p => p.canListOrdersForAllUsers);
    }
    canListOrdersForRegionalUsers(accessTokenRoles) {
        return this.isPermissionInRoles(accessTokenRoles, p => p.canListOrdersForRegionalUsers);
    }
    isPermissionInRoles(accessTokenRoles, predicate) {
        let result = false;
        accessTokenRoles.forEach((accessTokenRole) => {
            const role = this.data[accessTokenRole];
            if (role && predicate(role)) {
                result = true;
            }
        });
        return result;
    }
}
