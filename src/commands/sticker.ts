import { WASocket, proto } from "@whiskeysockets/baileys";
import { MessageUtils } from "../utils/messageUtils";
import { downloadMediaMessage } from "@whiskeysockets/baileys";
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Sticker command - Convert image/video to sticker
 * Usage: .sticker (reply to image/video or send image/video with caption .sticker)
 */
export default async function(sock: WASocket, chatId: string, _senderId: string, _args: string[], currentMessage: proto.IWebMessageInfo): Promise<void> {
    try {
        if (!currentMessage) {
            await MessageUtils.sendMessage(sock, chatId, '❌ Tidak dapat mengakses pesan saat ini.');
            return;
        }

        let targetMessage = currentMessage;
        
        // Check if this is a quoted message (reply)
        if (currentMessage.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            // Create quoted message object
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
                `❌ *Cara Penggunaan Sticker:*
                
📸 *Untuk Foto:*
• Reply foto dengan .sticker
• Atau kirim foto dengan caption .sticker

🎥 *Untuk Video:*
• Reply video dengan .sticker
• Video akan dikonversi menjadi sticker animasi
• Maksimal durasi 10 detik

💡 *Contoh:*
• Reply foto → .sticker
• Reply video → .sticker
• Kirim foto + caption: .sticker
`);
            return;
        }

        // Send processing message
        await MessageUtils.sendMessage(sock, chatId, 
            `🔄 *Memproses ${mediaType === 'image' ? 'foto' : 'video'}...*
            
`);

        // Download media
        const buffer = await downloadMediaMessage(targetMessage, 'buffer', {});
        
        if (!buffer) {
            await MessageUtils.sendMessage(sock, chatId, '❌ Gagal download media!');
            return;
        }

        // Process based on media type
        if (mediaType === 'image') {
            await processImageSticker(sock, chatId, buffer);
        } else if (mediaType === 'video') {
            await processVideoSticker(sock, chatId, buffer);
        }

    } catch (error) {
        console.error('❌ Error in sticker command:', error);
        await MessageUtils.sendMessage(sock, chatId, 
            '❌ Terjadi kesalahan saat membuat sticker. Silakan coba lagi.');
    }
}

/**
 * Process image to sticker
 */
async function processImageSticker(sock: WASocket, chatId: string, buffer: Buffer): Promise<void> {
    try {
        // Create temp directory if not exists
        const tempDir = path.join(__dirname, '../../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const inputFile = path.join(tempDir, `input_${Date.now()}.jpg`);
        const outputFile = path.join(tempDir, `output_${Date.now()}.webp`);

        // Save input file
        fs.writeFileSync(inputFile, buffer);

        // Convert to WebP - NO PADDING, NO BACKGROUND, maintain aspect ratio
        // Scale to fit within 512x512 but don't stretch or add background
        const ffmpegCommand = `ffmpeg -i "${inputFile}" -vf "scale=512:512:force_original_aspect_ratio=decrease" -f webp -y "${outputFile}"`;
        
        await execAsync(ffmpegCommand);

        // Read converted file
        const stickerBuffer = fs.readFileSync(outputFile);

        // Send sticker
        await sock.sendMessage(chatId, {
            sticker: stickerBuffer,
            mimetype: 'image/webp'
        });

        // Cleanup temp files
        fs.unlinkSync(inputFile);
        fs.unlinkSync(outputFile);

        console.log('✅ Image sticker sent successfully (no background, original aspect ratio)');

    } catch (error) {
        console.error('❌ Error processing image sticker:', error);
        await MessageUtils.sendMessage(sock, chatId, 
            '❌ Gagal memproses foto. Pastikan foto tidak corrupt dan coba lagi.');
    }
}

/**
 * Process video to sticker
 */
async function processVideoSticker(sock: WASocket, chatId: string, buffer: Buffer): Promise<void> {
    try {
        // Create temp directory if not exists
        const tempDir = path.join(__dirname, '../../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const inputFile = path.join(tempDir, `input_${Date.now()}.mp4`);
        const outputFile = path.join(tempDir, `output_${Date.now()}.webp`);

        // Save input file
        fs.writeFileSync(inputFile, buffer);

        // Get video duration
        try {
            const durationCommand = `ffprobe -v quiet -show_entries format=duration -of csv="p=0" "${inputFile}"`;
            const { stdout: durationOutput } = await execAsync(durationCommand);
            const duration = parseFloat(durationOutput.trim());

            // Check if video is too long
            if (duration > 10) {
                await MessageUtils.sendMessage(sock, chatId, 
                    '⚠️ Video terlalu panjang! Maksimal 10 detik. Video akan dipotong otomatis.');
            }
        } catch {
            console.log('⚠️ Could not get video duration, proceeding with conversion...');
        }

        // Convert video to animated WebP sticker
        // NO PADDING, NO BACKGROUND, maintain aspect ratio
        // Scale to fit within 512x512 but don't stretch or add background
        const ffmpegCommand = `ffmpeg -i "${inputFile}" -t 10 -vf "fps=15,scale=512:512:force_original_aspect_ratio=decrease" -f webp -y "${outputFile}"`;
        
        await execAsync(ffmpegCommand);

        // Read converted file
        const stickerBuffer = fs.readFileSync(outputFile);

        // Send sticker
        await sock.sendMessage(chatId, {
            sticker: stickerBuffer,
            mimetype: 'image/webp'
        });

        // Cleanup temp files
        fs.unlinkSync(inputFile);
        fs.unlinkSync(outputFile);

        console.log('✅ Video sticker sent successfully (no background, original aspect ratio)');

    } catch (error) {
        console.error('❌ Error processing video sticker:', error);
        await MessageUtils.sendMessage(sock, chatId, 
            '❌ Gagal memproses video. Pastikan video tidak corrupt dan coba lagi.');
    }
}