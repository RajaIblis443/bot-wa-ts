import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Emoji Text Renderer Utility
 * Handles emoji rendering with proper color support
 * 
 * NOTE: Currently using system fonts due to NotoColorEmoji.ttf compatibility issues with FFmpeg.
 * Emoji will be rendered as text characters, which should display as emoji on most platforms.
 * Color emoji rendering requires further development with libass or alternative methods.
 */
export class EmojiTextRenderer {
    private static fontPath = path.join(__dirname, '../../font/NotoColorEmoji.ttf');
    private static tempDir = path.join(__dirname, '../../temp');

    /**
     * Check if emoji font exists
     */
    private static checkEmojiFont(): boolean {
        return fs.existsSync(this.fontPath);
    }

    /**
     * Ensure temp directory exists
     */
    private static ensureTempDir(): void {
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    /**
     * Escape text for FFmpeg usage
     */
    private static escapeText(text: string): string {
        return text
            .replace(/'/g, "\\'")
            .replace(/"/g, '\\"')
            .replace(/\\/g, '\\\\')
            .replace(/:/g, '\\:')
            .replace(/\[/g, '\\[')
            .replace(/\]/g, '\\]');
    }

    /**
     * Check if text contains emoji
     */
    private static hasEmoji(text: string): boolean {
        // Use individual surrogate pair patterns to avoid range issues
        const emojiPatterns = [
            /[\uD83D][\uDE00-\uDE4F]/, // Emoticons
            /[\uD83C][\uDF00-\uDFFF]/, // Misc Symbols and Pictographs
            /[\uD83D][\uDC00-\uDDFF]/, // Misc Symbols and Pictographs
            /[\uD83D][\uDE80-\uDEFF]/, // Transport and Map
            /[\uD83C][\uDDE0-\uDDFF]/, // Regional indicator symbols
            /[\u2600-\u26FF]/,         // Miscellaneous Symbols
            /[\u2700-\u27BF]/,         // Dingbats
        ];
        
        return emojiPatterns.some(pattern => pattern.test(text));
    }

    /**
     * Get optimal font configuration for FFmpeg
     */
    private static getFontConfig(text: string, fontSize: number = 28): string {
        // For now, use system fonts as NotoColorEmoji has compatibility issues with FFmpeg
        // TODO: Implement proper color emoji support with libass or alternative method
        if (process.platform === 'darwin') {
            // macOS system fonts - Apple Color Emoji is built-in
            return `fontfile='/System/Library/Fonts/Arial.ttf':fontsize=${fontSize}`;
        } else if (process.platform === 'win32') {
            // Windows system fonts
            return `fontfile='C\\:/Windows/Fonts/arial.ttf':fontsize=${fontSize}`;
        } else {
            // Linux/Unix - use built-in font
            return `fontsize=${fontSize}`;
        }
    }

    /**
     * Generate text overlay filter for FFmpeg
     */
    static generateTextOverlay(
        text: string, 
        options: {
            fontSize?: number;
            fontColor?: string;
            position?: 'top' | 'center' | 'bottom';
            backgroundColor?: string;
            backgroundOpacity?: number;
            borderWidth?: number;
        } = {}
    ): string {
        const {
            fontSize = 28,
            fontColor = 'white',
            position = 'bottom',
            backgroundColor = 'black',
            backgroundOpacity = 0.8,
            borderWidth = 3
        } = options;

        const escapedText = this.escapeText(text);
        const fontConfig = this.getFontConfig(text, fontSize);

        // Position calculations
        const xPosition = '(w-text_w)/2'; // Center horizontally - Fixed: use const
        let yPosition: string;

        switch (position) {
            case 'top':
                yPosition = '20';
                break;
            case 'center':
                yPosition = '(h-text_h)/2';
                break;
            case 'bottom':
            default:
                yPosition = 'h-text_h-20';
                break;
        }

        // Build drawtext filter
        const drawTextFilter = `drawtext=${fontConfig}:text='${escapedText}':fontcolor=${fontColor}:x=${xPosition}:y=${yPosition}:box=1:boxcolor=${backgroundColor}@${backgroundOpacity}:boxborderw=${borderWidth}`;

        return drawTextFilter;
    }

    /**
     * Process image with text overlay
     */
    static async processImageWithText(
        inputBuffer: Buffer,
        text: string,
        options: {
            fontSize?: number;
            fontColor?: string;
            position?: 'top' | 'center' | 'bottom';
            backgroundColor?: string;
            backgroundOpacity?: number;
            borderWidth?: number;
        } = {}
    ): Promise<Buffer> {
        this.ensureTempDir();

        const inputFile = path.join(this.tempDir, `emoji_input_${Date.now()}.jpg`);
        const outputFile = path.join(this.tempDir, `emoji_output_${Date.now()}.webp`);

        try {
            // Write input file
            fs.writeFileSync(inputFile, inputBuffer);

            // Generate text overlay filter
            const textOverlayFilter = this.generateTextOverlay(text, options);

            // Build FFmpeg command
            const ffmpegCommand = `ffmpeg -i "${inputFile}" -vf "scale=512:512:force_original_aspect_ratio=decrease,${textOverlayFilter}" -f webp -y "${outputFile}"`;

            console.log('🎨 Processing image with emoji text:', text);
            console.log('🔧 FFmpeg command:', ffmpegCommand);

            // Execute FFmpeg command
            await execAsync(ffmpegCommand);

            // Read output file
            const outputBuffer = fs.readFileSync(outputFile);

            // Cleanup
            fs.unlinkSync(inputFile);
            fs.unlinkSync(outputFile);

            return outputBuffer;

        } catch (error) {
            // Cleanup on error
            if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile);
            if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
            throw error;
        }
    }

    /**
     * Process video with text overlay
     */
    static async processVideoWithText(
        inputBuffer: Buffer,
        text: string,
        options: {
            fontSize?: number;
            fontColor?: string;
            position?: 'top' | 'center' | 'bottom';
            backgroundColor?: string;
            backgroundOpacity?: number;
            borderWidth?: number;
            maxDuration?: number;
            fps?: number;
        } = {}
    ): Promise<Buffer> {
        this.ensureTempDir();

        const {
            maxDuration = 10,
            fps = 15,
            ...textOptions
        } = options;

        const inputFile = path.join(this.tempDir, `emoji_video_input_${Date.now()}.mp4`);
        const outputFile = path.join(this.tempDir, `emoji_video_output_${Date.now()}.webp`);

        try {
            // Write input file
            fs.writeFileSync(inputFile, inputBuffer);

            // Generate text overlay filter
            const textOverlayFilter = this.generateTextOverlay(text, textOptions);

            // Build FFmpeg command for video
            const ffmpegCommand = `ffmpeg -i "${inputFile}" -t ${maxDuration} -vf "fps=${fps},scale=512:512:force_original_aspect_ratio=decrease,${textOverlayFilter}" -f webp -y "${outputFile}"`;

            console.log('🎬 Processing video with emoji text:', text);
            console.log('🔧 FFmpeg command:', ffmpegCommand);

            // Execute FFmpeg command
            await execAsync(ffmpegCommand);

            // Read output file
            const outputBuffer = fs.readFileSync(outputFile);

            // Cleanup
            fs.unlinkSync(inputFile);
            fs.unlinkSync(outputFile);

            return outputBuffer;

        } catch (error) {
            // Cleanup on error
            if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile);
            if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
            throw error;
        }
    }

    /**
     * Check FFmpeg capabilities for text rendering
     */
    private static async checkFFmpegCapabilities(): Promise<{
        available: boolean;
        hasFreetype: boolean;
        hasHarfbuzz: boolean;
        hasFribidi: boolean;
        version: string;
    }> {
        try {
            // Check FFmpeg version and capabilities
            const { stdout } = await execAsync('ffmpeg -version');
            const available = true;
            const version = stdout.split('\n')[0];
            
            // Check for text rendering libraries
            const hasFreetype = stdout.includes('libfreetype');
            const hasHarfbuzz = stdout.includes('libharfbuzz');
            const hasFribidi = stdout.includes('libfribidi');
            
            return {
                available,
                hasFreetype,
                hasHarfbuzz,
                hasFribidi,
                version
            };
        } catch {
            return {
                available: false,
                hasFreetype: false,
                hasHarfbuzz: false,
                hasFribidi: false,
                version: 'Not found'
            };
        }
    }

    /**
     * Check system capabilities for emoji rendering
     */
    static async checkSystemCapabilities(): Promise<{
        hasEmojiFont: boolean;
        fontPath: string;
        platform: string;
        ffmpegAvailable: boolean;
        ffmpegCapabilities: {
            available: boolean;
            hasFreetype: boolean;
            hasHarfbuzz: boolean;
            hasFribidi: boolean;
            version: string;
        };
    }> {
        const ffmpegCapabilities = await this.checkFFmpegCapabilities();
        
        return {
            hasEmojiFont: this.checkEmojiFont(),
            fontPath: this.fontPath,
            platform: process.platform,
            ffmpegAvailable: ffmpegCapabilities.available,
            ffmpegCapabilities
        };
    }

    /**
     * Get recommended text styles for different use cases
     */
    static getTextStyles() {
        return {
            meme: {
                fontSize: 32,
                fontColor: 'white',
                position: 'bottom' as const,
                backgroundColor: 'black',
                backgroundOpacity: 0.8,
                borderWidth: 4
            },
            watermark: {
                fontSize: 20,
                fontColor: 'white',
                position: 'bottom' as const,
                backgroundColor: 'black',
                backgroundOpacity: 0.5,
                borderWidth: 2
            },
            title: {
                fontSize: 36,
                fontColor: 'white',
                position: 'top' as const,
                backgroundColor: 'black',
                backgroundOpacity: 0.7,
                borderWidth: 5
            },
            caption: {
                fontSize: 24,
                fontColor: 'white',
                position: 'center' as const,
                backgroundColor: 'black',
                backgroundOpacity: 0.6,
                borderWidth: 3
            }
        };
    }

    /**
     * Enhanced emoji detection with more comprehensive regex
     */
    static hasEmojiEnhanced(text: string): boolean {
        // More comprehensive emoji detection using surrogate pairs
        const emojiPatterns = [
            /[\uD83D][\uDE00-\uDE4F]/, // Emoticons
            /[\uD83C][\uDF00-\uDFFF]/, // Misc Symbols and Pictographs
            /[\uD83D][\uDC00-\uDDFF]/, // Misc Symbols and Pictographs
            /[\uD83D][\uDE80-\uDEFF]/, // Transport and Map
            /[\uD83C][\uDDE0-\uDDFF]/, // Regional indicator symbols
            /[\u2600-\u26FF]/,         // Miscellaneous Symbols
            /[\u2700-\u27BF]/,         // Dingbats
            /[\uD83E][\uDD00-\uDDFF]/, // Supplemental Symbols and Pictographs
            /[\uD83C][\uDC00-\uDCFF]/, // Various symbols
            /[\u2300-\u23FF]/,         // Miscellaneous Technical
            /[\u2000-\u206F]/          // General Punctuation
        ];

        return emojiPatterns.some(pattern => pattern.test(text));
    }

    /**
     * Get emoji-aware font configuration
     */
    static getEmojiAwareFontConfig(text: string, fontSize: number = 28): string {
        const hasEmojiInText = this.hasEmojiEnhanced(text);
        const fontExists = this.checkEmojiFont();

        if (hasEmojiInText && fontExists) {
            // Use emoji font for texts with emoji
            return `fontfile='${this.fontPath}':fontsize=${fontSize}`;
        } else if (process.platform === 'darwin') {
            // macOS system fonts with emoji support
            return `fontfile='/System/Library/Fonts/Arial.ttf':fontsize=${fontSize}`;
        } else if (process.platform === 'win32') {
            // Windows system fonts
            return `fontfile='C\\:/Windows/Fonts/arial.ttf':fontsize=${fontSize}`;
        } else {
            // Linux/Unix - use built-in font
            return `fontsize=${fontSize}`;
        }
    }
}