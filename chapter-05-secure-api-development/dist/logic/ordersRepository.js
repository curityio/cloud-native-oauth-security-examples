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
 * A repository class that only does data access
 */
export class OrdersRepository {
    orders = [];
    orderLines = [];
    /*
     * Load all orders
     */
    async load() {
        const summaryBuffer = await fs.readFile('data/orderSummary.json');
        this.orders = JSON.parse(summaryBuffer.toString());
        const linesBuffer = await fs.readFile('data/orderLines.json');
        this.orderLines = JSON.parse(linesBuffer.toString());
    }
    /*
     * Return all orders for a customer
     */
    async getOrdersForCustomer(customerId) {
        return this.orders.filter((p) => p.customerId === customerId);
    }
    /*
     * Return all orders for customers in a region
     */
    async getAllOrdersForRegion(region) {
        return this.orders.filter((p) => p.region === region);
    }
    /*
     * Return orders details for an ID
     */
    async getOrderDetails(orderId) {
        const order = this.orders.find((o) => o.id === orderId);
        if (!order) {
            return null;
        }
        const lines = this.orderLines.filter((l) => l.orderId === orderId);
        return {
            summary: order,
            lines,
        };
    }
}
