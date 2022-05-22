# WhatsApp Business Cloud API

A Wrapper for Whatsapp Business Cloud API hosted by Meta.

Official API Documentation: [Meta for Developers](https://developers.facebook.com/docs/whatsapp/cloud-api/overview)

> Note: **This package is WIP**. The capabilities of Cloud API will be reflected soon. Feel free to contribute!

## Installation
```
npm install --save whatsapp-business-api
```

## How to Use

### Sending Messages
```typescript
import WhatsappAPI from "whatsapp-business-api";


const wp = new WhatsappAPI({
    accountPhoneNumberId: "<phone-number-id>", // required
    accessToken: "<access-token>", // required
})

await wp.sendTextMessage("<phone-number-to-send>", "<plain-message>");
```

### Sending + Receiving Messsages
To receive messages from Whatsapp Business, you need to serve an endpoint with GET and POST methods. GET will be used to verify the endpoint and POST will be used to receive changes on API (in this case the incoming messages). 

After setting up the webhook endpoint using this package, you need to configure the webhook on Meta Developers Platform.

> By default, library will create a new Express Application to setup webhook. If you want to use your own Express Application you can pass it with webhook options using `expressApp` key.

```typescript
import WhatsappAPI from "whatsapp-business-api";


const wp = new WhatsappAPI({
  accountPhoneNumberId: "<phone-number-id>", // required
  accessToken: "<access-token>", // required
  webhook: {
    fbAppSecret: "<facebook-app-secret>", // required to setup Webhook
    port: 1234, // default: 1337
    verifyToken: "<verify-token>",
  },
})

const echoMessage = async (message: IncomingMessage) => {
  await wp.sendTextMessage(message.from, message.text.body);
}

wp.initWebhook(echoMessage);
```