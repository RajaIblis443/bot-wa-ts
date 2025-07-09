import { WASocket, proto } from "@whiskeysockets/baileys";
import { MessageUtils } from "../utils/messageUtils";
import { EmojiTextRenderer } from "../utils/emojiTextRenderer";
import { HtmlTextRenderer } from "../utils/htmlTextRenderer";
import { TextCompositeRenderer } from "../utils/textCompositeRenderer";
import { downloadMediaMessage } from "@whiskeysockets/baileys";

/**
 * Sticker Text command - Convert image/video to sticker with text overlay
 * Usage: .stext <text> (reply to image/video)
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
        const textOverlay = args.join(' ').trim();
        
        if (!textOverlay) {
            const styles = Object.keys(HtmlTextRenderer.getTextStyles()).join(', ');
            await MessageUtils.sendMessage(sock, chatId, 
                `❌ *Sticker Text dengan HTML/CSS*
                
📸 *Cara Penggunaan:*
• Reply foto/video dengan .stext [style] <text>
• Contoh: .stext meme Hello World
• Contoh: .stext neon EPIC TEXT

🎨 *Style Tersedia:*
• ${styles}

💡 *Contoh Lengkap:*
• .stext meme TOP TEXT
• .stext title Beautiful Title
• .stext comic Fun Text! �
• .stext neon GLOWING TEXT
• .stext watermark © 2024`
);
            return;
        }

        let targetMessage = currentMessage;
        
        // Check if this is a quoted message (reply)
        if (currentMessage.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            targetMessage = {
                key: {
                    remoteJid: currentMessage.message.extendedTextMessage.contextInfo?.participant || chatId,
                    fromMe: false,
                    id: currentMessage.message.extendedTextMessage.contextInfo?.stanzaId || ''
                },
                message: currentMessage.message.extendedTextMessage.contextInfo.quotedMessage,
                messageTimestamp: currentMessage.messageTimestamp || Date.now()
            };
        }

        const message = targetMessage.message;
        let mediaType: 'image' | 'video' | null = null;

        // Check media type
        if (message?.imageMessage) {
            mediaType = 'image';
        } else if (message?.videoMessage) {
            mediaType = 'video';
        } else {
            await MessageUtils.sendMessage(sock, chatId, 
                `❌ *Media tidak ditemukan!*
                
📸 Silakan reply foto atau video dengan:
• .stext <text yang ingin ditambahkan>

💡 Contoh:
• Reply foto → .stext Halo Dunia 
• Reply video → .stext Lucu Banget`);
            return;
        }

        // Parse text style if specified
        const predefinedStyles = Object.keys(HtmlTextRenderer.getTextStyles());
        let textStyle = 'meme';
        let actualText = textOverlay;
        
        // Check if first argument is a predefined style
        const textArgs = textOverlay.split(' ');
        const firstArg = textArgs[0]?.toLowerCase();
        if (firstArg && predefinedStyles.includes(firstArg)) {
            textStyle = firstArg;
            actualText = textArgs.slice(1).join(' ').trim();
        }
        
        // Legacy style parsing with colon syntax
        const styleMatch = textOverlay.match(/^(meme|title|caption|watermark|comic|neon):\s*(.+)$/);
        if (styleMatch) {
            textStyle = styleMatch[1];
            actualText = styleMatch[2];
        }

        if (!actualText) {
            await MessageUtils.sendMessage(sock, chatId, 
                `❌ *Teks tidak boleh kosong!*
                
Gunakan: .stext ${textStyle} <text anda>`);
            return;
        }

        // Check rendering capabilities first
        const capabilities = await TextCompositeRenderer.checkAvailability();

        // Send processing message
        await MessageUtils.sendMessage(sock, chatId, 
            `🔄 *Processing ${mediaType === 'image' ? 'foto' : 'video'} dengan HTML/CSS text...*
            
📝 Text: "${actualText}"
🎨 Style: ${textStyle}
🖼️ Media: ${mediaType}
⚡ Method: ${capabilities.html ? 'HTML/CSS (Primary)' : 'FFmpeg Only'} → FFmpeg fallback`);

        // Download media
        const buffer = await downloadMediaMessage(targetMessage, 'buffer', {});
        
        if (!buffer) {
            await MessageUtils.sendMessage(sock, chatId, '❌ Gagal download media!');
            return;
        }

        // Check rendering capabilities
        let stickerBuffer: Buffer;

        if (capabilities.html || capabilities.ffmpeg) {
            try {
                if (mediaType === 'image') {
                    // Prioritize HTML/CSS rendering for better quality and transparency
                    if (capabilities.html) {
                        try {
                            stickerBuffer = await TextCompositeRenderer.compositeHtmlTextOverImage(
                                buffer, 
                                actualText, 
                                { style: textStyle, method: 'html' }
                            );
                            
                            await MessageUtils.sendMessage(sock, chatId, '✅ HTML/CSS rendering berhasil!');
                        } catch (htmlError) {
                            console.log('HTML rendering failed, trying FFmpeg fallback:', htmlError);
                            
                            // Fallback to FFmpeg method
                            const styleMap = {
                                meme: { fontSize: 40, fontColor: '#ffffff', position: 'top' as const },
                                title: { fontSize: 48, fontColor: '#ffffff', position: 'top' as const },
                                caption: { fontSize: 32, fontColor: '#ffffff', position: 'center' as const },
                                watermark: { fontSize: 24, fontColor: 'rgba(255,255,255,0.7)', position: 'bottom' as const },
                                comic: { fontSize: 36, fontColor: '#ffffff', position: 'center' as const },
                                neon: { fontSize: 42, fontColor: '#00ff00', position: 'center' as const }
                            };
                            
                            const config = styleMap[textStyle as keyof typeof styleMap] || styleMap['meme'];
                            stickerBuffer = await EmojiTextRenderer.processImageWithText(buffer, actualText, {
                                fontSize: config.fontSize,
                                fontColor: config.fontColor,
                                position: config.position
                            });
                            
                            await MessageUtils.sendMessage(sock, chatId, '✅ FFmpeg fallback berhasil!');
                        }
                    } else {
                        // Only FFmpeg available
                        stickerBuffer = await TextCompositeRenderer.compositeHtmlTextOverImage(
                            buffer, 
                            actualText, 
                            { style: textStyle, method: 'ffmpeg' }
                        );
                        
                        await MessageUtils.sendMessage(sock, chatId, '✅ FFmpeg composite berhasil!');
                    }
                } else {
                    // For video, HTML rendering is not practical, use FFmpeg processing
                    const styleMap = {
                        meme: { fontSize: 40, fontColor: '#ffffff', position: 'top' as const },
                        title: { fontSize: 48, fontColor: '#ffffff', position: 'top' as const },
                        caption: { fontSize: 32, fontColor: '#ffffff', position: 'center' as const },
                        watermark: { fontSize: 24, fontColor: 'rgba(255,255,255,0.7)', position: 'bottom' as const },
                        comic: { fontSize: 36, fontColor: '#ffffff', position: 'center' as const },
                        neon: { fontSize: 42, fontColor: '#00ff00', position: 'center' as const }
                    };
                    
                    const config = styleMap[textStyle as keyof typeof styleMap] || styleMap['meme'];
                    
                    // Use TextCompositeRenderer for video as well to maintain consistency
                    try {
                        stickerBuffer = await TextCompositeRenderer.compositeHtmlTextOverImage(
                            buffer, 
                            actualText, 
                            { 
                                style: textStyle, 
                                method: 'ffmpeg', // Force FFmpeg for video
                                fontSize: config.fontSize,
                                fontColor: config.fontColor,
                                position: config.position === 'center' ? 'middle' : config.position
                            }
                        );
                        
                        await MessageUtils.sendMessage(sock, chatId, '✅ Video FFmpeg composite berhasil!');
                    } catch {
                        // Fallback to EmojiTextRenderer for video
                        stickerBuffer = await EmojiTextRenderer.processVideoWithText(buffer, actualText, {
                            fontSize: config.fontSize,
                            fontColor: config.fontColor,
                            position: config.position
                        });
                        
                        await MessageUtils.sendMessage(sock, chatId, '✅ Video FFmpeg rendering berhasil!');
                    }
                }
            } catch (error) {
                console.error('Enhanced rendering failed, trying fallback:', error);
                
                // Fallback to original FFmpeg method
                const textStyles = EmojiTextRenderer.getTextStyles();
                const styleOptions = textStyles[textStyle as keyof typeof textStyles] || textStyles.meme;
                
                if (mediaType === 'image') {
                    stickerBuffer = await EmojiTextRenderer.processImageWithText(buffer, actualText, styleOptions);
                } else {
                    stickerBuffer = await EmojiTextRenderer.processVideoWithText(buffer, actualText, styleOptions);
                }
                
                await MessageUtils.sendMessage(sock, chatId, '✅ FFmpeg fallback berhasil!');
            }
        } else {
            throw new Error('Tidak ada method rendering yang tersedia');
        }

        // Send sticker
        await MessageUtils.sendSticker(sock, chatId, stickerBuffer);

        console.log(`✅ ${mediaType} sticker with HTML/CSS text "${actualText}" sent successfully`);

    } catch (error) {
        console.error('❌ Error in stext command:', error);
        
        // Enhanced error handling
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        await MessageUtils.sendMessage(sock, chatId, 
            `❌ *Error membuat sticker dengan text:*

📋 Error: ${errorMessage.substring(0, 150)}...`);
    }
}