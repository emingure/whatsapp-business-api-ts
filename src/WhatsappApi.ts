import axios, { AxiosError } from 'axios';
import express from 'express';
import bodyParser from 'body-parser';
import crypto from 'crypto';

import { WhatsappApiError } from './errors';

import {
    ApiRequestHeader,
    ApiRequestPayload,
    MessageTypes,
    WebhookRequestPayload,
    IncomingMessage,
} from './types';


class WhatsappAPI {
    private accountPhoneNumberId: string;
    private accessToken: string;
    private expressApp?: express.Application;
    private appSecret?: string;
    
    constructor(accountPhoneNumberId: string, accessToken: string, appSecret?: string) {
        console.log(appSecret)
        this.accountPhoneNumberId = accountPhoneNumberId;
        this.accessToken = accessToken;
        this.appSecret = appSecret;
    }

    public initWebhook(callback: Function) {
        this.expressApp = express().use(bodyParser.json({
            verify(req: express.Request & { rawBody: string | Buffer }, res, buf) {
              req.rawBody = buf.toString();
            },
        }));

        this.expressApp.post('/webhook', (req: express.Request & { rawBody?: string }, res: express.Response, next: express.NextFunction) => {
            const hmac: crypto.Hmac = crypto.createHmac('sha1', this?.appSecret || 'N/A');
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
        this.expressApp.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));
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
    
    private async sendRequest(payload: any) {
        const url: string = `https://graph.facebook.com/v13.0/${this.accountPhoneNumberId}/messages`;
        const headers: ApiRequestHeader = {
            Authorization: `Bearer ${this.accessToken}`,
        }

        try {
            const response = await axios.post(url, payload, {
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

    public async sendTextMessage(to: string, message: string) {
        const payload: ApiRequestPayload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to,
            type: MessageTypes.TEXT,
            text: {
                body: message,
                preview_url: true,
            },
        }
        return this.sendRequest(payload);
    }

}

export default WhatsappAPI;