import { WASocket } from "@whiskeysockets/baileys";
import { MessageUtils } from "../utils/messageUtils";

/**
 * Perintah quote - Menampilkan kutipan inspiratif
 * Penggunaan: .quote
 */
export default async function(sock: WASocket, chatId: string): Promise<void> {
    const quotes = [
        {
            text: "Satu-satunya cara untuk melakukan pekerjaan hebat adalah mencintai apa yang kamu lakukan.",
            author: "Steve Jobs"
        },
        {
            text: "Hidup adalah apa yang terjadi saat kamu sibuk membuat rencana lain.",
            author: "John Lennon"
        },
        {
            text: "Masa depan adalah milik mereka yang percaya pada keindahan mimpinya.",
            author: "Eleanor Roosevelt"
        },
        {
            text: "Dalam momen tergelap sekalipun, kita harus tetap fokus untuk melihat cahaya.",
            author: "Aristoteles"
        },
        {
            text: "Satu-satunya perjalanan yang mustahil adalah perjalanan yang tidak pernah dimulai.",
            author: "Tony Robbins"
        },
        {
            text: "Kesuksesan bukanlah akhir, kegagalan bukanlah kehancuran: yang penting adalah keberanian untuk terus melangkah.",
            author: "Winston Churchill"
        },
        {
            text: "Jangan hanya melihat jam; lakukan seperti jam. Terus bergerak.",
            author: "Sam Levenson"
        },
        {
            text: "Cara untuk memulai adalah berhenti bicara dan mulai bertindak.",
            author: "Walt Disney"
        },
        {
            text: "Inovasi membedakan antara pemimpin dan pengikut.",
            author: "Steve Jobs"
        },
        {
            text: "Waktumu terbatas, jangan habiskan untuk menjalani hidup orang lain.",
            author: "Steve Jobs"
        }
    ];

    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

    const quoteText = `💭 *Kutipan Inspiratif*

_"${randomQuote.text}"_

— *${randomQuote.author}*

✨ Tetap semangat ya!
📌 Ketik *.quote* lagi untuk kutipan lainnya!`;

    await MessageUtils.sendMessage(sock, chatId, quoteText);
}
