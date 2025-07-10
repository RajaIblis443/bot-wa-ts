import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { getWebpOutputArgs, getTempWebpPath, getStandardScaleFilter } from "./ffmpegUtils";

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
    /**
     * Escape text for FFmpeg usage with improved emoji handling
     * The key is to ensure all special characters are escaped properly
     */
    private static escapeText(text: string): string {
        return text
            .replace(/\\/g, '\\\\')  // Must escape backslashes first
            .replace(/'/g, "\\'")
            .replace(/"/g, '\\"')
            .replace(/:/g, '\\:')
            .replace(/\[/g, '\\[')
            .replace(/\]/g, '\\]')
            .replace(/=/g, '\\=')
            .replace(/,/g, '\\,');
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
        const outputFile = getTempWebpPath(this.tempDir, `emoji_video_output`);

        try {
            // Write input file
            fs.writeFileSync(inputFile, inputBuffer);

            // Generate text overlay filter
            const textOverlayFilter = this.generateTextOverlay(text, textOptions);

            // Build FFmpeg command for video with mobile-optimized WebP parameters
            const ffmpegCommand = `ffmpeg -i "${inputFile}" -t ${maxDuration} -vf "fps=${fps},${getStandardScaleFilter()},${textOverlayFilter}" ${getWebpOutputArgs({
                fps,
                lossless: false,
                quality: 80,
                loop: 0,
                maxDuration
            })} -y "${outputFile}"`;

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
     * Generate text-only sticker using FFmpeg
     */
    static async generateTextOnlySticker(
        text: string, 
        options: {
            fontSize?: number;
            fontColor?: string;
            backgroundColor?: string;
            padding?: number;
            maxWidth?: number;
            maxHeight?: number;
        } = {}
    ): Promise<Buffer> {
        const {
            fontSize = 60,
            fontColor = '#ffffff',
            backgroundColor = 'transparent',
            padding = 20,
            maxWidth = 512,
            maxHeight = 512
        } = options;

        this.ensureTempDir();
        
        const outputPath = getTempWebpPath(this.tempDir, 'text_sticker');
        const escapedText = this.escapeText(text);
        
        try {
            // Calculate canvas size based on text length and font size
            const estimatedWidth = Math.min(text.length * (fontSize * 0.6) + (padding * 2), maxWidth);
            const estimatedHeight = Math.min(fontSize + (padding * 2), maxHeight);
            
            // Build drawtext filter properly
            const fontConfig = this.getEmojiAwareFontConfig(text, fontSize);
            
            // Create filter string with better emoji handling by using double quotes around the filter
            // Note: We put the whole filter in double quotes and escape single quotes inside
            let filterChain = `"drawtext=text='${escapedText}':${fontConfig}:fontcolor=${fontColor}:x=(w-text_w)/2:y=(h-text_h)/2`;
            
            // Add colorkey for transparency if needed
            if (backgroundColor === 'transparent') {
                filterChain += ',colorkey=black:0.1:0.1';
            }
            
            // Close the double quotes
            filterChain += '"';
            
            // Use direct command string format for better control of quoting
            const ffmpegCmd = `ffmpeg -f lavfi -i color=${backgroundColor === 'transparent' ? 'black' : backgroundColor}:size=${estimatedWidth}x${estimatedHeight}:duration=1 -vf ${filterChain} -frames:v 1 ${getWebpOutputArgs({
                lossless: true,
                quality: 100,
                loop: 0
            })} -y "${outputPath}"`;
            
            console.log('🎨 Generating text-only sticker with command:', ffmpegCmd);
            
            const { stderr } = await execAsync(ffmpegCmd);
            
            if (stderr && !stderr.includes('frame=')) {
                console.warn('FFmpeg stderr (might be normal):', stderr);
            }

            if (!fs.existsSync(outputPath)) {
                throw new Error('Failed to generate text sticker');
            }

            const buffer = fs.readFileSync(outputPath);
            
            // Cleanup
            try {
                fs.unlinkSync(outputPath);
            } catch (cleanupError) {
                console.warn('Failed to cleanup temp file:', cleanupError);
            }

            console.log(`✅ Text-only sticker generated successfully (${buffer.length} bytes)`);
            return buffer;

        } catch (error) {
            console.error('❌ Error generating text-only sticker:', error);
            
            // Cleanup on error
            try {
                if (fs.existsSync(outputPath)) {
                    fs.unlinkSync(outputPath);
                }
            } catch (cleanupError) {
                console.warn('Failed to cleanup temp file on error:', cleanupError);
            }
            
            throw error;
        }
    }

    /**
     * Check FFmpeg capabilities for text rendering
     */

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
     * Get emoji-aware font configuration with proper Windows path escaping
     */
    static getEmojiAwareFontConfig(text: string, fontSize: number = 28): string {
        const hasEmojiInText = this.hasEmojiEnhanced(text);
        const fontExists = this.checkEmojiFont();

        if (hasEmojiInText && fontExists) {
            // Use emoji font for texts with emoji - escape Windows paths properly
            let fontPath = this.fontPath;
            if (process.platform === 'win32') {
                // For Windows, convert backslashes to forward slashes and escape properly
                fontPath = fontPath.replace(/\\/g, '/');
            }
            return `fontfile='${fontPath}':fontsize=${fontSize}`;
        } else if (process.platform === 'darwin') {
            // macOS system fonts with emoji support
            return `fontfile='/System/Library/Fonts/Arial.ttf':fontsize=${fontSize}`;
        } else if (process.platform === 'win32') {
            // Windows system fonts - use forward slashes
            return `fontfile='C:/Windows/Fonts/arial.ttf':fontsize=${fontSize}`;
        } else {
            // Linux/Unix - use built-in font (no fontfile needed)
            return `fontsize=${fontSize}`;
        }
    }
}