import { WASocket } from "@whiskeysockets/baileys";
import { MessageUtils } from "../utils/messageUtils";

/**
 * Status command - Show bot status
 * Usage: .status
 */
export default async function(sock: WASocket, chatId: string): Promise<void> {
    const memoryUsage = process.memoryUsage();
    const memoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const uptime = Math.floor(process.uptime());
    const uptimeText = `${Math.floor(uptime / 60)}m ${uptime % 60}s`;
    
    const statusText = `📊 *Bot Status*

🟢 Status: Online & Active
⏱️ Uptime: ${uptimeText}
💾 Memory: ${memoryMB} MB
🌐 Platform: ${process.platform}
⚡ Node.js: ${process.version}

🤖 Bot is running smoothly!
🔄 Last checked: ${new Date().toLocaleTimeString()}`;

    await MessageUtils.sendMessage(sock, chatId, statusText);
}
