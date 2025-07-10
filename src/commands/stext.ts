import { WASocket, proto } from "@whiskeysockets/baileys";
import { MessageUtils } from "../utils/messageUtils";
import { EmojiTextRenderer } from "../utils/emojiTextRenderer";
import { HtmlTextRenderer } from "../utils/htmlTextRenderer";
import { TextCompositeRenderer } from "../utils/textCompositeRenderer";
import { downloadMediaMessage } from "@whiskeysockets/baileys";

/**
 * Get style configuration for text rendering
 */
function getStyleConfig(textStyle: string) {
    const styleMap = {
        meme: { fontSize: 40, fontColor: '#ffffff', position: 'top' as const },
        title: { fontSize: 48, fontColor: '#ffffff', position: 'top' as const },
        caption: { fontSize: 32, fontColor: '#ffffff', position: 'center' as const },
        watermark: { fontSize: 24, fontColor: 'rgba(255,255,255,0.7)', position: 'bottom' as const },
        comic: { fontSize: 36, fontColor: '#ffffff', position: 'center' as const },
        neon: { fontSize: 42, fontColor: '#00ff00', position: 'center' as const }
    };
    
    return styleMap[textStyle as keyof typeof styleMap] || styleMap['meme'];
}

/**
 * Sticker Text command - Convert image/video to sticker with text overlay (with emoji support)
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
                `❌ *Sticker Text dengan HTML/CSS & Emoji Support*
                
📸 *Cara Penggunaan:*
• Reply foto/video dengan .stext [style] <text>
• Contoh: .stext meme Hello World
• Contoh: .stext neon EPIC TEXT
• Contoh: .stext comic Fun Text! 😀

🎨 *Style Tersedia:*
• ${styles}

� *Dukungan Emoji:*
• Emoji otomatis terdeteksi & diproses dengan FFmpeg
• Text tanpa emoji menggunakan HTML/CSS berkualitas tinggi
• Semua emoji Unicode didukung

�💡 *Contoh Lengkap:*
• .stext meme TOP TEXT
• .stext title Beautiful Title 🌟
• .stext comic Fun Text! 😂🎉
• .stext neon GLOWING TEXT ⚡
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
        
        // Check if text contains emoji for special handling
        const hasEmoji = EmojiTextRenderer.hasEmojiEnhanced(actualText);
        
        console.log(`🔍 Text analysis: "${actualText}"`);
        console.log(`😀 Contains emoji: ${hasEmoji}`);
        
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
${hasEmoji ? '😀 Emoji: Terdeteksi' : ''}
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
                    // Smart rendering strategy: prioritize method based on content
                    if (hasEmoji || !capabilities.html.available) {
                        // Use FFmpeg for emoji support or when HTML not available
                        console.log('🎨 Using FFmpeg method (emoji support or HTML unavailable)');
                        const config = getStyleConfig(textStyle);
                        stickerBuffer = await EmojiTextRenderer.processImageWithText(buffer, actualText, {
                            fontSize: config.fontSize,
                            fontColor: config.fontColor,
                            position: config.position
                        });
                        
                        await MessageUtils.sendMessage(sock, chatId, hasEmoji ? '✅ FFmpeg emoji rendering berhasil!' : '✅ FFmpeg rendering berhasil!');
                        
                    } else {
                        // Use HTML/CSS for better quality pure text
                        try {
                            console.log('🎨 Using HTML/CSS method (high quality text)');
                            stickerBuffer = await TextCompositeRenderer.compositeHtmlTextOverImage(
                                buffer, 
                                actualText, 
                                { style: textStyle, method: 'html' }
                            );
                            
                            await MessageUtils.sendMessage(sock, chatId, '✅ HTML/CSS rendering berhasil!');
                        } catch (htmlError) {
                            console.log('HTML rendering failed, trying FFmpeg fallback:', htmlError);
                            
                            // Fallback to FFmpeg method with emoji support
                            const config = getStyleConfig(textStyle);
                            stickerBuffer = await EmojiTextRenderer.processImageWithText(buffer, actualText, {
                                fontSize: config.fontSize,
                                fontColor: config.fontColor,
                                position: config.position
                            });
                            
                            await MessageUtils.sendMessage(sock, chatId, '✅ FFmpeg emoji fallback berhasil!');
                        }
                    }
                } else {
                    // For video, use our enhanced HTML/CSS video processor
                    try {
                        console.log('🎨 Using enhanced HTML/CSS video processing');
                        
                        // Use the new HTML/CSS video processor with proper style support
                        stickerBuffer = await HtmlTextRenderer.processVideoWithHtmlText(
                            buffer, 
                            actualText, 
                            { 
                                style: textStyle,
                                animation: true,  // Enable animations for videos
                                maxDuration: 10,  // Maximum 10 seconds
                                fps: 15           // 15 frames per second is good for stickers
                            }
                        );
                        
                        await MessageUtils.sendMessage(sock, chatId, '✅ Enhanced HTML/CSS video processing berhasil!');
                    } catch (videoError) {
                        console.error('HTML video processing failed, trying fallback:', videoError);
                        
                        // First fallback - try TextCompositeRenderer
                        try {
                            const styleMap = {
                                meme: { fontSize: 40, fontColor: '#ffffff', position: 'top' as const },
                                title: { fontSize: 48, fontColor: '#ffffff', position: 'top' as const },
                                caption: { fontSize: 32, fontColor: '#ffffff', position: 'center' as const },
                                watermark: { fontSize: 24, fontColor: 'rgba(255,255,255,0.7)', position: 'bottom' as const },
                                comic: { fontSize: 36, fontColor: '#ffffff', position: 'center' as const },
                                neon: { fontSize: 42, fontColor: '#00ff00', position: 'center' as const }
                            };
                            
                            const config = styleMap[textStyle as keyof typeof styleMap] || styleMap['meme'];
                            
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
                            
                            await MessageUtils.sendMessage(sock, chatId, '✅ Video FFmpeg composite fallback berhasil!');
                        } catch (compositeError) {
                            console.error('Composite fallback failed, using direct FFmpeg:', compositeError);
                            
                            // Last resort - EmojiTextRenderer
                            const styleMap = {
                                meme: { fontSize: 40, fontColor: '#ffffff', position: 'top' as const },
                                title: { fontSize: 48, fontColor: '#ffffff', position: 'top' as const },
                                caption: { fontSize: 32, fontColor: '#ffffff', position: 'center' as const },
                                watermark: { fontSize: 24, fontColor: 'rgba(255,255,255,0.7)', position: 'bottom' as const },
                                comic: { fontSize: 36, fontColor: '#ffffff', position: 'center' as const },
                                neon: { fontSize: 42, fontColor: '#00ff00', position: 'center' as const }
                            };
                            
                            const config = styleMap[textStyle as keyof typeof styleMap] || styleMap['meme'];
                            
                            stickerBuffer = await EmojiTextRenderer.processVideoWithText(buffer, actualText, {
                                fontSize: config.fontSize,
                                fontColor: config.fontColor,
                                position: config.position
                            });
                            
                            await MessageUtils.sendMessage(sock, chatId, '✅ FFmpeg direct rendering fallback berhasil!');
                        }
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