import { WASocket, proto } from "@whiskeysockets/baileys";

export interface BotConfig {
    sessionPath: string;
    logLevel: 'silent' | 'info' | 'debug' | 'warn' | 'error';
    markOnlineOnConnect: boolean;
    browser: [string, string, string];
}

export interface CommandHandler {
    command: string;
    handler: (sock: WASocket, chatId: string, senderId: string, args: string[], message: proto.IWebMessageInfo) => Promise<void>;
    description: string;
}

export interface MessageInfo {
    chatId: string;
    senderId: string;
    messageText: string;
    isFromMe: boolean;
    timestamp: number;
}

export interface AutoReplyPattern {
    pattern: string[];
    response: string;
}
