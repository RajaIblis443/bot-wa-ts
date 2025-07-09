import { WASocket, proto } from "@whiskeysockets/baileys";
import { MessageUtils } from "../utils/messageUtils";
import { HtmlTextRenderer } from "../utils/htmlTextRenderer";
import { EmojiTextRenderer } from "../utils/emojiTextRenderer";

/**
 * Text Generator command - Create sticker from text only with font size 60
 * Usage: .tgen <text>
 */
export default async function(sock: WASocket, chatId: string, _senderId: string, args: string[], messageParam?: proto.IWebMessageInfo): Promise<void> {
    try {
        // Get current message - use parameter if available, otherwise fallback to MessageUtils
        const currentMessage = messageParam || MessageUtils.getCurrentMessage();
        
        if (!currentMessage) {
            await MessageUtils.sendMessage(sock, chatId, '❌ Tidak dapat mengakses pesan saat ini.');
            return;
        }

        // Get text from arguments
        const textContent = args.join(' ').trim();
        
        if (!textContent) {
            await MessageUtils.sendMessage(sock, chatId, 
                `❌ *Text Generator Sticker*
                
📝 *Cara Penggunaan:*
• .tgen <text yang ingin dijadikan sticker>
• Font size otomatis: 60

💡 *Contoh:*
• .tgen Hello World!
• .tgen Selamat Pagi 🌅
• .tgen EPIC TEXT ⚡
• .tgen Happy Birthday 🎉

✨ *Fitur:*
• Support emoji lengkap
• Font size besar (60) untuk keterbacaan
• Background transparan
• Kualitas tinggi`
            );
            return;
        }

        // Check if text contains emoji for rendering method selection
        const hasEmoji = EmojiTextRenderer.hasEmojiEnhanced(textContent);
        
        // Send processing message
        await MessageUtils.sendMessage(sock, chatId, 
            `🔄 *Generating text sticker...*
            
📝 Text: "${textContent}"
📏 Font Size: 60
${hasEmoji ? '😀 Emoji: Terdeteksi' : '📝 Text: Pure text'}
⚡ Method: ${hasEmoji ? 'FFmpeg (Emoji Support)' : 'HTML/CSS (High Quality)'}`);

        let stickerBuffer: Buffer;

        try {
            if (hasEmoji) {
                // Use FFmpeg for emoji support
                try {
                    stickerBuffer = await EmojiTextRenderer.generateTextOnlySticker(textContent, {
                        fontSize: 60,
                        fontColor: '#ffffff',
                        backgroundColor: 'transparent',
                        padding: 20,
                        maxWidth: 512,
                        maxHeight: 512
                    });
                    
                    await MessageUtils.sendMessage(sock, chatId, '✅ FFmpeg emoji text sticker berhasil dibuat!');
                } catch (ffmpegError) {
                    console.warn('FFmpeg emoji rendering failed, trying HTML fallback:', ffmpegError);
                    
                    // Fallback to HTML/CSS even for emoji text
                    stickerBuffer = await HtmlTextRenderer.generateTextOnlySticker(textContent, {
                        fontSize: 60,
                        fontFamily: 'Arial, "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif',
                        fontWeight: 'bold',
                        color: '#ffffff',
                        backgroundColor: 'transparent',
                        padding: 20,
                        maxWidth: 512,
                        maxHeight: 512,
                        textAlign: 'center',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                    });
                    
                    await MessageUtils.sendMessage(sock, chatId, '✅ HTML/CSS emoji fallback text sticker berhasil dibuat!');
                }
                
            } else {
                // Use HTML/CSS for better quality pure text
                try {
                    stickerBuffer = await HtmlTextRenderer.generateTextOnlySticker(textContent, {
                        fontSize: 60,
                        fontFamily: 'Arial, sans-serif',
                        fontWeight: 'bold',
                        color: '#ffffff',
                        backgroundColor: 'transparent',
                        padding: 20,
                        maxWidth: 512,
                        maxHeight: 512,
                        textAlign: 'center',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                    });
                    
                    await MessageUtils.sendMessage(sock, chatId, '✅ HTML/CSS text sticker berhasil dibuat!');
                } catch (htmlError) {
                    console.warn('HTML rendering failed, trying FFmpeg fallback:', htmlError);
                    
                    // Fallback to FFmpeg
                    stickerBuffer = await EmojiTextRenderer.generateTextOnlySticker(textContent, {
                        fontSize: 60,
                        fontColor: '#ffffff',
                        backgroundColor: 'transparent', 
                        padding: 20,
                        maxWidth: 512,
                        maxHeight: 512
                    });
                    
                    await MessageUtils.sendMessage(sock, chatId, '✅ FFmpeg fallback text sticker berhasil dibuat!');
                }
            }
            
        } catch (renderError) {
            console.error('Primary rendering failed, using FFmpeg fallback:', renderError);
            
            // Final fallback to FFmpeg method
            stickerBuffer = await EmojiTextRenderer.generateTextOnlySticker(textContent, {
                fontSize: 60,
                fontColor: '#ffffff',
                backgroundColor: 'transparent', 
                padding: 20,
                maxWidth: 512,
                maxHeight: 512
            });
            
            await MessageUtils.sendMessage(sock, chatId, '✅ FFmpeg final fallback text sticker berhasil dibuat!');
        }

        // Send sticker
        await MessageUtils.sendSticker(sock, chatId, stickerBuffer);

        console.log(`✅ Text-only sticker "${textContent}" generated and sent successfully`);

    } catch (error) {
        console.error('❌ Error in tgen command:', error);
        
        // Enhanced error handling
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        await MessageUtils.sendMessage(sock, chatId, 
            `❌ *Error membuat text sticker:*

📋 Error: ${errorMessage.substring(0, 150)}...

💡 *Tips:*
• Coba text yang lebih pendek
• Hindari karakter khusus yang rumit
• Gunakan .help untuk bantuan lainnya`);
    }
}
