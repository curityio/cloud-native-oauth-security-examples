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

import Foundation
import AuthenticationServices
import JOSESwift

class OAuthClient {
    
    private var metadata: OpenIdConnectMetadata?
    private var state: String
    private var codeVerifier: String
    private var tokens: TokenResponse?
    var idTokenClaims: IDTokenClaims?

    init () {
        self.state = ""
        self.codeVerifier = ""
        self.tokens = nil
        self.idTokenClaims = nil
    }

    func initialize() async throws {
        
        if self.metadata == nil {
            try await self.getOpenIDConnectMetadata()
        }
    }

    func getUserInfoEndpoint() -> String? {
        return self.metadata?.userInfoEndpoint
    }

    func getAccessToken() -> String? {
        return self.tokens?.accessToken
    }
    
    func refreshAccessToken() async throws {
        
        var requestData = "grant_type=refresh_token"
        requestData += "&client_id=\(Configuration.clientId)"
        requestData += "&refresh_token=\(self.tokens!.refreshToken)"
        
        let responseData = try await self.sendAndGetJson(
            operation: "refresh_token_grant",
            method: "POST",
            url: self.metadata!.tokenEndpoint,
            requestData: requestData.data(using: .utf8))
        
        let json = try? JSONSerialization.jsonObject(with: responseData, options: [])
        if json != nil {
            if let fields = json! as? [String: Any] {
                
                let accessToken = fields["access_token"] as? String ?? ""
                let refreshToken = fields["refresh_token"] as? String ?? ""
                let idToken = fields["id_token"] as? String ?? ""
                
                if !idToken.isEmpty {
                    try await self.validateIdToken(idToken: idToken)
                    self.tokens!.idToken = idToken
                }

                self.tokens!.accessToken = accessToken
                if !refreshToken.isEmpty {
                    self.tokens!.refreshToken = refreshToken
                }

                return
            }
        }

        throw ApplicationError(code: "token_response_error", message: "Unable to read response JSON data")
    }

    func startLogin() -> String {

        self.state = CryptoUtils.generateRandomString()
        self.codeVerifier = CryptoUtils.generateRandomString()
        return self.buildAuthorizationRequestUrl(
            state: self.state,
            codeChallenge: CryptoUtils.generateHash(input: self.codeVerifier))
    }
    
    func endLogin(responseUrl: URL?, error: Error?) async throws -> Bool {
        
        // Handle cancellations, which are not real errors
        if let errorCode = (error as? NSError)?.code {
            if errorCode == ASWebAuthenticationSessionError.Code.canceledLogin.rawValue {
                return false
            }
            
            throw ApplicationError(code: "login_error", message: "ASWebAuthenticationSession error code \(errorCode)")
        }
        
        // Protect against OAuth CSRF attacks
        let authorizationResponse = try self.getAuthorizationResponse(responseUrl: responseUrl!)
        if self.state != authorizationResponse.state {
            throw ApplicationError(code: "invalid_state", message: "An invalid authorization response state was received")
        }
        
        // Swap the code for tokens, using PKCE to protect against authorization code injection
        let tokens = try await self.redeemCodeForTokens(authorizationResponse: authorizationResponse)
        self.state = ""
        self.codeVerifier = ""

        // Validate the ID token before accepting tokens
        try await self.validateIdToken(idToken: tokens.idToken)
        self.tokens = tokens
        return true
    }
  
    func logout() {
        self.tokens = nil
        self.idTokenClaims = nil
    }

    private func getOpenIDConnectMetadata() async throws {
        
        let url = "\(Configuration.authorizationServerBaseUrl)/.well-known/openid-configuration"
        let data = try await self.sendAndGetJson(
            operation: "metadata",
            method: "GET",
            url: url)

        let json = try? JSONSerialization.jsonObject(with: data, options: [])
        if json != nil {
            if let fields = json! as? [String: Any] {
                
                let metadata = OpenIdConnectMetadata()
                metadata.authorizeEndpoint = fields["authorization_endpoint"] as? String ?? ""
                metadata.tokenEndpoint = fields["token_endpoint"] as? String ?? ""
                metadata.jwksEndpoint = fields["jwks_uri"] as? String ?? ""
                metadata.userInfoEndpoint = fields["userinfo_endpoint"] as? String ?? ""
                metadata.issuer = fields["issuer"] as? String ?? ""
                self.metadata = metadata
                return
            }
        }

        throw ApplicationError(code: "metadata_response_error", message: "Unable to read response JSON data")
    }

    private func buildAuthorizationRequestUrl(state: String, codeChallenge: String) -> String {
     
        // Use PKCE for the authorization request
        var requestUrl = self.metadata!.authorizeEndpoint
        requestUrl += "?client_id=\(CryptoUtils.urlEncode(input: Configuration.clientId))"
        requestUrl += "&redirect_uri=\(CryptoUtils.urlEncode(input: Configuration.redirectUri))"
        requestUrl += "&response_type=code"
        requestUrl += "&scope=\(CryptoUtils.urlEncode(input: Configuration.scope))"
        requestUrl += "&state=\(self.state)"
        requestUrl += "&code_challenge=\(CryptoUtils.generateHash(input: self.codeVerifier))"
        requestUrl += "&code_challenge_method=S256"
        requestUrl += "&prompt=login"
        return requestUrl
    }
    
