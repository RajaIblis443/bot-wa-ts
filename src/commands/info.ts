import { WASocket } from "@whiskeysockets/baileys";
import { MessageUtils } from "../utils/messageUtils";

/**
 * Info command - Show bot information
 * Usage: .info
 */
export default async function(sock: WASocket, chatId: string): Promise<void> {
    const memoryUsage = process.memoryUsage();
    const memoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const uptime = MessageUtils.formatUptime(process.uptime());
    
    const infoText = `ℹ️ *Bot Information*

🤖 **WhatsApp Bot v2.0**
🔧 Dynamic Command System
📱 Built with Baileys
⚡ Node.js Runtime

📊 **System Stats:**
💾 Memory: ${memoryMB} MB
⏱️ Uptime: ${uptime}
🚀 Status: Online

🎯 **Features:**
• Dynamic command loading
• Hot reload support
• Modular architecture
• Easy to extend

💻 **Developer:** RajaIblis443 (GITHUB)
🌟 **Prefix:** . (dot)`;

    await MessageUtils.sendMessage(sock, chatId, infoText);
}
