--
-- The main plugin implementation that can run in an NGINX system with the LUA module enabled
--

local _M = {}

local base64 = require 'ngx.base64'
local cipher = require 'resty.openssl.cipher'

local GCM_IV_SIZE     = 12
local GCM_TAG_SIZE    = 16

local function array_has_value(arr, val)
    for index, value in ipairs(arr) do
        if value == val then
            return true
        end
    end
    return false
end

local function from_hex(str)
    return (str:gsub('..', function (cc)
        return string.char(tonumber(cc, 16))
    end))
end

--
-- Verify configuration and set defaults that are the same for all requests
--
local function initialize_configuration(config)

    if config                      == nil or
       config.cookie_name_prefix   == nil or
       config.encryption_key       == nil then
         ngx.log(ngx.WARN, 'The OAuth proxy configuration is invalid and must be corrected')
         return false
    end
    return true
end

--
-- Return a custom error body while also allowing a CORS plugin to add its response headers
--
local function error_response(status, code, message, config)

    local method = ngx.req.get_method():upper()
    if method ~= 'HEAD' then
    
        local jsonData = '{"code":"' .. code .. '", "message":"' .. message .. '"}'
        ngx.status = status
        ngx.header['content-type'] = 'application/json'
        ngx.say(jsonData)
    end
    
    ngx.exit(status)
end

local function server_error_response(config)
    error_response(ngx.HTTP_INTERNAL_SERVER_ERROR, 'server_error', 'Problem encountered processing the request', config)
end

local function unauthorized_request_error_response(config)
    error_response(ngx.HTTP_UNAUTHORIZED, 'unauthorized', 'Access denied due to missing or invalid credentials', config)
end

local function bad_request_error_response(config)
    error_response(ngx.HTTP_BAD_REQUEST, 'bad_request', 'Access denied due to invalid request details', config)
end

local function get_encryption_key_bytes(config)

    if #config.encryption_key ~= 64 then
        ngx.log(ngx.WARN, 'The encryption key must be supplied as 64 hex characters')
        return nil
    end
    
    local encryption_key_bytes
    if not pcall(function() encryption_key_bytes = from_hex(config.encryption_key) end) then
        ngx.log(ngx.WARN, 'The encryption key contains invalid hex characters')
        return nil
    end

    return encryption_key_bytes
end

--
-- Perform the AES256-GCM decryption work and any errors due to bad input result in a 401 error
--
local function decrypt_cookie(encrypted_cookie, encryption_key_bytes)

    local all_bytes, err = base64.decode_base64url(encrypted_cookie)
    if err then
        ngx.log(ngx.WARN, 'A received cookie could not be base64url decoded: ' .. err)
        return nil
    end

    local min_size = GCM_IV_SIZE + 1 + GCM_TAG_SIZE
    if #all_bytes < min_size then
        ngx.log(ngx.WARN, 'A received cookie had an invalid length')
        return nil
    end

    offset = 1
    local iv_bytes = string.sub(all_bytes, offset, GCM_IV_SIZE)
  
    offset = 1 + GCM_IV_SIZE
    local ciphertext_bytes = string.sub(all_bytes, offset, #all_bytes - GCM_TAG_SIZE)

    offset = #all_bytes - GCM_TAG_SIZE + 1
    local tag_bytes = string.sub(all_bytes, offset)

    local cipher = cipher.new('aes-256-gcm')
    local decrypted_cookie, err = cipher:decrypt(encryption_key_bytes, iv_bytes, ciphertext_bytes, true, nil, tag_bytes)
    if err then
        ngx.log(ngx.WARN, 'Error decrypting cookie: ' .. err)
        return nil
    end

    return decrypted_cookie
end

--
-- The public entry point to decrypt a secure cookie from SPAs and forward the contained access token
--
function _M.run(config)

    -- Pre-flight requests cannot contain cookies, so return
    local method = ngx.req.get_method():upper()
    if method == 'OPTIONS' then
        return
    end

    -- Enforce the required custom header to ensure that CORS preflights take place
    local custom_header = ngx.req.get_headers()['token-handler-version']
    if not custom_header or custom_header ~= '1' then
        ngx.log(ngx.WARN, 'The request did not include the required custom header')
        bad_request_error_response(config)
        return
    end

    -- Next get the encryption key as bytes
    local encryption_key_bytes = get_encryption_key_bytes(config)
    if not encryption_key_bytes then
        server_error_response(config)
        return
    end

    -- Get the access token cookie
    local at_cookie_name = 'cookie_' .. config.cookie_name_prefix .. '-at'
    local at_cookie = ngx.var[at_cookie_name]
    if not at_cookie then
        ngx.log(ngx.WARN, 'No access token cookie was sent with the request')
        unauthorized_request_error_response(config)
        return
    end

    -- Decrypt the access token cookie
    local access_token = decrypt_cookie(at_cookie, encryption_key_bytes)
    if not access_token then
        ngx.log(ngx.WARN, 'Error decrypting access token cookie')
        unauthorized_request_error_response(config)
        return
    end

    -- Set the request header to supply the access token to the next plugin or the target API
    ngx.req.set_header('authorization', 'Bearer ' .. access_token)

    -- Clear headers of no interest to the target API
    ngx.req.clear_header('cookie')
end

return _M
