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

import React from 'react';
import {PageLoadProps} from './pageLoadProps';

export function PageLoadView(props: PageLoadProps) {

    function execute(): string {
        
        if (!props.isPageLoaded) {
            return 'Page loading ...';
        }
        else if (props.isLoggedIn) {
            return 'You are authenticated';
        } else {
            return 'You are unauthenticated';
        }
    }

    return (
        
        <div className='container'>
            <div>
                <h2>Page Load</h2>
                <p>The client can determine its authentication status by seeing if tokens exist.</p>
                <div>
                    <p className='alert alert-success' id='pageLoadResult'>{execute()}</p>
                </div>
                {props.pageLoadError &&
                <div>
                    <p className='alert alert-danger' id='pageLoadErrorResult'>{props.pageLoadError}</p>
                </div>}
                <hr/>
            </div>
        </div>
    )
}
