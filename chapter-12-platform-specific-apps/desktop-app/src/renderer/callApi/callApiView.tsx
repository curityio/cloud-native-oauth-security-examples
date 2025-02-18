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
import {ApplicationError} from '../../shared/applicationError';
import {Order} from '../../shared/order';
import {getOrders} from '../apiRequest';
import {getErrorText} from '../errorUtil';
import {CallApiProps} from './callApiProps';

export function CallApiView(props: CallApiProps) {

    const [orderList, setOrderList] = useState<Order[] | null>(null);
    const [errorText, setErrorText] = useState('');

    async function execute() {

        try {
            setErrorText('');
            const orders = await getOrders();
            setOrderList(orders);

        } catch (e: any) {

            if (e instanceof ApplicationError && e.errorCode === 'login_required') {
                props.onLoggedOut();
            } else {
                setErrorText(getErrorText(e));
            }
        }
    }

    return (
        
        <div className='container'>
            <h2>API Requests</h2>
            <p>Send the access token to the OAuth secured API to get example order information.</p>
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
            </div>
            }
            <hr/>
        </div>
    )
}
