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

package com.example.demoapp.oauth

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import androidx.browser.customtabs.CustomTabsIntent
import com.example.demoapp.MainActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/*
 * A helper activity to deal with custom tab communication and simplify code in the main activity
 */
class LoginRequestResponseActivity : ComponentActivity() {

    // When the custom tab closes, the app always receives a cancellation response here
    private val customTabsLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->

        val that = this@LoginRequestResponseActivity
        CoroutineScope(Dispatchers.Main).launch {
            that.handleCancellation()
        }
    }

    /*
     * Launch the Chrome Custom Tab when this activity is created with an authorization request URL
     */
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val authorizationRequestUrl = this.intent.extras?.getString("AUTHORIZATION_REQUEST_URL")
        if (!authorizationRequestUrl.isNullOrBlank()) {

            val uri = Uri.parse(authorizationRequestUrl)
            if (uri != null) {
                val customTabsIntent = CustomTabsIntent.Builder().build()
                customTabsIntent.intent.data = uri
                this.customTabsLauncher.launch(customTabsIntent.intent)
            }
        }
    }

    /*
     * Successful deep link authorization responses are received here from the Chrome Custom Tab
     * This updates the activity's intent so that it no longer contains an authorization request URL
     */
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        this.intent = intent
    }

    /*
     * Handle the authorization response and notify the main activity
     */
    override fun onResume() {
        super.onResume()

        // Check if we have intent data with an authorization response URL
        if (this.intent.data != null) {

            // Form the response intent to the main activity
            val responseIntent = Intent(this, MainActivity::class.java)
            responseIntent.putExtra("AUTHORIZATION_RESPONSE_URL", this.intent.data.toString())

            // Set a result and complete the StartActivityForResult request from the main activity
            this.setResult(RESULT_OK, responseIntent)
            this.finish()
        }
    }

    /*
     * If the user cancelled the custom tab there is no intent data and we finish the activity
     */
    private fun handleCancellation() {
        if (this.intent.data == null) {
            this.setResult(RESULT_CANCELED)
            this.finish()
        }
    }
}
