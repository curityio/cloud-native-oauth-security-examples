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

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.example.demoapp.oauth.LoginRequestResponseActivity
import com.example.demoapp.views.CallApiView
import com.example.demoapp.views.ClaimsView
import com.example.demoapp.views.PageLoadView
import com.example.demoapp.views.SignInView
import com.example.demoapp.views.SignOutView
import com.example.demoapp.views.TitleView
import com.example.demoapp.views.UserInfoView

/*
 * The example's main activity manages launching logins and receiving the login response
 */
class MainActivity : ComponentActivity() {

    private lateinit var model: MainActivityViewModel

    private val loginLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        this.onFinishLogin(result.data)
    }

    override fun onCreate(savedInstanceState: Bundle?) {

        super.onCreate(savedInstanceState)
        actionBar?.hide()

        val model: MainActivityViewModel by viewModels()
        this.model = model

        this.createViews()
        this.model.initialize()
    }

    private fun createViews() {

        val that = this@MainActivity
        setContent {
            DemoAppTheme {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier
                        .padding(20.dp)
                        .verticalScroll(rememberScrollState())
                ) {

                    TitleView()
                    PageLoadView(that.model.isInitialized.value, that.model.isLoggedIn.value, that.model.error.value)

                    if (model.isInitialized.value) {

                        if (!model.isLoggedIn.value) {
                            SignInView(that::onStartLogin)
                        }

                        if (model.isLoggedIn.value) {
                            ClaimsView(that.model.getIdTokenClaims())
                            CallApiView(that.model.getCallApiViewModel())
                            UserInfoView(that.model.getUserInfoViewModel())
                            SignOutView(that.model::onLoggedOut)
                        }
                    }
                }
            }
        }
    }

    /*
     * Use a LoginRequestResponseActivity to manage interaction with the Chrome Custom Tab
     */
    private fun onStartLogin() {

        val authorizationRequestUrl = this.model.startLogin()
        val requestIntent = Intent(this, LoginRequestResponseActivity::class.java)
        requestIntent.putExtra("AUTHORIZATION_REQUEST_URL", authorizationRequestUrl)
        this.loginLauncher.launch(requestIntent)
    }

    /*
     * Process the authorization response from the LoginRequestResponseActivity
     */
    private fun onFinishLogin(intent: Intent?) {

        val authorizationResponseUrl = intent?.extras?.getString("AUTHORIZATION_RESPONSE_URL")
        if (authorizationResponseUrl != null) {
            this.model.endLogin(authorizationResponseUrl)
        }
    }
}
