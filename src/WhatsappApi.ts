import axios, { AxiosError } from 'axios';
import bodyParser from 'body-parser';
import crypto from 'crypto';
import express from 'express';
import FormData from 'form-data';
import fs from 'fs';
import mime from 'mime-types';

import {
    GraphAPIBaseUrl,
    MessageTypes,
    SupportedMediaTypes,
} from './constants';
import { WhatsappApiError } from './errors';
import {
    ApiRequestHeader,
    ApiRequestPayload,
    IncomingMessage,
    WebhookRequestPayload,
} from './types';


class WhatsappAPI {
    private accountPhoneNumberId: string;
    private accessToken: string;
    private expressApp?: express.Application;
    private fbAppSecret?: string;
    private webhookRouter?: express.Router;
    private webhookPort?: number;
    private webhookVerifyToken?: string;
    
    constructor(options: {
        accountPhoneNumberId: string,
        accessToken: string,
        webhook?: {
            expressApp?: express.Application,
            port?: number,
            fbAppSecret: string,
            verifyToken: string,
        },
    }) {
        this.accountPhoneNumberId = options.accountPhoneNumberId;
        this.accessToken = options.accessToken;
        if (options.webhook) {
            this.expressApp = options.webhook.expressApp;
            this.fbAppSecret = options.webhook.fbAppSecret;
            this.webhookPort = options.webhook.port || 1337;
            this.webhookVerifyToken = options.webhook.verifyToken;
        }
    }

    public initWebhook(callback: Function) {
        let shouldAppListen: boolean = false;
        if (!this.expressApp) {
            this.expressApp = express();
            shouldAppListen = true;
        }

        this.webhookRouter = express.Router().use(bodyParser.json({
            verify(req: express.Request & { rawBody: string | Buffer }, res: express.Response, buf: Buffer) {
              req.rawBody = buf.toString();
            },
        }));

        this.webhookRouter.get('/webhook', (req: express.Request, res: express.Response) => {            
            const mode = req.query['hub.mode'],
                  token = req.query['hub.verify_token'],
                  challenge = req.query['hub.challenge'];

            if (mode && token) {
                if (mode === 'subscribe' && token === this.webhookVerifyToken) {
                    res.status(200).send(challenge);
                } else {
                    res.sendStatus(403);
                }
            }
        });

        this.webhookRouter.post('/webhook', (req: express.Request & { rawBody?: string }, res: express.Response, next: express.NextFunction) => {
            const hmac: crypto.Hmac = crypto.createHmac('sha1', this?.fbAppSecret || 'N/A');
            hmac.update(req.rawBody || '', 'ascii');
    
            const expectedSignature: string = hmac.digest('hex');
            if (req.headers['x-hub-signature']?.toString() === `sha1=${expectedSignature}`) {
                next();
            } else {
                res.status(401).send('Invalid signature');
            }
        }, (req: express.Request, res: express.Response) => {  
            let payload: WebhookRequestPayload = req.body;
            
            const messages = this.parseIncomingMessage(payload);

            messages.map((message: IncomingMessage) => {
                if (message.type === MessageTypes.TEXT) {
                    callback(message)
                }
            })

            if(payload){
                res.sendStatus(200);
            } else {
                res.sendStatus(404);
            }
        });

        this.expressApp.use('/whatsapp', this.webhookRouter);

        if (shouldAppListen) {
            this.expressApp.listen(this.webhookPort, () => console.log(`Whatsapp Webhook is listening on port ${this.webhookPort}`));
        }
    }

    public parseIncomingMessage(payload: WebhookRequestPayload) {
        const messages: IncomingMessage[] = [];
        payload.entry.map(entry => {
            entry.changes.map(change => {
                if (change.field === 'messages') {
                    change.value.messages.map(message => {
                        messages.push({
                            ...message,
                            contact: change.value.contacts.filter(contact => contact.wa_id === message.from)[0],
                        });
                    })
                }
            })
        })
        return messages;
    }
    
    private async sendRequest(url: string, payload: object | FormData) {
        const fullUrl: string = `${GraphAPIBaseUrl}/${url}`;
        const headers: ApiRequestHeader = {
            Authorization: `Bearer ${this.accessToken}`,
        }

        try {
            const response = await axios.post(fullUrl, payload, {
                headers,
            })
            return response.data;
        } catch(err) {
            if (err instanceof AxiosError) {
                if (err.response?.data?.error) {
                    throw new WhatsappApiError(err.response?.data?.error)
                }
            }
            throw err;
        }
    }

    private extractMediaType(path: string): [string, MessageTypes] {
        const mimeType = mime.lookup(path);
        if (!mimeType || !SupportedMediaTypes[mimeType]) {
            throw new Error(`Unsupported media type: ${mimeType}`);
        }
        return [mimeType, SupportedMediaTypes[mimeType]]
    }

    private async uploadMedia(path: string): Promise<[string, MessageTypes]> {
        const [mimeType, messageType] = this.extractMediaType(path);

        const data = new FormData();
        data.append("file", fs.createReadStream(path));
        data.append("type", mimeType);
        data.append("messaging_product", "whatsapp");
        
        const mediaResponse = await this.sendRequest(`${this.accountPhoneNumberId}/media`, data);
        return [mediaResponse.id, messageType];
    }

    public async sendTextMessage(
        to: string,
        options: {
            message: string,
            preview_url?: boolean,
        },
    ) {
        const payload: ApiRequestPayload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to,
            type: MessageTypes.TEXT,
            text: {
                body: options.message,
                preview_url: options.preview_url || true,
            },
        }
        return this.sendRequest(`${this.accountPhoneNumberId}/messages`, payload);
    }

    public async sendMediaMessage(
        to: string,
        options: {
            external_link?: string,
            local_path?: string,
            caption?: string,
            filename?: string, // only for documents
        }
    ) {
        if (options.local_path && options.external_link) {
            throw new Error("You must choose local_path or external_link to send image message!")
        }

        let media;
        let messageType: MessageTypes = MessageTypes.IMAGE; // default
        if (options.local_path) {
            const [mediaId, uploadedMediaType] = await this.uploadMedia(options.local_path)
            media = {
                caption: options.caption,
                id: mediaId,
                filename: options.filename,
            }
            messageType = uploadedMediaType;
        } else if (options.external_link) {
            const [_, extractedMediaType] = this.extractMediaType(options.external_link);
            media = {
                link: options.external_link,
                caption: options.caption,
                filename: options.filename,
            }
            messageType = extractedMediaType;
        } else {
            throw new Error("Either local_path or external_link parameter must be set to send image message!");
        }

        if (messageType !== MessageTypes.DOCUMENT && options.filename) {
            throw new Error("filename parameter is only applicable for sending Documents!")
        }

        const payload: ApiRequestPayload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to,
            type: messageType,
            [messageType]: media,
        }
        return this.sendRequest(`${this.accountPhoneNumberId}/messages`, payload);
    }

}

export default WhatsappAPI;