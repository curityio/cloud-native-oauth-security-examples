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

package com.example.demoapp

object Configuration {
    const val CLIENT_ID = "demo-mobile-client"
    const val REDIRECT_URI = "com.example.demoapp:/callback"
    const val SCOPE = "openid profile retail/orders"
    const val AUTHORIZATION_SERVER_BASE_URL = "https://login.democluster.example/oauth/v2/oauth-anonymous"
    const val ALGORITHM = "ES256"
    const val API_BASE_URL = "https://api.democluster.example/orders"
}
