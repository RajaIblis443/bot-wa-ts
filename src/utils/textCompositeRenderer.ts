import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';
import { HtmlTextRenderer } from './htmlTextRenderer';
import { getWebpOutputArgs, getTempWebpPath, getStandardScaleFilter } from "./ffmpegUtils";

const execAsync = promisify(exec);

export interface CompositeTextOptions {
    fontSize?: number;
    fontColor?: string;
    position?: 'top' | 'middle' | 'bottom';
    textAlign?: 'left' | 'center' | 'right';
    backgroundColor?: string;
    backgroundOpacity?: number;
    borderWidth?: number;
    style?: string;
    method?: 'html' | 'ffmpeg';
}

export class TextCompositeRenderer {
    private static tempDir = path.join(__dirname, '../../temp');

    /**
     * Ensure temp directory exists
     */
    private static ensureTempDir(): void {
        if (!this.tempDir) {
            fs.mkdir(this.tempDir, { recursive: true }).catch(console.error);
        }
    }

    /**
     * Composite text over background image using HTML rendering + FFmpeg
     */
    static async compositeHtmlTextOverImage(
        backgroundImage: Buffer,
        text: string,
        options: CompositeTextOptions = {}
    ): Promise<Buffer> {
        this.ensureTempDir();

        const inputFile = path.join(this.tempDir, `bg_input_${Date.now()}.jpg`);
        const overlayFile = path.join(this.tempDir, `text_overlay_${Date.now()}.png`);
        const outputFile = getTempWebpPath(this.tempDir, 'composite_output');

        try {
            // Write background image
            await fs.writeFile(inputFile, backgroundImage);

            // Check if HTML rendering is available
            const htmlAvailable = await HtmlTextRenderer.checkAvailability();
            
            if (htmlAvailable && options.method !== 'ffmpeg') {
                // Generate HTML text overlay
                const style = options.style || 'meme';
                const styleConfig = HtmlTextRenderer.getTextStyles()[style] || HtmlTextRenderer.getTextStyles()['meme'];
                
                const htmlOptions = {
                    ...styleConfig,
                    fontSize: options.fontSize || styleConfig.fontSize,
                    color: options.fontColor || styleConfig.color,
                    position: options.position || styleConfig.position,
                    textAlign: options.textAlign || styleConfig.textAlign,
                    backgroundColor: 'transparent' // Always transparent for overlay
                };

                const textOverlayBuffer = await HtmlTextRenderer.renderTextToImage(
                    text, 
                    htmlOptions, 
                    512, 
                    512
                );

                // Write text overlay
                await fs.writeFile(overlayFile, textOverlayBuffer);

                // Composite using FFmpeg - ensure overlay has transparent background
                const ffmpegCommand = `ffmpeg -i "${inputFile}" -i "${overlayFile}" -filter_complex "[0:v]${getStandardScaleFilter()},pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black[bg];[1:v]format=rgba[overlay];[bg][overlay]overlay=0:0:format=auto" ${getWebpOutputArgs({
                    lossless: false,
                    quality: 85,
                    loop: 0
                })} -y "${outputFile}"`;

                console.log('🎨 Compositing HTML text overlay:', text);
                console.log('🔧 FFmpeg command:', ffmpegCommand);

                await execAsync(ffmpegCommand);

            } else {
                // Use pure FFmpeg text rendering
                const textOverlayFilter = this.generateFFmpegTextOverlay(text, options);
                const ffmpegCommand = `ffmpeg -i "${inputFile}" -vf "${getStandardScaleFilter()},pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black,${textOverlayFilter}" ${getWebpOutputArgs({
                    lossless: false,
                    quality: 85,
                    loop: 0
                })} -y "${outputFile}"`;

                console.log('🎨 Processing with FFmpeg text:', text);
                console.log('🔧 FFmpeg command:', ffmpegCommand);

                await execAsync(ffmpegCommand);
            }

            // Read output file
            const outputBuffer = await fs.readFile(outputFile);

            // Cleanup
            await this.cleanup([inputFile, overlayFile, outputFile]);

            return outputBuffer;

        } catch (error) {
            // Cleanup on error
            await this.cleanup([inputFile, overlayFile, outputFile]);
            throw error;
        }
    }