    private func getAuthorizationResponse(responseUrl: URL) throws -> AuthorizationResponse {
        
        let query = URLComponents(string: responseUrl.absoluteString)?.queryItems
        let state = query?.first(where: { $0.name == "state" })?.value ?? ""
        let code = query?.first(where: { $0.name == "code" })?.value ?? ""
        
        let error = query?.first(where: { $0.name == "error" })?.value
        if error != nil {
            let errorDescription = query?.first(where: { $0.name == "error_description" })?.value ?? ""
            throw ApplicationError(code: error!, message: errorDescription)
        }
        
        if code.isEmpty || state.isEmpty {
            throw ApplicationError(code: "authorization_response_error", message: "An invalid authorization response was received")
        }
        
        return AuthorizationResponse(code: code, state: state)
   }
    
    private func redeemCodeForTokens(authorizationResponse: AuthorizationResponse) async throws -> TokenResponse {
        
        // Use PKCE when swapping the code for tokens
        var requestData = "grant_type=authorization_code"
        requestData += "&client_id=\(Configuration.clientId)"
        requestData += "&redirect_uri=\(Configuration.redirectUri)"
        requestData += "&code=\(authorizationResponse.code)"
        requestData += "&code_verifier=\(self.codeVerifier)"
        
        let responseData = try await self.sendAndGetJson(
            operation: "authorization_code_grant",
            method: "POST",
            url: self.metadata!.tokenEndpoint,
            requestData: requestData.data(using: .utf8))
        
        let json = try? JSONSerialization.jsonObject(with: responseData, options: [])
        if json != nil {
            if let fields = json! as? [String: Any] {
                let tokens = TokenResponse()
                tokens.accessToken = fields["access_token"] as? String ?? ""
                tokens.refreshToken = fields["refresh_token"] as? String ?? ""
                tokens.idToken = fields["id_token"] as? String ?? ""
                return tokens
            }
        }

        throw ApplicationError(code: "authorization_code_grant_error", message: "Unable to read response JSON data")
    }
    
    private func validateIdToken(idToken: String) async throws {
        
        let jws = try JWS(compactSerialization: idToken)
        let kid = jws.header.kid
        if kid == nil {
            throw ApplicationError(code: "id_token_validation_error", message: "Invalid ID token received: no kid value in JWT header")
        }
        
        let data = try await self.sendAndGetJson(
            operation: "jwks",
            method: "GET",
            url: self.metadata!.jwksEndpoint)
        let jwks = try JWKSet(data: data)
        let jwk = jwks.keys.first(where: {$0["kid"] == kid}) as? ECPublicKey
        if jwk == nil {
            throw ApplicationError(code: "id_token_validation_error", message: "Invalid ID token received: no matching key in the JWKS URI")
        }
        
        
        let algorithm = SignatureAlgorithm.init(rawValue: Configuration.idTokenAlgorithm)
        let payload: Payload?
        do {
            
            let publicKey: SecKey = try! jwk!.converted(to: SecKey.self)
            let verifier = Verifier(signatureAlgorithm: algorithm!, key: publicKey)!
            payload = try jws.validate(using: verifier).payload

        } catch {
            throw ApplicationError(code: "id_token_validation_error", message: error.localizedDescription)
        }
        
        let jsonData = try JSONSerialization.jsonObject(with: payload!.data())
        let claimsData = jsonData as? Dictionary<String, AnyObject>
        if claimsData == nil {
            throw ApplicationError(code: "claims_error", message: "Unable to read claims from ID token payload")
        }
        
        let claims = IDTokenClaims(claims: claimsData!)
        if claims.getIssuer() != self.metadata!.issuer {
            throw ApplicationError(code: "id_token_validation_error", message: "Invalid ID token received: unexpected issuer claim")
        }

        if !claims.getAudience().contains(Configuration.clientId) {
            throw ApplicationError(code: "id_token_validation_error", message: "Invalid ID token received: unexpected audience claim")
        }
        
        if claims.getExpiry() < Int64(Date().timeIntervalSince1970) {
            throw ApplicationError(code: "id_token_validation_error", message: "Invalid ID token received: failed expiry check")
        }

        self.idTokenClaims = claims
    }

    private func sendAndGetJson(
        operation: String,
        method: String,
        url: String,
        requestData: Data? = nil,
        accessToken: String? = nil) async throws -> Data {

        let url = URL(string: url)
        var request = URLRequest(url: url!)
        request.httpMethod = method
        request.addValue("application/json", forHTTPHeaderField: "accept")
    
        if accessToken != nil {
            request.addValue("Bearer \(accessToken!)", forHTTPHeaderField: "authorization")
        }

        if requestData != nil {
            request.addValue("application/x-www-form-urlencoded", forHTTPHeaderField: "content-type")
            request.httpBody = requestData
        }

        do {
            
            let (data, response) = try await URLSession.shared.data(for: request)
            let httpResponse = response as! HTTPURLResponse
    
            if httpResponse.statusCode < 200 || httpResponse.statusCode > 299 {
                
                throw self.readJsonResponseError(
                    operation: operation,
                    statusCode: httpResponse.statusCode,
                    data: data)
            }
            
            return data
            
        } catch {

            let applicationError = error as? ApplicationError
            if applicationError != nil {
                throw applicationError!
            }

            throw ApplicationError(code: "\(operation)_request_error", message: error.localizedDescription)
       }
    }
    
    private func readJsonResponseError(operation: String, statusCode: Int, data: Data) -> ApplicationError {
        
        let json = try? JSONSerialization.jsonObject(with: data, options: [])
        if json != nil {
            if let fields = json! as? [String: Any] {

                let code = fields["error"] as? String ?? ""
                let message = fields["error_description"] as? String ?? ""
                if !code.isEmpty {
                    return ApplicationError(code: code, message: message, statusCode: statusCode)
                }
            }
        }
        
        return ApplicationError(code: "\(operation)_response_error", message: "HTTP error", statusCode: statusCode)
    }
}
