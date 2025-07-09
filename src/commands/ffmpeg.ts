import { WASocket } from "@whiskeysockets/baileys";
import { MessageUtils } from "../utils/messageUtils";
import { EmojiTextRenderer } from "../utils/emojiTextRenderer";

/**
 * FFmpeg system check command
 * Usage: .ffmpeg
 */
export default async function(sock: WASocket, chatId: string): Promise<void> {
    try {
        await MessageUtils.sendMessage(sock, chatId, '🔄 Checking FFmpeg capabilities...');
        
        const capabilities = await EmojiTextRenderer.checkSystemCapabilities();
        
        let statusMessage = `🔧 *FFmpeg System Check*\n\n`;
        
        // Basic FFmpeg check
        statusMessage += `📋 **Basic Info:**\n`;
        statusMessage += `• Platform: ${capabilities.platform}\n`;
        statusMessage += `• FFmpeg: ${capabilities.ffmpegAvailable ? '✅ Available' : '❌ Not found'}\n`;
        statusMessage += `• Version: ${capabilities.ffmpegCapabilities.version}\n\n`;
        
        // Text rendering capabilities
        statusMessage += `📝 **Text Rendering Capabilities:**\n`;
        statusMessage += `• libfreetype: ${capabilities.ffmpegCapabilities.hasFreetype ? '✅ Available' : '❌ Missing'}\n`;
        statusMessage += `• libharfbuzz: ${capabilities.ffmpegCapabilities.hasHarfbuzz ? '✅ Available' : '❌ Missing'}\n`;
        statusMessage += `• libfribidi: ${capabilities.ffmpegCapabilities.hasFribidi ? '✅ Available' : '❌ Missing'}\n\n`;
        
        // Font check
        statusMessage += `🎨 **Font Support:**\n`;
        statusMessage += `• Emoji font: ${capabilities.hasEmojiFont ? '✅ Available' : '❌ Missing'}\n`;
        statusMessage += `• Font path: ${capabilities.fontPath}\n\n`;
        
        // Overall status
        const isTextRenderingReady = capabilities.ffmpegAvailable && 
                                   capabilities.ffmpegCapabilities.hasFreetype;
        
        statusMessage += `🏁 **Overall Status:**\n`;
        statusMessage += `• Text rendering: ${isTextRenderingReady ? '✅ Ready' : '❌ Not ready'}\n`;
        statusMessage += `• Emoji support: ${capabilities.hasEmojiFont && isTextRenderingReady ? '✅ Full support' : '⚠️ Limited'}\n\n`;
        
        // Installation recommendations
        if (!isTextRenderingReady) {
            statusMessage += `🔧 **Installation Recommendations:**\n\n`;
            
            if (capabilities.platform === 'darwin') {
                statusMessage += `📱 **macOS (Homebrew):**\n`;
                statusMessage += `\`\`\`\n`;
                statusMessage += `brew install ffmpeg\n`;
                statusMessage += `# Or with more codecs:\n`;
                statusMessage += `brew install ffmpeg --with-freetype --with-harfbuzz\n`;
                statusMessage += `\`\`\`\n\n`;
            } else if (capabilities.platform === 'linux') {
                statusMessage += `🐧 **Linux (Ubuntu/Debian):**\n`;
                statusMessage += `\`\`\`\n`;
                statusMessage += `sudo apt update\n`;
                statusMessage += `sudo apt install ffmpeg libfreetype6-dev libharfbuzz-dev libfribidi-dev\n`;
                statusMessage += `\`\`\`\n\n`;
                
                statusMessage += `**CentOS/RHEL:**\n`;
                statusMessage += `\`\`\`\n`;
                statusMessage += `sudo yum install ffmpeg freetype-devel harfbuzz-devel fribidi-devel\n`;
                statusMessage += `\`\`\`\n\n`;
            } else if (capabilities.platform === 'win32') {
                statusMessage += `🪟 **Windows:**\n`;
                statusMessage += `1. Download FFmpeg full build from: https://ffmpeg.org/download.html\n`;
                statusMessage += `2. Choose a build that includes text rendering libraries\n`;
                statusMessage += `3. Extract and add to PATH\n`;
                statusMessage += `4. Or use package manager:\n`;
                statusMessage += `\`\`\`\n`;
                statusMessage += `choco install ffmpeg\n`;
                statusMessage += `# or\n`;
                statusMessage += `winget install ffmpeg\n`;
                statusMessage += `\`\`\`\n\n`;
            }
            
            statusMessage += `🔄 **Compile from Source (Advanced):**\n`;
            statusMessage += `\`\`\`\n`;
            statusMessage += `./configure --enable-libfreetype --enable-libharfbuzz --enable-libfribidi\n`;
            statusMessage += `make && make install\n`;
            statusMessage += `\`\`\`\n\n`;
        }
        
        // Usage tips
        statusMessage += `💡 **Usage Tips:**\n`;
        statusMessage += `• Use .stext command to create text stickers\n`;
        statusMessage += `• Support emoji in text overlays\n`;
        statusMessage += `• Multiple text styles available\n`;
        statusMessage += `• Use .stext help for more info\n\n`;
        
        statusMessage += `🔍 **Test Command:**\n`;
        statusMessage += `Reply to an image with: .stext Hello 🌍\n`;
        
        await MessageUtils.sendMessage(sock, chatId, statusMessage);
        
    } catch (error) {
        console.error('❌ Error in ffmpeg command:', error);
        await MessageUtils.sendMessage(sock, chatId, 
            `❌ Error checking FFmpeg capabilities.
            
🔧 This might indicate:
• FFmpeg not in PATH
• Permission issues
• System configuration problems
            
📋 Error: ${error instanceof Error ? error.message : String(error)}`);
    }
}
