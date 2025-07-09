import { WASocket } from "@whiskeysockets/baileys";
import { MessageUtils } from "../utils/messageUtils";

/**
 * Test command - Simple test command
 * Usage: .test [message]
 */
export default async function(sock: WASocket, chatId: string, senderId: string, args: string[]): Promise<void> {
    const testMessage = args.join(' ') || 'No message provided';
    
    const responseText = `🧪 *Test Command*

📨 Original message: "${testMessage}"
👤 From: ${senderId}
🎯 Chat: ${chatId}
🕐 Time: ${new Date().toLocaleString()}

✅ Test command is working!
🔥 This command was loaded dynamically!

💡 Try: .test Hello from dynamic command!`;

    await MessageUtils.sendMessage(sock, chatId, responseText);
}
