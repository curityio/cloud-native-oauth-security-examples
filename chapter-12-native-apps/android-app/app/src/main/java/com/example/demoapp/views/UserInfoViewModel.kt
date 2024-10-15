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

package com.example.demoapp.views

import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.demoapp.ApplicationError
import com.example.demoapp.api.ApiClient
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class UserInfoViewModel(
    private val apiClient: ApiClient,
    private val onLoggedOut: () -> Unit
): ViewModel() {

    var error: MutableState<ApplicationError?> = mutableStateOf(null)
    var userName: MutableState<String?> = mutableStateOf(null)

    fun getUserInfo() {

        this.error.value = null
        val that = this@UserInfoViewModel
        viewModelScope.launch(Dispatchers.IO) {

            try {
                val userInfo = that.apiClient.getUserInfo()
                withContext(Dispatchers.Main) {
                    that.userName.value = "${userInfo.givenName} ${userInfo.familyName}"
                }

            } catch (error: ApplicationError) {

                withContext(Dispatchers.Main) {

                    if (error.code == "session_expired") {

                        that.onLoggedOut()
                        that.userName.value = null

                    } else {

                        that.error.value = error
                    }
                }
            }
        }
    }

    fun clear() {
        this.userName.value = null
        this.error.value = null
    }
}