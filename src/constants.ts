export const GraphAPIBaseUrl: string = "https://graph.facebook.com/v13.0";

export enum MessageTypes {
    TEXT = "text",
    IMAGE = "image",
    DOCUMENT = "document",
    AUDIO = "audio",
    VIDEO = "video",
    STICKER = "sticker",
};

export const SupportedMediaTypes: {[key: string]: MessageTypes} = {
    // Image
    "image/jpeg": MessageTypes.IMAGE,
    "image/png": MessageTypes.IMAGE,
    // Documents
    "text/plain": MessageTypes.DOCUMENT,
    "application/pdf": MessageTypes.DOCUMENT,
    "application/vnd.ms-powerpoint": MessageTypes.DOCUMENT,
    "application/msword": MessageTypes.DOCUMENT,
    "application/vnd.ms-excel": MessageTypes.DOCUMENT,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": MessageTypes.DOCUMENT,
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": MessageTypes.DOCUMENT,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": MessageTypes.DOCUMENT,
    // Audio
    "audio/aac": MessageTypes.AUDIO,
    "audio/mp4": MessageTypes.AUDIO,
    "audio/mpeg": MessageTypes.AUDIO,
    "audio/amr": MessageTypes.AUDIO,
    "audio/ogg": MessageTypes.AUDIO,
    "audio/opus": MessageTypes.AUDIO,
    // Video
    "video/mp4": MessageTypes.VIDEO,
    "video/3gp": MessageTypes.VIDEO,
    // Stickers
    "image/webp": MessageTypes.VIDEO,
};
