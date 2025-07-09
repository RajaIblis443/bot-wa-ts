import { WASocket } from "@whiskeysockets/baileys";
import { MessageUtils } from "../utils/messageUtils";

/**
 * Ping command - Check bot status
 * Usage: .ping
 */
export default async function(sock: WASocket, chatId: string): Promise<void> {
    const uptime = MessageUtils.formatUptime(process.uptime());
    const pingText = `🏓 Pong! Bot is online!
⏱️ Uptime: ${uptime}
🤖 Status: Active
📡 Connection: Stable`;

    await MessageUtils.sendMessage(sock, chatId, pingText);
}
