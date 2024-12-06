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

import getPort from 'get-port';
import http from 'http';
import EventEmitter from 'node:events';
import open from 'open';

/*
 * Make a login request using the system browser and receive a response using a loopback web server
 */
export class LoginRequestResponse {

    private httpServer: http.Server | null = null;
    private eventEmitter = new EventEmitter();
    private port: number = 0;

    /*
     * Ensure that the this parameter works in the async event handler
     */
    public constructor() {
        this.handleLoopbackHttpRequest = this.handleLoopbackHttpRequest.bind(this);
    }

    /*
     * Clean up from last time if required and calculate the redirect URI
     */
    public async start(): Promise<string> {

        this.stop();
        this.port = await getPort({port: 3000});
        return `http://127.0.0.1:${this.port}/callback`;
    }
    
    /*
     * Do the plumbing work to send the request URL and receive the response URL
     */
    public async login(authorizationRequestUrl: string): Promise<URL> {

        // Start an HTTP server and listen for the authorization response on a loopback URL, according to RFC8252
        this.httpServer = http.createServer(this.handleLoopbackHttpRequest);
        this.httpServer.listen(this.port);
        
        // Open the system browser to begin authentication
        await open(authorizationRequestUrl);

        // Wait for the completion event
        return new Promise<URL>((resolve, reject) => {

            this.eventEmitter.once('LOGIN_COMPLETE', (authorizationResponseUrl: string) => {
                this.stop();
                resolve(new URL(authorizationResponseUrl));
            });
        });
    }

    /*
     * Process HTTP requests received by the local loopback web server
     */
    private async handleLoopbackHttpRequest(
        request: http.IncomingMessage,
        response: http.ServerResponse): Promise<void> {

        const requestUrl = new URL(request.url || '', `http://${request.headers.host}`);
        if (requestUrl.pathname !== '/callback') {
            response.end();
            return;
        }

        // The example outputs text to the browser's leftover page once login completes
        // If you prefer you could redirect to a custom web page instead
        response.write('Authorization response returned to client');
        response.end();
        
        this.eventEmitter.emit('LOGIN_COMPLETE', requestUrl);
    }

    /*
     * Stop the HTTP server when no longer needed or upon a retry
     */
    private stop() {

        if (this.httpServer) {
            this.httpServer.close();
            this.httpServer = null;
        }
    }
}
