/*
 * An error container
 */
export class MigrationError extends Error {

    private readonly _json: any;
    
    public constructor(message: string, json: any = null) {
        super(message);
        this._json = json;
    }

    getDetails(): string {

        if (this._json) {
            return JSON.stringify(this._json, null, 2);
        }

        return this.message;
    }
}
