import { WASocket } from "@whiskeysockets/baileys";
import { MessageUtils } from "../utils/messageUtils";

/**
 * Command menu sederhana
 * Penggunaan: .menu
 */
export default async function(sock: WASocket, chatId: string): Promise<void> {
    const menuText = `┏━━━━━━━━━━━━━━━━━┓
┃  📋 *Menu Perintah Bot*  ┃
┗━━━━━━━━━━━━━━━━━┛

🔥 *Perintah Dasar:*
> *.help* — Menu bantuan lengkap  
> *.menu* — Menu perintah singkat  
> *.commands* — Daftar semua perintah  
> *.ping* — Cek status bot  
> *.info* — Informasi bot  
> *.status* — Status bot  
> *.time* — Waktu saat ini  

🖼️ *Perintah Media:*
> *.sticker* — Buat stiker dari gambar/video  
> • .stext <text> - Add text to sticker

🎭 *Perintah Seru:*
> *.joke* — Lelucon acak  
> *.quote* — Kutipan inspiratif  
> *.example* — Contoh perintah  
> *.test* — Perintah percobaan  

🛠️ *Perintah Admin:*
> *.reload* — Muat ulang perintah (admin only)  

📌 *Tips:*
> Ketik salah satu perintah untuk mulai!  
> Untuk *.sticker*, reply foto/video dengan perintah *.sticker* `;

    await MessageUtils.sendMessage(sock, chatId, menuText);
}
