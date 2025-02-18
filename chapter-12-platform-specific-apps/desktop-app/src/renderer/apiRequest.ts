import {ApplicationError} from '../shared/applicationError';
import {IpcEventNames} from '../shared/ipcEventNames';
import {ApiOptions} from './apiOptions';
import {ipcRequest} from './ipcRequest';

/*
 * A generic method in the React app to make reliable API that handle token refresh and expiry
 */
export async function makeApiRequest(options: ApiOptions): Promise<any> {
        
    try {

        // Try the API request with the current access token
        return await callApi(options);

    } catch (e1: any) {

        const error1 = e1 as ApplicationError;
        if (error1?.statusCode !== 401) {
            throw e1;
        }

        try {

            // If there is a 401 then try to refresh the access token
            await refreshAccessToken();

        } catch (e2: any) {

            const error2 = e2 as ApplicationError;
            if (error2?.errorCode !== 'invalid_grant') {
                throw e2;
            }

            // Indicate a login is required if refresh fails with an invalid_grant error
            throw new ApplicationError('login_required', 'User must re-authenticate');
        }

        // Retry the API request with the refreshed access token
        return await callApi(options);
    }
}

async function callApi(options: ApiOptions): Promise<any> {
    return await ipcRequest(options.name, options.requestData || {});
}

async function refreshAccessToken(): Promise<void> {
    await ipcRequest(IpcEventNames.Refresh);
}
