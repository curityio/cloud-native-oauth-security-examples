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

    private data: any = null;

    public async load(): Promise<void> {

        const buffer = await fs.readFile('data/rolePermissions.json');
        this.data = JSON.parse(buffer.toString())
    }

    public canOwnOrders(accessTokenRoles: string[]): boolean {
        return this.isPermissionInRoles(accessTokenRoles, p => p.canOwnOrders);  
    }

    public canEditOrderPrice(accessTokenRoles: string[]): boolean {
        return this.isPermissionInRoles(accessTokenRoles, p => p.canEditOrderPrice);
    }

    public canListOrdersForAllUsers(accessTokenRoles: string[]): boolean {
        return this.isPermissionInRoles(accessTokenRoles, p => p.canListOrdersForAllUsers);  
    }

    public canListOrdersForRegionalUsers(accessTokenRoles: string[]): boolean {
        return this.isPermissionInRoles(accessTokenRoles, p => p.canListOrdersForRegionalUsers);  
    }

    private isPermissionInRoles(accessTokenRoles: string[], predicate: (permissions: any) => boolean) {

        let result = false;
        accessTokenRoles.forEach((accessTokenRole: string) => {

            const role = this.data[accessTokenRole];
            if (role && predicate(role)) {
                result = true;
            }
        });

        return result;
    }
}
