import { WASocket } from "@whiskeysockets/baileys";
import axios from "axios";
import { MessageUtils } from "../utils/messageUtils";

/**
 * Perintah joke - Ambil lelucon dari API
 * Penggunaan: .joke
 */
export default async function(sock: WASocket, chatId: string): Promise<void> {
    try {
        const response = await axios.get("https://candaan-api.vercel.app/api/text/random");
        const joke = response.data?.data || "Hmm... Leluconnya kabur. Coba lagi nanti ya!";

        const jokeText = `😂 *Lelucon Acak dari Internet*

${joke}

🎭 Ketik *.joke* lagi buat lelucon lainnya!`;

        await MessageUtils.sendMessage(sock, chatId, jokeText);
    } catch (error) {
        console.error("Gagal ambil joke:", error);
        await MessageUtils.sendMessage(sock, chatId, "😢 Gagal mengambil lelucon. Coba lagi nanti ya.");
    }
}
