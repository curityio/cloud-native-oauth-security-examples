/*
 * An example customer user record
 */
export interface Customer {
    
    // The existing customer identifier
    id: number;

    // In this example, these fields are core identity attributes and migrated to the authorization server
    userName?: string;
    email?: string;
    country?: string;
    roles?: string[];

    // In this example, these fields are considered product specific and are left in the customer data
    membershipLevel: string;
    membershipExpires: string;
}
