import {
    MessageTypes,
} from './constants';

export type OutgoingTextPayload = {
    preview_url: boolean;
    body: string;
}

export type OutgoingMediaPayload = {
    id?: string;
    link?: string;
    caption?: string;
    filename?: string;
}

export type ApiRequestPayload = {
    messaging_product: string;
    recipient_type: string;
    to: string;
    type: MessageTypes;
    text?: OutgoingTextPayload;
    image?: OutgoingMediaPayload;
}

export type ApiRequestHeader = {
    Authorization: string;
}

type WebhookContact = {
    profile: {
        name: string;
    };
    wa_id: string;
}

type WebhookError = {

}

type WebhookMessage = {
    audio?: object;
    button?: object;
    context?: object;
    document?: object;
    errors?: object[];
    from: string;
    id: string;
    identity?: object;
    image?: object;
    interactive?: object;
    referral?: object;
    sticker?: object;
    system?: object;
    text?: {
        body: string;
    },
    timestamp: string;
    type: MessageTypes;
    video?: object;
}

type WebhookStatuses = {

}

type WebhookChange = {
    value: {
        messaging_product: string;
        metadata: {
            display_phone_number: string;
            phone_number_id: string;
        },
        contacts: WebhookContact[];
        errors: WebhookError[] | undefined;
        messages: WebhookMessage[];
        statuses: WebhookStatuses[] | undefined;
    },
    field: string;
}

type WebhookEntry = {
    id: string;
    changes: WebhookChange[];
}

export interface WebhookRequestPayload {
    object: string;
    entry: WebhookEntry[];
}

export type IncomingMessage = WebhookMessage & {
    contact: WebhookContact
}