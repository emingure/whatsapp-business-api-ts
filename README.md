# WhatsApp Business Cloud API

A Wrapper for Whatsapp Business Cloud API hosted by Meta.

Official API Documentation: [Meta for Developers](https://developers.facebook.com/docs/whatsapp/cloud-api/overview)

## Capabilities

> Note: **This package is WIP**. The capabilities of Cloud API will be reflected soon. Feel free to contribute!

- [ ] Sending Messages
  - [x] Text
  - [x] Media (image, video, audio, document, sticker)
  - [ ] Contact
  - [ ] Location
  - [ ] Interactive
  - [ ] Template
- [ ] Receiving Message (via Webhook)
  - [x] Text
  - [ ] Media (image, video, audio, document, sticker)
  - [ ] Contact
  - [ ] Location
  - [ ] Interactive
  - [ ] Button


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

## Reference

### Text Message
```typescript
sendTextMessage(
  to: string, // Phone number to send message.
  options: {
    message: string, // Message body to send.
    preview_url?: boolean, // Whether urls in body should have preview. Default: true
  },
)
```

### Media Message
Supported media types can be found in `src/contants.ts`.
```typescript
sendMediaMessage(
  to: string, // Phone number to send message.
  options: {
    external_link?: string, // Globally accesible link of media.
    local_path?: string, // Full local path of the media file to upload and send.
    caption?: string, // Caption of the media.
    filename?: string, // Name of the file to show as preview. It is only applicable for sending documents.
  }
)
```