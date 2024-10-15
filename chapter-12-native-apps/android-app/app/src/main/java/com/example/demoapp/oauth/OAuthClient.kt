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

import android.net.Uri
import com.example.demoapp.ApplicationError
import com.example.demoapp.Configuration
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import com.google.gson.JsonSyntaxException
import okhttp3.Call
import okhttp3.Callback
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import org.jose4j.jwa.AlgorithmConstraints
import org.jose4j.jwk.HttpsJwks
import org.jose4j.jwt.JwtClaims
import org.jose4j.jwt.consumer.InvalidJwtException
import org.jose4j.jwt.consumer.JwtConsumerBuilder
import org.jose4j.keys.resolvers.HttpsJwksVerificationKeyResolver
import java.io.IOException
import java.net.URLEncoder
import java.nio.charset.StandardCharsets
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.suspendCoroutine

class OAuthClient {

    private var metadata: OpenIDConnectMetadata?
    private var state: String
    private var codeVerifier: String
    private var tokens: TokenResponse?
    var idTokenClaims: JwtClaims?

    init {
        this.metadata = null
        this.state = ""
        this.codeVerifier = ""
        this.tokens = null
        this.idTokenClaims = null
    }

    suspend fun initialize() {

        if (this.metadata == null) {
            this.downloadOpenIDConnectMetadata()
        }
    }

    fun getUserInfoEndpoint(): String {
        return this.metadata!!.userInfoEndpoint
    }

    fun getAccessToken(): String? {
        return this.tokens?.accessToken
    }

    fun startLogin(): String {

        this.state = generateRandomString()
        this.codeVerifier = generateRandomString()
        return this.buildAuthorizationRequestUrl(state, generateHash(this.codeVerifier))
    }

    suspend fun endLogin(authorizationResponseUrl: String) {

        val authorizationResponse = this.getAuthorizationResponse(Uri.parse(authorizationResponseUrl))
        if (this.state != authorizationResponse.state) {
            throw ApplicationError("invalid_state", "An invalid authorization response state was received")
        }

        val tokens = this.redeemCodeForTokens(authorizationResponse)
        this.state = ""
        this.codeVerifier = ""

        this.validateIdToken(tokens.idToken)
        this.tokens = tokens
    }

    suspend fun refreshAccessToken() {

        var requestData = "grant_type=refresh_token"
        requestData += "&client_id=${Configuration.CLIENT_ID}"
        requestData += "&refresh_token=${this.tokens!!.refreshToken}"

        val json: JsonObject = this.sendAndGetJson(
            "refresh_token_grant",
            "POST",
            this.metadata!!.tokenEndpoint,
            requestData
        )

        val accessToken = json["access_token"]?.asString ?: ""
        val refreshToken = json["refresh_token"]?.asString ?: ""
        val idToken = json["id_token"]?.asString ?: ""
        if (idToken.isNotBlank()) {
            this.validateIdToken(idToken)
            this.tokens!!.idToken = idToken
        }
        this.tokens!!.accessToken = accessToken
        if (refreshToken.isNotBlank()) {
            this.tokens!!.refreshToken = refreshToken
        }
    }

    fun logout() {
        this.tokens = null
        this.idTokenClaims = null
    }

    private suspend fun downloadOpenIDConnectMetadata() {

        val url = "${Configuration.AUTHORIZATION_SERVER_BASE_URL}/.well-known/openid-configuration"
        val json = this.sendAndGetJson("metadata", "GET", url)

        this.metadata = OpenIDConnectMetadata()
        this.metadata!!.issuer = json["issuer"].asString ?: ""
        this.metadata!!.authorizationEndpoint = json["authorization_endpoint"]?.asString ?: ""
        this.metadata!!.tokenEndpoint = json["token_endpoint"]?.asString ?: ""
        this.metadata!!.jwksEndpoint = json["jwks_uri"]?.asString ?: ""
        this.metadata!!.userInfoEndpoint = json["userinfo_endpoint"]?.asString ?: ""
    }

