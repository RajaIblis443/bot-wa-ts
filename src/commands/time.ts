import { WASocket } from "@whiskeysockets/baileys";
import { MessageUtils } from "../utils/messageUtils";

/**
 * Time command - Show current time in various formats
 * Usage: .time
 */
export default async function(sock: WASocket, chatId: string): Promise<void> {
    const now = new Date();
    
    const timeText = `🕐 *Current Time*

🌍 *Local Time:*
📅 Date: ${now.toLocaleDateString('id-ID')}
⏰ Time: ${now.toLocaleTimeString('id-ID')}
📆 Day: ${now.toLocaleDateString('id-ID', { weekday: 'long' })}

🌎 *UTC Time:*
📅 Date: ${now.toISOString().split('T')[0]}
⏰ Time: ${now.toISOString().split('T')[1].split('.')[0]}

🕓 *Timestamps:*
🔢 Unix: ${Math.floor(now.getTime() / 1000)}
📱 JavaScript: ${now.getTime()}

⏰ *Quick Info:*
🗓️ Week: ${getWeekNumber(now)}
📊 Day of Year: ${getDayOfYear(now)}`;

    await MessageUtils.sendMessage(sock, chatId, timeText);
}

function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getDayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}
