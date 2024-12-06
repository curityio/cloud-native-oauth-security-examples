/*
 * Events used for inter process calls between the main and renderer processes
 */
export class IpcEventNames {
    public static readonly Initialize  = 'INITIALIZE';
    public static readonly Login       = 'LOGIN';
    public static readonly Reactivate  = 'REACTIVATE';
    public static readonly Logout      = 'LOGOUT';
    public static readonly ApiOrders   = 'API_ORDERS';
    public static readonly UserInfo    = 'USER_INFO';
    public static readonly Refresh     = 'REFRESH';
}
