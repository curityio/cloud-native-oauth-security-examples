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

import android.app.Application
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.demoapp.api.ApiClient
import com.example.demoapp.oauth.OAuthClient
import com.example.demoapp.views.CallApiViewModel
import com.example.demoapp.views.UserInfoViewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.jose4j.jwt.JwtClaims

class MainActivityViewModel(app: Application) : AndroidViewModel(app) {

    private val oauthClient: OAuthClient
    private val apiClient: ApiClient

    var isInitialized: MutableState<Boolean>
    var isLoggedIn: MutableState<Boolean>
    var error: MutableState<ApplicationError?>

    private var callApiViewModel: CallApiViewModel?
    private var userInfoViewModel: UserInfoViewModel?

    init {

        this.oauthClient = OAuthClient()
        this.apiClient = ApiClient(this.oauthClient)

        this.isInitialized = mutableStateOf(false)
        this.isLoggedIn = mutableStateOf(false)
        this.error = mutableStateOf(null)

        this.callApiViewModel = null
        this.userInfoViewModel = null
    }

    fun initialize() {

        val that = this@MainActivityViewModel
        viewModelScope.launch(Dispatchers.IO) {

            try {
                that.oauthClient.initialize()
                withContext(Dispatchers.Main) {
                    that.isInitialized.value = true
                }

            } catch (error: ApplicationError) {
                withContext(Dispatchers.Main) {
                    that.error.value = error
                }
            }
        }
    }

    fun startLogin(): String {
        return this.oauthClient.startLogin()
    }

    fun endLogin(responseUrl: String) {

        val that = this@MainActivityViewModel
        viewModelScope.launch(Dispatchers.IO) {

            try {
                that.oauthClient.endLogin(responseUrl)
                withContext(Dispatchers.Main) {
                    that.isLoggedIn.value = true
                }

            } catch (error: ApplicationError) {
                withContext(Dispatchers.Main) {
                    that.error.value = error
                }
            }
        }
    }

    fun onLoggedOut() {
        this.oauthClient.logout()
        this.callApiViewModel?.clear()
        this.userInfoViewModel?.clear()
        this.isLoggedIn.value = false
        this.error.value = null
    }

    fun getIdTokenClaims(): JwtClaims? {
        return this.oauthClient.idTokenClaims
    }

    fun getCallApiViewModel(): CallApiViewModel {

        if (this.callApiViewModel == null) {

            this.callApiViewModel = CallApiViewModel(
                this.apiClient,
                this::onLoggedOut
            )
        }

        return this.callApiViewModel!!
    }

    fun getUserInfoViewModel(): UserInfoViewModel {

        if (this.userInfoViewModel == null) {

            this.userInfoViewModel = UserInfoViewModel(
                this.apiClient,
                this::onLoggedOut
            )
        }

        return this.userInfoViewModel!!
    }
}
