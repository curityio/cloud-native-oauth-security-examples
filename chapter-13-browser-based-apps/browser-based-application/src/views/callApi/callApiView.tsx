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

import React, {useState} from 'react';
import {Order} from '../../api/order';
import {ApplicationError} from '../../utilities/applicationError';
import {ErrorRenderer} from '../../utilities/errorRenderer';
import {CallApiProps} from './callApiProps';

export function CallApiView(props: CallApiProps) {

    const [orderList, setOrderList] = useState<Order[] | null>(null);
    const [errorText, setErrorText] = useState('');

    async function execute() {

        try {
            const orders = await props.apiClient.getOrders();
            if (orders && orders.length > 0) {
                setOrderList(orders);
                setErrorText('');
            }

        } catch (e: any) {

            if (e instanceof ApplicationError && e.isSessionExpiredError()) {
                props.onLoggedOut();
                return;
            }

            setOrderList([]);
            setErrorText(ErrorRenderer.toDisplayFormat(e));
        }
    }

    return (

        <div className='container'>
            <h2>API Requests</h2>
            <p>The SPA makes all API calls using SameSite cookies, with no tokens in the browser.</p>
            <button 
                id='getApiData' 
                className='btn btn-primary operationButton'
                onClick={execute}>
                    Get Orders
            </button>
            {orderList &&
            <div>
                <p id='callApisResult' className='alert alert-success'>API returned {orderList.length} orders</p>
            </div>}
            {errorText &&
            <div>
                <p className='alert alert-danger' id='getDataErrorResult'>{errorText}</p>
            </div>}
            <hr/>
        </div>
    )
}
