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

package com.example.demoapp.api

import com.example.demoapp.ApplicationError
import com.example.demoapp.Configuration
import com.example.demoapp.oauth.OAuthClient
import com.google.gson.Gson
import com.google.gson.JsonParser
import com.google.gson.JsonSyntaxException
import okhttp3.Call
import okhttp3.Callback
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import java.io.IOException
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.suspendCoroutine

class ApiClient(private val oauthClient: OAuthClient) {

    suspend fun getApiData(): Array<Order> {
        return this.makeApiRequestWithExpiryHandling("api_data", Configuration.API_BASE_URL, Array<Order>::class.java)
    }

    suspend fun getUserInfo(): UserInfo {
        return this.makeApiRequestWithExpiryHandling("user_info", this.oauthClient.getUserInfoEndpoint(), UserInfo::class.java)
    }

    private suspend fun <T> makeApiRequestWithExpiryHandling(operation: String, url: String, responseType: Class<T>): T {

        try {

            return this.getDataFromApi(operation, url, responseType)

        } catch (error: ApplicationError) {

            if (error.statusCode != 401) {
                throw error
            }

            try {

                this.oauthClient.refreshAccessToken()

            } catch (refreshError: ApplicationError) {

                if (refreshError.code == "invalid_grant") {
                    refreshError.code = "session_expired"
                }

                throw refreshError
            }

            return this.getDataFromApi(operation, url, responseType)
        }
    }

    private suspend fun <T> getDataFromApi(operation: String, url: String, responseType: Class<T>) : T {

        val client = OkHttpClient.Builder().build()

        val requestBuilder = Request.Builder()
            .method("GET", null)
            .url(url)
            .header("accept", "application/json")

        requestBuilder.header("authorization", "Bearer ${this.oauthClient.getAccessToken()}")

        val that = this@ApiClient
        return suspendCoroutine { continuation ->

            val request = requestBuilder.build()
            client.newCall(request).enqueue(object : Callback {

                override fun onResponse(call: Call, response: Response) {

                    if (!response.isSuccessful) {
                        continuation.resumeWithException(that.readJsonResponseError(operation, response))
                        return
                    }

                    val responseData = Gson().fromJson(response.body?.string(), responseType)
                    if (responseData != null) {
                        continuation.resume(responseData)
                        return
                    }

                    val error = ApplicationError("${operation}_response_error", "Unable to read response data")
                    continuation.resumeWithException(error)
                }

                override fun onFailure(call: Call, e: IOException) {

                    val requestError = ApplicationError("${operation}_request_error", e.message ?: "")
                    continuation.resumeWithException(requestError)
                }
            })
        }
    }

    private fun readJsonResponseError(operation: String, response: Response) : ApplicationError {

        try {

            val errorJson = JsonParser.parseString(response.body?.string()).asJsonObject
            if (errorJson != null) {

                val code = errorJson["code"]?.asString ?: ""
                val message = errorJson["message"]?.asString ?: ""
                if (code.isNotBlank()) {
                    return ApplicationError(code, message, response.code)
                }
            }

        } catch(_: JsonSyntaxException) {
        }

        return ApplicationError("${operation}_response_error", "HTTP error", response.code)
    }
}
