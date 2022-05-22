abstract class CustomError extends Error{
    constructor(message: string){
        super(message);
        Object.setPrototypeOf(this, CustomError.prototype);
    }
    abstract serializeErrors(): {
        message: string,
        field?: string
    } [];
}


export interface ApiErrorResponse {
    message: string;
    type: string;
    code: number;
    error_data: {
        messaging_product: string;
        details: string;
    };
    error_subcode: number;
    fbtrace_id: string;
}


export class WhatsappApiError extends CustomError {
    payload: ApiErrorResponse;
    errorCode: number;
    constructor(payload: ApiErrorResponse){
        super(payload.message);
        this.payload = payload;
        this.errorCode = payload.code;
        Object.setPrototypeOf(this, WhatsappApiError.prototype);
    }
    serializeErrors(){
        return [{message: this.payload.message}];
    }
}
