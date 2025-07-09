import { WASocket, proto } from "@whiskeysockets/baileys";

/**
 * Utility class for message operations
 */
export class MessageUtils {
    private static currentMessage: proto.IWebMessageInfo | null = null;

    static setCurrentMessage(message: proto.IWebMessageInfo): void {
        this.currentMessage = message;
    }

    static getCurrentMessage(): proto.IWebMessageInfo | null {
        return this.currentMessage;
    }

    /**
     * Send a text message
     */
    static async sendMessage(sock: WASocket, chatId: string, text: string): Promise<void> {
        try {
            await sock.sendMessage(chatId, { text });
        } catch (error) {
            console.error('❌ Error sending message:', error);
        }
    }

    /**
     * Send an image message
     */
    static async sendImage(sock: WASocket, chatId: string, imageBuffer: Buffer, caption?: string): Promise<void> {
        try {
            await sock.sendMessage(chatId, {
                image: imageBuffer,
                caption
            });
        } catch (error) {
            console.error('❌ Error sending image:', error);
        }
    }

    /**
     * Send a sticker
     */
    static async sendSticker(sock: WASocket, chatId: string, stickerBuffer: Buffer): Promise<void> {
        try {
            await sock.sendMessage(chatId, {
                sticker: stickerBuffer,
                mimetype: 'image/webp'
            });
        } catch (error) {
            console.error('❌ Error sending sticker:', error);
        }
    }

    /**
     * Extract message text from various message types
     */
    static extractMessageText(message: proto.IWebMessageInfo): string {
        return message.message?.conversation || 
               message.message?.extendedTextMessage?.text || 
               message.message?.imageMessage?.caption || 
               message.message?.videoMessage?.caption || 
               message.message?.documentMessage?.caption || '';
    }

    /**
     * Check if message is from status broadcast
     */
    static isStatusBroadcast(message: proto.IWebMessageInfo): boolean {
        return message.key.remoteJid === 'status@broadcast';
    }

    /**
     * Check if message is from bot itself
     */
    static isFromBot(message: proto.IWebMessageInfo): boolean {
        return message.key.fromMe || false;
    }

    /**
     * Get sender ID from message
     */
    static getSenderId(message: proto.IWebMessageInfo): string {
        return message.key.participant || message.key.remoteJid || '';
    }

    /**
     * Get chat ID from message
     */
    static getChatId(message: proto.IWebMessageInfo): string {
        return message.key.remoteJid || '';
    }

    /**
     * Check if message has media
     */
    static hasMedia(message: proto.IWebMessageInfo): boolean {
        return !!(message.message?.imageMessage || 
                 message.message?.videoMessage || 
                 message.message?.documentMessage ||
                 message.message?.audioMessage);
    }

    /**
     * Get media type from message
     */
    static getMediaType(message: proto.IWebMessageInfo): string | null {
        if (message.message?.imageMessage) return 'image';
        if (message.message?.videoMessage) return 'video';
        if (message.message?.documentMessage) return 'document';
        if (message.message?.audioMessage) return 'audio';
        return null;
    }

    /**
     * Format uptime to readable string
     */
    static formatUptime(uptimeSeconds: number): string {
        const days = Math.floor(uptimeSeconds / (24 * 60 * 60));
        const hours = Math.floor((uptimeSeconds % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((uptimeSeconds % (60 * 60)) / 60);
        const seconds = Math.floor(uptimeSeconds % 60);

        if (days > 0) return `${days}d ${hours}h ${minutes}m`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        if (minutes > 0) return `${minutes}m ${seconds}s`;
        return `${seconds}s`;
    }

    /**
     * Get random item from array
     */
    static getRandomItem<T>(array: T[]): T {
        return array[Math.floor(Math.random() * array.length)];
    }

    /**
     * Validate URL
     */
    static isValidUrl(string: string): boolean {
        try {
            new URL(string);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Clean phone number (remove special characters)
     */
    static cleanPhoneNumber(phone: string): string {
        return phone.replace(/\D/g, '');
    }

    /**
     * Generate mention text
     */
    static generateMention(phoneNumber: string): string {
        return `@${phoneNumber.replace('@s.whatsapp.net', '')}`;
    }
}