    /**
     * Generate FFmpeg text overlay filter
     */
    private static generateFFmpegTextOverlay(text: string, options: CompositeTextOptions): string {
        const {
            fontSize = 40,
            fontColor = '#ffffff',
            position = 'middle',
            textAlign = 'center',
            borderWidth = 2
        } = options;

        // Escape text for FFmpeg
        const escapedText = text
            .replace(/'/g, "\\'")
            .replace(/"/g, '\\"')
            .replace(/\\/g, '\\\\')
            .replace(/:/g, '\\:')
            .replace(/\[/g, '\\[')
            .replace(/\]/g, '\\]');

        // Get font configuration
        let fontConfig = `fontsize=${fontSize}`;
        if (process.platform === 'darwin') {
            fontConfig = `fontfile='/System/Library/Fonts/Arial.ttf':fontsize=${fontSize}`;
        } else if (process.platform === 'win32') {
            fontConfig = `fontfile='C\\:/Windows/Fonts/arial.ttf':fontsize=${fontSize}`;
        }

        // Calculate position
        let x = 'w/2-text_w/2'; // center
        let y = 'h/2-text_h/2'; // middle

        if (textAlign === 'left') x = '20';
        else if (textAlign === 'right') x = 'w-text_w-20';

        if (position === 'top') y = '20';
        else if (position === 'bottom') y = 'h-text_h-20';

        // Build drawtext filter
        return `drawtext=text='${escapedText}':${fontConfig}:fontcolor=${fontColor}:x=${x}:y=${y}:shadowcolor=black:shadowx=2:shadowy=2:borderw=${borderWidth}:bordercolor=black`;
    }

    /**
     * Create text-only sticker (no background image)
     */
    static async createTextOnlySticker(
        text: string,
        options: CompositeTextOptions = {}
    ): Promise<Buffer> {
        const htmlAvailable = await HtmlTextRenderer.checkAvailability();
        
        if (htmlAvailable && options.method !== 'ffmpeg') {
            // Use HTML rendering
            const style = options.style || 'meme';
            const styleConfig = HtmlTextRenderer.getTextStyles()[style] || HtmlTextRenderer.getTextStyles()['meme'];
            
            const htmlOptions = {
                ...styleConfig,
                fontSize: options.fontSize || styleConfig.fontSize,
                color: options.fontColor || styleConfig.color,
                position: options.position || styleConfig.position,
                textAlign: options.textAlign || styleConfig.textAlign,
                backgroundColor: options.backgroundColor || 'rgba(0,0,0,0.8)'
            };

            const textBuffer = await HtmlTextRenderer.renderTextToImage(
                text, 
                htmlOptions, 
                512, 
                512
            );

            // Convert to WebP
            return await this.convertToWebP(textBuffer);

        } else {
            // Use FFmpeg rendering
            this.ensureTempDir();
            const outputFile = path.join(this.tempDir, `text_only_${Date.now()}.webp`);

            try {
                const textOverlayFilter = this.generateFFmpegTextOverlay(text, options);
                const bgColor = options.backgroundColor || 'rgba(0,0,0,0.8)';
                
                const ffmpegCommand = `ffmpeg -f lavfi -i color=c=${bgColor}:s=512x512:d=1 -vf "${textOverlayFilter}" -f webp -y "${outputFile}"`;

                console.log('🎨 Creating text-only sticker:', text);
                console.log('🔧 FFmpeg command:', ffmpegCommand);

                await execAsync(ffmpegCommand);

                const outputBuffer = await fs.readFile(outputFile);
                await this.cleanup([outputFile]);

                return outputBuffer;

            } catch (err) {
                await this.cleanup([outputFile]);
                throw err;
            }
        }
    }

    /**
     * Convert image to WebP using FFmpeg
     */
    private static async convertToWebP(inputBuffer: Buffer): Promise<Buffer> {
        this.ensureTempDir();
        const inputFile = path.join(this.tempDir, `convert_input_${Date.now()}.png`);
        const outputFile = path.join(this.tempDir, `convert_output_${Date.now()}.webp`);

        try {
            await fs.writeFile(inputFile, inputBuffer);
            
            const ffmpegCommand = `ffmpeg -i "${inputFile}" -f webp -y "${outputFile}"`;
            await execAsync(ffmpegCommand);

            const outputBuffer = await fs.readFile(outputFile);
            await this.cleanup([inputFile, outputFile]);

            return outputBuffer;

        } catch (err) {
            await this.cleanup([inputFile, outputFile]);
            throw err;
        }
    }

    /**
     * Cleanup temporary files
     */
    private static async cleanup(files: string[]): Promise<void> {
        for (const file of files) {
            try {
                await fs.unlink(file);
            } catch {
                // Ignore cleanup errors
            }
        }
    }

    /**
     * Check if text compositing is available
     */
    static async checkAvailability(): Promise<{
        ffmpeg: boolean;
        html: {
            available: boolean;
            puppeteer: boolean;
            highQuality: boolean;
            emojiSupport: boolean;
            animationSupport: boolean;
            gradientSupport: boolean;
        };
    }> {
        try {
            const ffmpegCheck = execAsync('ffmpeg -version').then(() => true).catch(() => false);
            const htmlCheck = HtmlTextRenderer.checkAvailability();

            const [ffmpeg, html] = await Promise.all([ffmpegCheck, htmlCheck]);

            return { ffmpeg, html };
        } catch {
            return { 
                ffmpeg: false, 
                html: {
                    available: false,
                    puppeteer: false,
                    highQuality: false,
                    emojiSupport: false,
                    animationSupport: false,
                    gradientSupport: false
                }
            };
        }
    }
}
