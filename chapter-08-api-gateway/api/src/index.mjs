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

import http from 'http';

const port = 8000;
http.createServer((request, response) => {
    
    let message = 'No access token received';
    const authHeader = request.headers.authorization;

    if (authHeader?.toLowerCase().startsWith('bearer ')) {
        const accessToken = authHeader.substring(7);
        const parts = accessToken.split('.');
        if (parts.length === 3) {
            message = 'API received a JWT access token';
        } else {
            message = 'API received an opaque access token';
        }
    } else {
        message = 'API received an opaque access token';
    }

    response.setHeader('content-type', 'application/json');
    response.end(`{\"message\": \"${message}\"}`);

}).listen(port, () => {

    console.log(`API is listening on port ${port}`);
});
