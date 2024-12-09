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

class ApiClient {
    
    private var oauthClient: OAuthClient
    
    init(oauthClient: OAuthClient) {
        self.oauthClient = oauthClient
    }

    func getApiData() async throws -> [Order] {

        let responseData = try await makeApiRequestWithExpiryHandling(operation: "api_data", url: Configuration.apiBaseUrl)

        let decoder = JSONDecoder()
        if let result = try? decoder.decode([Order].self, from: responseData) {
            return result
        } else {
            throw ApplicationError(code: "api_response_error", message: "Unable to read JSON data from the API response")
        }
    }

    func getUserInfo() async throws -> UserInfo {
        
        let userInfoEndpoint = self.oauthClient.getUserInfoEndpoint()
        let responseData = try await makeApiRequestWithExpiryHandling(operation: "user_info", url: userInfoEndpoint!)
        
        let json = try? JSONSerialization.jsonObject(with: responseData, options: [])
        if json != nil {
            if let fields = json! as? [String: Any] {
                let userInfo = UserInfo()
                userInfo.givenName = fields["given_name"] as? String ?? ""
                userInfo.familyName = fields["family_name"] as? String ?? ""
                return userInfo
            }
        }
        
        throw ApplicationError(code: "api_response_error", message: "Unable to read JSON data from the userinfo response")
    }
    
    private func makeApiRequestWithExpiryHandling(operation: String, url: String) async throws -> Data {
        
        do {
            // Try the request
            return try await getDataFromApi(operation: operation, url: url)
            
        } catch {
            
            // Rethrow if this is not an access token expiry error
            let applicationError = error as! ApplicationError
            if applicationError.statusCode != 401 {
                throw error
            }
            
            do {
                
                // Handle access token expiry by refreshing the access token
                try await self.oauthClient.refreshAccessToken()

            } catch {
                
                // When there is an invalid_grant response during token refresh, the refresh token is expired
                // The code throws a login required error back to the view model
                let refreshError = error as! ApplicationError
                if refreshError.code == "invalid_grant" {
                    refreshError.code = "login_required"
                }
                
                throw refreshError
            }
            
            // If token refresh succeeds, retry the request once with the new the access token
            return try await getDataFromApi(operation: operation, url: url)
        }
    }
    
    private func getDataFromApi(operation: String, url: String) async throws -> Data {
        
        let url = URL(string: url)
        var request = URLRequest(url: url!)
        request.httpMethod = "GET"
        request.addValue("application/json", forHTTPHeaderField: "accept")
    
        let accessToken = self.oauthClient.getAccessToken()
        if accessToken != nil {
            request.addValue("Bearer \(accessToken!)", forHTTPHeaderField: "authorization")
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

                let code = fields["code"] as? String ?? ""
                let message = fields["mnessage"] as? String ?? ""
                if !code.isEmpty {
                    return ApplicationError(code: code, message: message, statusCode: statusCode)
                }
            }
        }
        
        return ApplicationError(code: "\(operation)_response_error", message: "HTTP error", statusCode: statusCode)
    }
}
