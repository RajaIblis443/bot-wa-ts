import { WASocket } from "@whiskeysockets/baileys";
import { MessageUtils } from "../utils/messageUtils";

/**
 * Command menu sederhana
 * Penggunaan: .menu
 */
export default async function(sock: WASocket, chatId: string): Promise<void> {
    const menuText = `📋 *Menu Perintah Bot*

🔥 *Perintah Dasar:*
• .help - Menu bantuan lengkap
• .menu - Menu perintah singkat
• .commands - Daftar semua perintah
• .ping - Cek status bot
• .info - Informasi bot
• .status - Status bot
• .time - Waktu saat ini

🖼️ *Perintah Media:*
• .sticker - Membuat sticker dari gambar atau video
• .stext <text> - Add text to sticker
• .tgen <text> - Generate sticker from text only (font 60)

🎭 *Perintah Seru:*
• .joke - Lelucon acak
• .quote - Kutipan inspiratif
• .example - Contoh perintah
• .test - Perintah test

🛠️ *Perintah Admin:*
• .reload - Muat ulang perintah (khusus admin)

🔧 *Perintah Sistem:*
• .ffmpeg - Cek dukungan FFmpeg untuk text rendering
• .system - Info sistem dan capabilities

⚠️ *Penting untuk .stext:*
• Memerlukan FFmpeg dengan libfreetype, libharfbuzz, libfribidi
• Gunakan .ffmpeg untuk cek dan petunjuk instalasi
• Jalankan install-ffmpeg.sh untuk instalasi otomatis

🤖 Ketik salah satu perintah untuk mulai!
💡 Untuk .sticker: reply foto/video dengan .sticker
💡 Untuk .stext: reply foto/video dengan .stext <text>
💡 Untuk .tgen: langsung ketik .tgen <text anda>
`;

    await MessageUtils.sendMessage(sock, chatId, menuText);
}