    private fun buildAuthorizationRequestUrl(state: String, codeChallenge: String): String {

        var requestUrl = this.metadata!!.authorizationEndpoint
        requestUrl += "?client_id=${URLEncoder.encode(Configuration.CLIENT_ID, StandardCharsets.UTF_8.name())}"
        requestUrl += "&redirect_uri=${URLEncoder.encode(Configuration.REDIRECT_URI, StandardCharsets.UTF_8.name())}"
        requestUrl += "&response_type=code"
        requestUrl += "&scope=${URLEncoder.encode(Configuration.SCOPE, StandardCharsets.UTF_8.name())}"
        requestUrl += "&state=${state}"
        requestUrl += "&code_challenge=${codeChallenge}"
        requestUrl += "&code_challenge_method=S256"
        requestUrl += "&prompt=login"
        return requestUrl
    }

    private fun getAuthorizationResponse(responseUri: Uri): AuthorizationResponse {

        val state = responseUri.getQueryParameter("state") ?: ""
        val code = responseUri.getQueryParameter("code") ?: ""
        val error = responseUri.getQueryParameter("error") ?: ""

        if (error.isNotBlank()) {
            val errorDescription = responseUri.getQueryParameter("error_description") ?: ""
            throw ApplicationError(error, errorDescription)
        }

        if (code.isBlank() || state.isBlank()) {
            throw ApplicationError("authorization_response_error", "An invalid authorization response was received")
        }

        return AuthorizationResponse(code, state)
    }

    private suspend fun redeemCodeForTokens(authorizationResponse: AuthorizationResponse): TokenResponse {

        var requestData = "grant_type=authorization_code"
        requestData += "&client_id=${Configuration.CLIENT_ID}"
        requestData += "&redirect_uri=${Configuration.REDIRECT_URI}"
        requestData += "&code=${authorizationResponse.code}"
        requestData += "&code_verifier=${this.codeVerifier}"

        val json: JsonObject = this.sendAndGetJson(
            "authorization_code_grant",
            "POST",
            this.metadata!!.tokenEndpoint,
            requestData
        )

        val tokens = TokenResponse()
        tokens.accessToken = json["access_token"]?.asString ?: ""
        tokens.refreshToken = json["refresh_token"]?.asString ?: ""
        tokens.idToken = json["id_token"]?.asString ?: ""
        return tokens
    }

    private fun validateIdToken(idToken: String) {

        try {

            val keyResolver =
                HttpsJwksVerificationKeyResolver(HttpsJwks(this.metadata!!.jwksEndpoint));

            val jwtConsumer = JwtConsumerBuilder()
                .setVerificationKeyResolver(keyResolver)
                .setJwsAlgorithmConstraints(
                    AlgorithmConstraints.ConstraintType.PERMIT,
                    Configuration.ALGORITHM
                )
                .setExpectedIssuer(this.metadata!!.issuer)
                .setExpectedAudience(Configuration.CLIENT_ID)
                .setAllowedClockSkewInSeconds(10)
                .build()

            this.idTokenClaims = jwtConsumer.processToClaims(idToken)

        } catch(ex: InvalidJwtException) {

            val error = ex.errorDetails[0]
            throw ApplicationError("id_token_validation_error", "ID token validation failed with error code ${error.errorCode}, ${error.errorMessage}")
        }
    }

    private suspend fun sendAndGetJson(
        operation: String,
        method: String,
        url: String,
        requestData: String? = null,
        accessToken: String? = null) : JsonObject {

        val client = OkHttpClient.Builder().build()

        var body: RequestBody? = null
        if (requestData != null) {
            body = requestData.toRequestBody("application/x-www-form-urlencoded".toMediaType())
        }

        val requestBuilder = Request.Builder()
            .method(method, body)
            .url(url)
            .header("accept", "application/json")

        if (accessToken != null) {
            requestBuilder.header("authorization", "Bearer ${accessToken}")
        }

        val that = this@OAuthClient
        return suspendCoroutine { continuation ->

            val request = requestBuilder.build()
            client.newCall(request).enqueue(object : Callback {

                override fun onResponse(call: Call, response: Response) {

                    if (!response.isSuccessful) {
                        continuation.resumeWithException(that.readJsonResponseError(operation, response))
                        return
                    }

                    val responseData = JsonParser.parseString(response.body?.string()).asJsonObject
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

                val code = errorJson["error"]?.asString ?: ""
                val message = errorJson["error_description"]?.asString ?: ""
                if (code.isNotBlank()) {
                    return ApplicationError(code, message, response.code)
                }
            }

        } catch(_: JsonSyntaxException) {
        }

        return ApplicationError("${operation}_response_error", "HTTP error", response.code)
    }
}
