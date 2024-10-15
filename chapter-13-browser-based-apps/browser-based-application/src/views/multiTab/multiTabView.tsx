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

export function MultiTabView() {

    async function execute() {
        window.open(location.href);
    }

    return (
        <div className='container'>
            <h2>Multi Tab Browsing</h2>
            <p>All browser tabs share the SameSite cookies and use them when calling APIs.</p>
            <button 
                id='multiTab' 
                className='btn btn-primary operationButton'
                onClick={execute}>
                    Open New Browser Tab
            </button>
            <hr/>
        </div>
    )
}
