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

/*
 * An example customer user record
 */
export interface Customer {
    
    // The existing customer identifier
    id: number;

    // In this example, these fields are core identity attributes and migrated to the authorization server
    userName?: string;
    email?: string;
    country?: string;
    roles?: string[];

    // In this example, these fields are considered product specific and are left in the customer data
    membershipLevel: string;
    membershipExpires: string;
}
