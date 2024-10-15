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

export class MultiTabLogout {

    private readonly key;
    private onLoggedOut: () => void;

    public constructor(onLoggedOut: () => void) {

        this.key = 'loggedout';
        this.onLoggedOut = onLoggedOut;
        this.setupCallbacks();
    }

    public initialize() {
        localStorage.removeItem(this.key);
    }

    public raiseLoggedOutEvent() {

        localStorage.setItem(this.key, 'true');
        setTimeout(() => {
            localStorage.removeItem(this.key);
        }, 500);
    }
    
    public async listenForLoggedOutEvent(event: StorageEvent): Promise<void> {

        if (event.storageArea == localStorage) {
            if (event.key === this.key && event.newValue === 'true') {
                this.onLoggedOut!();
            }
        }
    }

    private setupCallbacks(): void {
        this.listenForLoggedOutEvent = this.listenForLoggedOutEvent.bind(this);
    }
}
