import puppeteer, { Browser } from 'puppeteer';
import { promisify } from 'util';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { getWebpOutputArgs, getTempWebpPath, getStandardScaleFilter } from "./ffmpegUtils";

export interface HtmlTextOptions {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    textAlign?: 'left' | 'center' | 'right';
    position?: 'top' | 'middle' | 'bottom';
    shadow?: boolean;
    stroke?: boolean;
    strokeColor?: string;
    strokeWidth?: number;
    gradient?: boolean;
    gradientColors?: string[];
    padding?: number;
    borderRadius?: number;
    animation?: boolean;
    maxWidth?: number;
    lineHeight?: number;
    fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    letterSpacing?: number;
}

export class HtmlTextRenderer {
    private static browser: Browser | null = null;
    private static browserStartAttempts = 0;
    private static maxBrowserAttempts = 3;
    
    /**
     * Escape text for FFmpeg usage
     * This helps prevent issues with special characters and emojis in FFmpeg commands
     */
    private static escapeFfmpegText(text: string): string {
        return text
            .replace(/'/g, "\\'")
            .replace(/"/g, '\\"')
            .replace(/\\/g, '\\\\')
            .replace(/:/g, '\\:')
            .replace(/\[/g, '\\[')
            .replace(/\]/g, '\\]');
    }

    /**
     * Initialize Puppeteer browser with retry mechanism
     */
    private static async initBrowser(): Promise<Browser> {
        if (!this.browser) {
            try {
                this.browserStartAttempts++;
                this.browser = await puppeteer.launch({
                    headless: true,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--no-first-run',
                        '--no-zygote',
                        '--single-process',
                        '--disable-gpu'
                    ]
                });
                
                // Reset attempts counter on success
                this.browserStartAttempts = 0;
                
                // Add error handler to detect browser crashes
                this.browser.on('disconnected', () => {
                    console.log('🔄 Puppeteer browser disconnected, will restart on next usage');
                    this.browser = null;
                });
            } catch (error) {
                console.error(`❌ Failed to start browser (attempt ${this.browserStartAttempts}/${this.maxBrowserAttempts}):`, error);
                this.browser = null;
                
                // If we've tried too many times, give up
                if (this.browserStartAttempts >= this.maxBrowserAttempts) {
                    throw new Error(`Failed to start browser after ${this.maxBrowserAttempts} attempts`);
                }
                
                // Wait a moment before retrying
                await new Promise(resolve => setTimeout(resolve, 1000));
                return this.initBrowser(); // Retry
            }
        }
        return this.browser;
    }

    /**
     * Close browser instance
     */
    static async closeBrowser(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }

    /**
     * Generate HTML content for text overlay
     */
    private static generateHtml(text: string, options: HtmlTextOptions, width: number, height: number): string {
        const {
            fontSize = 36,
            fontFamily = 'Arial, "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif',
            color = '#ffffff',
            backgroundColor = 'transparent',
            textAlign = 'center',
            position = 'middle',
            shadow = true,
            stroke = true,
            strokeColor = '#000000',
            strokeWidth = 2,
            gradient = false,
            gradientColors = ['#ff6b6b', '#4ecdc4'],
            padding = 20,
            borderRadius = 10,
            maxWidth = width * 0.8,
            lineHeight = 1.2,
            fontWeight = 'bold',
            textTransform = 'none',
            letterSpacing = 0
        } = options;

        // Calculate position
        let alignItems = 'center';
        let justifyContent = 'center';
        
        if (position === 'top') alignItems = 'flex-start';
        else if (position === 'bottom') alignItems = 'flex-end';
        
        if (textAlign === 'left') justifyContent = 'flex-start';
        else if (textAlign === 'right') justifyContent = 'flex-end';

        // Generate text color/gradient
        let textColor = color;
        if (gradient) {
            textColor = `linear-gradient(45deg, ${gradientColors.join(', ')})`;
        }

        // Generate text shadow
        let textShadow = '';
        if (shadow) {
            textShadow = `
                text-shadow: 
                    2px 2px 4px rgba(0,0,0,0.8),
                    -2px -2px 4px rgba(0,0,0,0.6),
                    2px -2px 4px rgba(0,0,0,0.6),
                    -2px 2px 4px rgba(0,0,0,0.6);
            `;
        }

        // Generate stroke
        let strokeStyle = '';
        if (stroke) {
            strokeStyle = `
                -webkit-text-stroke: ${strokeWidth}px ${strokeColor};
                text-stroke: ${strokeWidth}px ${strokeColor};
            `;
        }

        // Generate gradient text
        let gradientStyle = '';
        if (gradient) {
            gradientStyle = `
                background: ${textColor};
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            `;
        }

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
                
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    width: ${width}px;
                    height: ${height}px;
                    background: ${backgroundColor === 'transparent' ? 'rgba(0,0,0,0)' : backgroundColor};
                    font-family: ${fontFamily};
                    overflow: hidden;
                    display: flex;
                    align-items: ${alignItems};
                    justify-content: ${justifyContent};
                    position: relative;
                }
                
                .text-container {
                    max-width: ${maxWidth}px;
                    padding: ${padding}px;
                    text-align: ${textAlign};
                    border-radius: ${borderRadius}px;
                    word-wrap: break-word;
                    word-break: break-word;
                    hyphens: auto;
                }
                
                .text-overlay {
                    font-size: ${fontSize}px;
                    font-weight: ${fontWeight};
                    line-height: ${lineHeight};
                    text-transform: ${textTransform};
                    letter-spacing: ${letterSpacing}px;
                    ${gradient ? '' : `color: ${textColor};`}
                    ${textShadow}
                    ${strokeStyle}
                    ${gradientStyle}
                    white-space: pre-wrap;
                    position: relative;
                    z-index: 2;
                }
                
                /* Emoji support enhancement */
                .text-overlay {
                    font-feature-settings: "liga" 1, "calt" 1;
                    font-variant-emoji: emoji;
                    text-rendering: optimizeLegibility;
                }
                
                /* Animation support */
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.8); }
                    to { opacity: 1; transform: scale(1); }
                }
                
                @keyframes bounce {
                    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                    40% { transform: translateY(-10px); }
                    60% { transform: translateY(-5px); }
                }
                
                @keyframes glow {
                    0%, 100% { text-shadow: 0 0 20px rgba(255,255,255,0.8); }
                    50% { text-shadow: 0 0 30px rgba(255,255,255,1), 0 0 40px rgba(255,255,255,1); }
                }
                
                /* Apply animation if enabled */
                ${options.animation ? `
                .text-overlay {
                    animation: fadeIn 0.8s ease-out;
                }
                ` : ''}
            </style>
        </head>
        <body>
            <div class="text-container">
                <div class="text-overlay">${text}</div>
            </div>
        </body>
        </html>
        `;
    }

    /**
     * Render HTML text to image buffer
     */
    static async renderTextToImage(
        text: string, 
        options: HtmlTextOptions, 
        width: number = 512, 
        height: number = 512
    ): Promise<Buffer> {
        const browser = await this.initBrowser();
        const page = await browser.newPage();
        
        try {
            // Set viewport
            await page.setViewport({ width, height });
            
            // Generate HTML
            const html = this.generateHtml(text, options, width, height);
            
            // Set content
            await page.setContent(html, { waitUntil: 'networkidle0' });
            
            // Wait for fonts to load
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Take screenshot with transparent background
            const screenshot = await page.screenshot({
                type: 'png',
                clip: { x: 0, y: 0, width, height },
                omitBackground: true // This ensures transparency
            });
            
            return screenshot as Buffer;
            
        } finally {
            await page.close();
        }
    }

    /**
     * Generate text-only sticker using enhanced HTML/CSS rendering
     * Prioritizes HTML/CSS approach with improved emoji support
     * Only falls back to FFmpeg as a last resort when Puppeteer fails completely
     */
    static async generateTextOnlySticker(
        text: string,
        options: {
            fontSize?: number;
            fontFamily?: string;
            fontWeight?: string;
            color?: string;
            backgroundColor?: string;
            padding?: number;
            maxWidth?: number;
            maxHeight?: number;
            textAlign?: 'left' | 'center' | 'right';
            textShadow?: string;
            stroke?: boolean;
            strokeColor?: string;
            strokeWidth?: number;
            gradient?: boolean;
            gradientColors?: string[];
            animation?: boolean;
            textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
            letterSpacing?: number;
            lineHeight?: number;
        } = {}
    ): Promise<Buffer> {
        const {
            fontSize = 60,
            fontFamily = 'Arial, "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif',
            fontWeight = 'bold',
            color = '#ffffff',
            backgroundColor = 'transparent',
            padding = 20,
            maxWidth = 512,
            maxHeight = 512,
            textAlign = 'center',
            textShadow = '2px 2px 4px rgba(0,0,0,0.8)',
            stroke = true,
            strokeColor = '#000000',
            strokeWidth = 2,
            gradient = false,
            gradientColors = ['#ff6b6b', '#4ecdc4'],
            animation = false,
            textTransform = 'none',
            letterSpacing = 0,
            lineHeight = 1.2
        } = options;

        // Check if text contains emojis - use emoji-optimized fonts
        const hasEmoji = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u.test(text);
        const optimizedFontFamily = hasEmoji 
            ? 'Arial, "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif'
            : fontFamily;

        // Define multiple rendering attempts for best results
        const renderAttempts = [
            // First attempt: Enhanced HTML/CSS with full features
            async (): Promise<Buffer> => {
                console.log('🎨 Attempting enhanced HTML/CSS rendering with full features');
                const browser = await this.initBrowser();
                const page = await browser.newPage();
                
                try {
                    // Set viewport size with high resolution for better quality
                    await page.setViewport({ 
                        width: maxWidth, 
                        height: maxHeight,
                        deviceScaleFactor: 2.5 // Higher resolution for better text quality
                    });
                    
                    // Generate text color/gradient styles
                    let textColorStyle = `color: ${color};`;
                    let strokeStyle = '';
                    let gradientStyle = '';
                    
                    if (stroke) {
                        strokeStyle = `
                            -webkit-text-stroke: ${strokeWidth}px ${strokeColor};
                            text-stroke: ${strokeWidth}px ${strokeColor};
                        `;
                    }
                    
                    if (gradient) {
                        const gradientValue = `linear-gradient(45deg, ${gradientColors.join(', ')})`;
                        gradientStyle = `
                            background: ${gradientValue};
                            -webkit-background-clip: text;
                            -webkit-text-fill-color: transparent;
                            background-clip: text;
                        `;
                        textColorStyle = ''; // Color is handled by gradient
                    }
                    
                    // Animation styles
                    let animationStyle = '';
                    if (animation) {
                        animationStyle = `
                            animation: fadeIn 0.8s ease-out;
                        `;
                    }

                    // Create enhanced HTML content with better font rendering
                    const htmlContent = `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="UTF-8">
                            <style>
                                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
                                
                                * {
                                    margin: 0;
                                    padding: 0;
                                    box-sizing: border-box;
                                }
                                
                                @keyframes fadeIn {
                                    from { opacity: 0; transform: scale(0.9); }
                                    to { opacity: 1; transform: scale(1); }
                                }
                                
                                body {
                                    width: ${maxWidth}px;
                                    height: ${maxHeight}px;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    background: ${backgroundColor};
                                    overflow: hidden;
                                }
                                
                                .text-container {
                                    padding: ${padding}px;
                                    text-align: ${textAlign};
                                    width: 100%;
                                    word-wrap: break-word;
                                    word-break: break-word;
                                    display: flex;
                                    justify-content: center;
                                }
                                
                                .text {
                                    font-family: ${optimizedFontFamily};
                                    font-size: ${fontSize}px;
                                    font-weight: ${fontWeight};
                                    ${textColorStyle}
                                    text-shadow: ${textShadow};
                                    line-height: ${lineHeight};
                                    white-space: pre-wrap;
                                    max-width: 100%;
                                    text-transform: ${textTransform};
                                    letter-spacing: ${letterSpacing}px;
                                    ${strokeStyle}
                                    ${gradientStyle}
                                    ${animationStyle}
                                    
                                    /* Enhanced emoji support */
                                    font-feature-settings: "liga" 1, "calt" 1;
                                    font-variant-emoji: emoji;
                                    text-rendering: optimizeLegibility;
                                }
                            </style>
                        </head>
                        <body>
                            <div class="text-container">
                                <div class="text">${text}</div>
                            </div>
                        </body>
                        </html>
                    `;

                    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
                    
                    // Wait for emoji fonts to load properly - longer wait for emoji content
                    await new Promise(resolve => setTimeout(resolve, hasEmoji ? 1800 : 1000));

                    // Take screenshot with transparent background and high quality
                    const buffer = await page.screenshot({
                        type: 'webp',
                        omitBackground: true,
                        quality: 100,
                        optimizeForSpeed: false,
                        clip: { x: 0, y: 0, width: maxWidth, height: maxHeight }
                    });

                    console.log(`✅ Enhanced HTML text sticker generated successfully (${buffer.length} bytes)`);
                    return Buffer.from(buffer);
                    
                } finally {
                    // Clean up resources
                    await page.close().catch(() => {});
                }
            },
            
            // Second attempt: Simplified HTML/CSS with basic features
            async (): Promise<Buffer> => {
                console.log('🎨 Attempting simplified HTML/CSS rendering');
                const browser = await this.initBrowser();
                const page = await browser.newPage();
                
                try {
                    // Set viewport size
                    await page.setViewport({ 
                        width: maxWidth, 
                        height: maxHeight,
                        deviceScaleFactor: 2
                    });

                    // Create simplified HTML content
                    const htmlContent = `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="UTF-8">
                            <style>
                                * {
                                    margin: 0;
                                    padding: 0;
                                    box-sizing: border-box;
                                }
                                
                                body {
                                    width: ${maxWidth}px;
                                    height: ${maxHeight}px;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    background: ${backgroundColor};
                                    overflow: hidden;
                                }
                                
                                .text-container {
                                    padding: ${padding}px;
                                    text-align: ${textAlign};
                                    width: 100%;
                                    word-wrap: break-word;
                                    word-break: break-word;
                                }
                                
                                .text {
                                    font-family: ${optimizedFontFamily};
                                    font-size: ${fontSize}px;
                                    font-weight: ${fontWeight};
                                    color: ${color};
                                    text-shadow: ${textShadow};
                                    line-height: 1.2;
                                    white-space: pre-wrap;
                                    max-width: 100%;
                                    
                                    /* Basic emoji support */
                                    font-feature-settings: "liga" 1, "calt" 1;
                                    font-variant-emoji: emoji;
                                }
                            </style>
                        </head>
                        <body>
                            <div class="text-container">
                                <div class="text">${text}</div>
                            </div>
                        </body>
                        </html>
                    `;

                    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
                    
                    // Wait for fonts to load
                    await new Promise(resolve => setTimeout(resolve, hasEmoji ? 1500 : 800));

                    // Take screenshot with transparent background
                    const buffer = await page.screenshot({
                        type: 'webp',
                        omitBackground: true,
                        quality: 100,
                        clip: { x: 0, y: 0, width: maxWidth, height: maxHeight }
                    });

                    console.log(`✅ Simplified HTML text sticker generated successfully (${buffer.length} bytes)`);
                    return Buffer.from(buffer);
                    
                } finally {
                    // Clean up resources
                    await page.close().catch(() => {});
                }
            },
            
            // Third attempt: FFmpeg fallback as last resort
            async (): Promise<Buffer> => {
                console.log('🔄 Falling back to FFmpeg for text generation');
                
                // Use the modules imported at the top of the file
                const execAsync = promisify(exec);
                
                // Create temporary directory for FFmpeg output
                const tempDir = path.join(__dirname, '../../temp');
                await fs.mkdir(tempDir, { recursive: true }).catch(() => {});
                
                // Generate sticker with FFmpeg
                const outputPath = path.join(tempDir, `text_sticker_${Date.now()}.webp`);
                
                // Escape text for FFmpeg
                const escapedText = this.escapeFfmpegText(text);
                
                // Use safer FFmpeg command construction to avoid emoji issues
                const ffmpegCommand = `ffmpeg -f lavfi -i color=black:size=${maxWidth}x${maxHeight}:duration=1 -vf "drawtext=text='${escapedText}':fontsize=${fontSize}:fontcolor=${color}:x=(w-text_w)/2:y=(h-text_h)/2,colorkey=black:0.1:0.1" -frames:v 1 -c:v libwebp -lossless 1 -q:v 100 -loop 0 -y "${outputPath}"`;
                
                await execAsync(ffmpegCommand);
                const buffer = await fs.readFile(outputPath);
                await fs.unlink(outputPath).catch(() => {});
                
                console.log(`✅ FFmpeg text sticker generated successfully (${buffer.length} bytes)`);
                return buffer;
            }
        ];

        // Try each rendering method in order until one succeeds
        for (let i = 0; i < renderAttempts.length; i++) {
            try {
                return await renderAttempts[i]();
            } catch (error) {
                console.error(`❌ Rendering attempt ${i+1} failed:`, error);
                if (i === renderAttempts.length - 1) {
                    throw new Error(`Failed to generate text sticker after all attempts: ${error}`);
                }
            }
        }
        
        // This should never be reached due to the error handling above
        throw new Error('Failed to generate text sticker: all rendering methods failed');
    }

    /**
     * Add text overlay to image buffer using HTML/CSS
     * This is a higher-level function that applies text on an image
     * @param imageBuffer - The original image buffer
     * @param text - Text to overlay
     * @param options - Text rendering options
     */
    static async addTextToImage(
        imageBuffer: Buffer,
        text: string,
        options: HtmlTextOptions & {
            width?: number;
            height?: number;
            position?: 'top' | 'middle' | 'bottom';
            style?: string;
        } = {}
    ): Promise<Buffer> {
        // Default options
        const {
            width = 512,
            height = 512,
            position = 'bottom',
            style
        } = options;
        
        // If a predefined style is specified, use it as a base
        let styleOptions: HtmlTextOptions = {};
        if (style && Object.keys(this.getTextStyles()).includes(style)) {
            styleOptions = this.getTextStyles()[style];
        }
        
        // Merge provided options with style options (provided options take precedence)
        const mergedOptions = { ...styleOptions, ...options, position };
        
        const browser = await this.initBrowser();
        const page = await browser.newPage();
        
        try {
            // Set viewport size
            await page.setViewport({ width, height, deviceScaleFactor: 2 });
            
            // Convert image buffer to base64
            const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
            
            // Generate HTML with image background and text overlay
            const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body, html {
                            margin: 0;
                            padding: 0;
                            width: ${width}px;
                            height: ${height}px;
                            overflow: hidden;
                        }
                        
                        .container {
                            position: relative;
                            width: 100%;
                            height: 100%;
                        }
                        
                        .image {
                            position: absolute;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            object-fit: cover;
                        }
                        
                        .text-wrapper {
                            position: absolute;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            display: flex;
                            align-items: ${position === 'top' ? 'flex-start' : position === 'bottom' ? 'flex-end' : 'center'};
                            justify-content: center;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <img class="image" src="${base64Image}" alt="Base Image">
                        <div class="text-wrapper" id="text-container"></div>
                    </div>
                </body>
                </html>
            `;
            
            await page.setContent(html);
            
            // Insert text overlay
            await page.evaluate((text, options) => {
                const textContainer = document.getElementById('text-container');
                if (!textContainer) return;
                
                const textElement = document.createElement('div');
                textElement.textContent = text;
                
                // Apply all styles from options
                Object.entries(options).forEach(([key, value]) => {
                    if (key === 'fontSize') textElement.style.fontSize = `${value}px`;
                    else if (key === 'fontFamily') textElement.style.fontFamily = value as string;
                    else if (key === 'color') textElement.style.color = value as string;
                    else if (key === 'textAlign') textElement.style.textAlign = value as string;
                    else if (key === 'fontWeight') textElement.style.fontWeight = value as string;
                    else if (key === 'letterSpacing') textElement.style.letterSpacing = `${value}px`;
                    else if (key === 'lineHeight') textElement.style.lineHeight = value as string;
                    else if (key === 'textTransform') textElement.style.textTransform = value as string;
                    else if (key === 'padding') textElement.style.padding = `${value}px`;
                });
                
                // Advanced styles
                if (options.shadow) {
                    textElement.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8), -2px -2px 4px rgba(0,0,0,0.6)';
                }
                
                if (options.stroke) {
                    textElement.style.webkitTextStroke = `${options.strokeWidth || 2}px ${options.strokeColor || '#000'}`;
                }
                
                // Set max width for text container
                textElement.style.maxWidth = '80%';
                textElement.style.wordWrap = 'break-word';
                textElement.style.wordBreak = 'break-word';
                
                textContainer.appendChild(textElement);
            }, text, mergedOptions);
            
            // Wait for fonts to load
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Take screenshot
            const resultBuffer = await page.screenshot({ type: 'jpeg', quality: 95 });
            return Buffer.from(resultBuffer);
        } finally {
            await page.close().catch(() => {});
        }
    }

    /**
     * Generate animated text sticker using HTML/CSS
     * This leverages the advanced animation capabilities of CSS
     */
    static async generateAnimatedTextSticker(
        text: string,
        options: {
            fontSize?: number;
            fontFamily?: string;
            color?: string;
            backgroundColor?: string;
            animation?: 'fade' | 'bounce' | 'pulse' | 'glitch' | 'typing' | 'wave';
            duration?: number;
            width?: number;
            height?: number;
            style?: string;
        } = {}
    ): Promise<Buffer> {
        // Default options
        const {
            fontSize = 48,
            fontFamily = 'Arial, "Noto Color Emoji", sans-serif',
            color = '#ffffff',
            backgroundColor = 'transparent',
            animation = 'fade',
            duration = 3,
            width = 512,
            height = 512,
            style
        } = options;
        
        // If a predefined style is specified, use it as a base (merged with options below)
        if (style && Object.keys(this.getTextStyles()).includes(style)) {
            const styleOptions = this.getTextStyles()[style];
            Object.assign(options, { ...styleOptions, ...options });
        }
        
        const browser = await this.initBrowser();
        const page = await browser.newPage();
        
        try {
            // Set viewport size
            await page.setViewport({ width, height, deviceScaleFactor: 2 });
            
            // Define animations
            const animations = {
                fade: `
                    @keyframes fade {
                        0% { opacity: 0; transform: scale(0.8); }
                        100% { opacity: 1; transform: scale(1); }
                    }
                `,
                bounce: `
                    @keyframes bounce {
                        0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                        40% { transform: translateY(-30px); }
                        60% { transform: translateY(-15px); }
                    }
                `,
                pulse: `
                    @keyframes pulse {
                        0% { transform: scale(1); }
                        50% { transform: scale(1.1); }
                        100% { transform: scale(1); }
                    }
                `,
                glitch: `
                    @keyframes glitch {
                        0%, 100% { transform: translate(0); }
                        20% { transform: translate(-5px, 5px); }
                        40% { transform: translate(5px, -5px); }
                        60% { transform: translate(-5px, -5px); }
                        80% { transform: translate(5px, 5px); }
                    }
                `,
                typing: `
                    @keyframes typing {
                        from { width: 0; }
                        to { width: 100%; }
                    }
                    @keyframes blink {
                        50% { border-color: transparent; }
                    }
                `,
                wave: `
                    @keyframes wave {
                        0% { transform: translateY(0px); }
                        25% { transform: translateY(-15px); }
                        50% { transform: translateY(0px); }
                        75% { transform: translateY(15px); }
                        100% { transform: translateY(0px); }
                    }
                `
            };
            
            // Animation style
            const animationStyle = animations[animation];
            const animationApply = animation === 'typing' 
                ? `
                    overflow: hidden;
                    white-space: nowrap;
                    border-right: 3px solid ${color};
                    width: 0;
                    animation: 
                        typing ${duration}s steps(40, end) forwards,
                        blink 0.75s step-end infinite;
                `
                : `animation: ${animation} ${duration}s ease-in-out infinite;`;
            
            // Generate HTML content
            const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
                        
                        * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                        }
                        
                        ${animationStyle}
                        
                        body {
                            width: ${width}px;
                            height: ${height}px;
                            background: ${backgroundColor};
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            overflow: hidden;
                        }
                        
                        .text-container {
                            text-align: center;
                            ${animation === 'wave' ? 'display: flex;' : ''}
                        }
                        
                        .text {
                            font-family: ${fontFamily};
                            font-size: ${fontSize}px;
                            color: ${color};
                            ${animationApply}
                            font-feature-settings: "liga" 1, "calt" 1;
                            font-variant-emoji: emoji;
                        }
                        
                        ${animation === 'wave' ? `
                            .char {
                                display: inline-block;
                                animation: wave 2s ease-in-out infinite;
                            }
                            ${Array(text.length).fill(0).map((_, i) => `
                                .char:nth-child(${i + 1}) {
                                    animation-delay: ${i * 0.1}s;
                                }
                            `).join('')}
                        ` : ''}
                    </style>
                </head>
                <body>
                    <div class="text-container">
                        ${animation === 'wave' 
                            ? Array.from(text).map(char => `<span class="char">${char}</span>`).join('')
                            : `<div class="text">${text}</div>`
                        }
                    </div>
                    
                    <script>
                        // For advanced animations that need JavaScript
                        document.addEventListener('DOMContentLoaded', () => {
                            // Future JavaScript enhancements can be added here
                        });
                    </script>
                </body>
                </html>
            `;
            
            await page.setContent(html);
            
            // Wait for fonts and animations to load
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // For animated output, we'd ideally capture a video or GIF
            // But for now, we'll just capture a snapshot of the animation
            const resultBuffer = await page.screenshot({ 
                type: 'webp',
                omitBackground: backgroundColor === 'transparent',
                quality: 100
            });
            
            return Buffer.from(resultBuffer);
        } finally {
            await page.close().catch(() => {});
        }
    }

    /**
     * Get predefined text styles for different purposes
     * Enhanced with more stylistic options for HTML/CSS rendering
     */
    static getTextStyles(): Record<string, HtmlTextOptions> {
        return {
            meme: {
                fontSize: 40,
                fontFamily: 'Impact, "Arial Black", "Noto Color Emoji", sans-serif',
                color: '#ffffff',
                textAlign: 'center',
                position: 'top',
                shadow: true,
                stroke: true,
                strokeColor: '#000000',
                strokeWidth: 3,
                fontWeight: '900',
                textTransform: 'uppercase',
                letterSpacing: 2,
                lineHeight: 1.1
            },
            title: {
                fontSize: 48,
                fontFamily: 'Poppins, "Noto Color Emoji", sans-serif',
                color: '#ffffff',
                textAlign: 'center',
                position: 'top',
                shadow: true,
                stroke: true,
                strokeColor: '#000000',
                strokeWidth: 2,
                fontWeight: '800',
                gradient: true,
                gradientColors: ['#ff6b6b', '#4ecdc4'],
                animation: true,
                lineHeight: 1.2
            },
            caption: {
                fontSize: 32,
                fontFamily: 'Poppins, "Noto Color Emoji", sans-serif',
                color: '#ffffff',
                textAlign: 'center',
                position: 'middle',
                shadow: true,
                stroke: true,
                strokeColor: '#000000',
                strokeWidth: 2,
                fontWeight: '600',
                borderRadius: 15,
                padding: 15,
                lineHeight: 1.3
            },
            watermark: {
                fontSize: 24,
                fontFamily: 'Arial, "Noto Color Emoji", sans-serif',
                color: 'rgba(255,255,255,0.7)',
                textAlign: 'right',
                position: 'bottom',
                shadow: true,
                stroke: false,
                fontWeight: '500',
                letterSpacing: 1,
                lineHeight: 1.1
            },
            comic: {
                fontSize: 36,
                fontFamily: 'Comic Sans MS, "Noto Color Emoji", cursive',
                color: '#ffffff',
                textAlign: 'center',
                position: 'middle',
                shadow: true,
                stroke: true,
                strokeColor: '#000000',
                strokeWidth: 2,
                fontWeight: 'bold',
                gradient: true,
                gradientColors: ['#ff9a9e', '#fecfef', '#fecfef'],
                animation: true,
                lineHeight: 1.3
            },
            neon: {
                fontSize: 42,
                fontFamily: 'Poppins, "Noto Color Emoji", sans-serif',
                color: '#00ff00',
                textAlign: 'center',
                position: 'middle',
                shadow: false,
                stroke: true,
                strokeColor: '#ffffff',
                strokeWidth: 1,
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: 3,
                lineHeight: 1.2
            },
            // New styles optimized for HTML/CSS rendering
            modern: {
                fontSize: 38,
                fontFamily: 'Poppins, "Noto Color Emoji", sans-serif',
                color: '#ffffff',
                textAlign: 'center',
                position: 'middle',
                shadow: true,
                stroke: false,
                gradient: true,
                gradientColors: ['#6a11cb', '#2575fc'],
                animation: true,
                fontWeight: '600',
                letterSpacing: 1,
                lineHeight: 1.2
            },
            elegant: {
                fontSize: 36,
                fontFamily: '"Times New Roman", serif, "Noto Color Emoji"',
                color: '#ffffff',
                textAlign: 'center',
                position: 'middle',
                shadow: true,
                stroke: false,
                fontWeight: '400',
                textTransform: 'none',
                letterSpacing: 1.5,
                lineHeight: 1.4
            },
            pixel: {
                fontSize: 32,
                fontFamily: '"Courier New", monospace, "Noto Color Emoji"',
                color: '#ffffff',
                textAlign: 'center',
                position: 'middle',
                shadow: false,
                stroke: true,
                strokeColor: '#000000',
                strokeWidth: 2,
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: 2,
                lineHeight: 1.0
            },
            rainbow: {
                fontSize: 40,
                fontFamily: 'Arial, "Noto Color Emoji", sans-serif',
                color: '#ffffff',
                textAlign: 'center',
                position: 'middle',
                shadow: true,
                stroke: false,
                gradient: true,
                gradientColors: ['#ff0000', '#ffA500', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff'],
                animation: true,
                fontWeight: '700',
                lineHeight: 1.2
            }
        };
    }

    /**
     * Check if HTML/CSS renderer is available and return detailed capabilities
     * @returns Object with detailed capabilities of the HTML/CSS renderer
     */
    static async checkAvailability(): Promise<{
        available: boolean;
        puppeteer: boolean;
        highQuality: boolean;
        emojiSupport: boolean;
        animationSupport: boolean;
        gradientSupport: boolean;
    }> {
        try {
            const browser = await this.initBrowser();
            
            if (!browser) {
                return {
                    available: false,
                    puppeteer: false,
                    highQuality: false,
                    emojiSupport: false,
                    animationSupport: false,
                    gradientSupport: false
                };
            }
            
            const page = await browser.newPage();
            
            try {
                // Test for advanced CSS features support
                await page.setContent(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            .test-emoji { font-variant-emoji: emoji; }
                            .test-gradient { background: linear-gradient(45deg, red, blue); }
                            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                            .test-animation { animation: fadeIn 1s; }
                        </style>
                    </head>
                    <body>
                        <div class="test-emoji">😀</div>
                        <div class="test-gradient">Gradient</div>
                        <div class="test-animation">Animation</div>
                    </body>
                    </html>
                `);
                
                // Check if features are supported
                const emojiSupport = await page.evaluate(() => {
                    // Check for emoji font support using document.fonts
                    return document.fonts.check('1em "Apple Color Emoji"') || 
                           document.fonts.check('1em "Segoe UI Emoji"') || 
                           document.fonts.check('1em "Noto Color Emoji"');
                });
                
                const gradientSupport = await page.evaluate(() => {
                    const style = window.getComputedStyle(document.querySelector('.test-gradient')!);
                    return style.background.includes('gradient');
                });
                
                const animationSupport = await page.evaluate(() => {
                    const style = window.getComputedStyle(document.querySelector('.test-animation')!);
                    return style.animationName === 'fadeIn' || style.animation.includes('fadeIn');
                });
                
                return {
                    available: true,
                    puppeteer: true,
                    highQuality: true,
                    emojiSupport,
                    animationSupport,
                    gradientSupport
                };
            } finally {
                await page.close().catch(() => {});
            }
        } catch (error) {
            console.error('HTML/CSS renderer not available:', error);
            return {
                available: false,
                puppeteer: false,
                highQuality: false,
                emojiSupport: false,
                animationSupport: false,
                gradientSupport: false
            };
        }
    }

    /**
     * Process video with HTML/CSS rendered text overlay
     * This method combines the power of HTML/CSS text rendering with FFmpeg video processing
     * @param videoBuffer - The input video buffer
     * @param text - Text to overlay on the video
     * @param options - Text and video processing options
     */
    static async processVideoWithHtmlText(
        videoBuffer: Buffer,
        text: string,
        options: {
            fontSize?: number;
            fontFamily?: string;
            fontWeight?: string;
            color?: string;
            textAlign?: 'left' | 'center' | 'right';
            position?: 'top' | 'middle' | 'bottom';
            shadow?: boolean;
            stroke?: boolean;
            strokeColor?: string;
            strokeWidth?: number;
            backgroundColor?: string;
            backgroundOpacity?: number;
            maxDuration?: number;
            fps?: number;
            style?: string;
            gradient?: boolean;
            gradientColors?: string[];
            animation?: boolean;
        } = {}
    ): Promise<Buffer> {
        // Default options
        const {
            fontSize = 42,
            fontFamily = 'Arial, "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif',
            fontWeight = 'bold',
            color = '#ffffff',
            textAlign = 'center',
            position = 'middle',
            shadow = true,
            stroke = true,
            strokeColor = '#000000',
            strokeWidth = 2,
            maxDuration = 10,
            fps = 15,
            style,
            gradient = false,
            gradientColors = ['#ff6b6b', '#4ecdc4'],
            animation = false
        } = options;

        // If a predefined style is specified, use it as a base (merged with options)
        if (style && Object.keys(this.getTextStyles()).includes(style)) {
            const styleOptions = this.getTextStyles()[style];
            Object.assign(options, { ...styleOptions, ...options });
        }

        // Create temporary directory for files
        const tempDir = path.join(__dirname, '../../temp');
        await fs.mkdir(tempDir, { recursive: true }).catch(() => {});
        
        const videoInput = path.join(tempDir, `video_input_${Date.now()}.mp4`);
        const textOverlay = path.join(tempDir, `text_overlay_${Date.now()}.png`);
        const videoOutput = getTempWebpPath(tempDir, 'video_output');

        try {
            // Save input video
            await fs.writeFile(videoInput, videoBuffer);
            
            // Check video duration
            const execAsync = promisify(exec);
            try {
                const { stdout } = await execAsync(`ffprobe -v error -select_streams v:0 -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoInput}"`);
                const duration = parseFloat(stdout.trim());
                
                if (duration > maxDuration) {
                    console.log(`⚠️ Video duration (${duration.toFixed(1)}s) exceeds maximum (${maxDuration}s). It will be trimmed.`);
                }
            } catch (error) {
                console.log('⚠️ Could not determine video duration:', error);
            }

            // Determine position coordinates for text overlay
            let vPosition = '';
            switch (position) {
                case 'top': vPosition = '10'; break;
                case 'middle': vPosition = '(h-overlay_h)/2'; break;
                case 'bottom': default: vPosition = 'h-overlay_h-10'; break;
            }

            let hPosition = '(w-overlay_w)/2'; // Default center
            if (textAlign === 'left') hPosition = '10';
            else if (textAlign === 'right') hPosition = 'w-overlay_w-10';

            // Generate HTML text overlay using our existing renderTextToImage method
            console.log('🎨 Generating HTML text overlay for video');
            
            const textOptions: HtmlTextOptions = {
                fontSize,
                fontFamily,
                color,
                textAlign,
                position,
                shadow,
                stroke,
                strokeColor,
                strokeWidth,
                gradient,
                gradientColors,
                animation,
                fontWeight: fontWeight as 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900',
                backgroundColor: 'transparent' // Always use transparent background for overlay
            };
            
            const textBuffer = await this.renderTextToImage(text, textOptions);
            await fs.writeFile(textOverlay, textBuffer);

            // Process video with FFmpeg using the HTML text overlay
            console.log('🎬 Processing video with HTML text overlay');
            
            // Build the FFmpeg command for combining video with HTML text overlay
            // Using mobile-optimized WebP parameters
            const ffmpegCommand = `ffmpeg -i "${videoInput}" -i "${textOverlay}" -filter_complex "[0:v]fps=${fps},${getStandardScaleFilter()},setsar=1[bg];[1:v]format=rgba[overlay];[bg][overlay]overlay=${hPosition}:${vPosition}:format=auto" -t ${maxDuration} ${getWebpOutputArgs({
                fps,
                lossless: false, 
                quality: 80,
                loop: 0,
                maxDuration
            })} -y "${videoOutput}"`;
            
            console.log('🔧 FFmpeg command:', ffmpegCommand);
            await execAsync(ffmpegCommand);
            
            // Read and return the output file
            const outputBuffer = await fs.readFile(videoOutput);
            
            // Cleanup temporary files
            await Promise.all([
                fs.unlink(videoInput).catch(() => {}),
                fs.unlink(textOverlay).catch(() => {}),
                fs.unlink(videoOutput).catch(() => {})
            ]);
            
            console.log(`✅ Video with HTML text overlay processed successfully (${outputBuffer.length} bytes)`);
            return outputBuffer;
            
        } catch (error) {
            // Cleanup on error
            try {
                await Promise.all([
                    fs.unlink(videoInput).catch(() => {}),
                    fs.unlink(textOverlay).catch(() => {}),
                    fs.unlink(videoOutput).catch(() => {})
                ]);
            } catch (cleanupError) {
                console.error('Error during cleanup:', cleanupError);
            }
            
            console.error('❌ Error processing video with HTML text:', error);
            
            // Attempt fallback to direct FFmpeg text rendering
            return this.processVideoWithFfmpegText(videoBuffer, text, options);
        }
    }
    
    /**
     * Fallback method for processing video with direct FFmpeg text rendering
     * Used when the HTML/CSS overlay approach fails
     */
    private static async processVideoWithFfmpegText(
        videoBuffer: Buffer,
        text: string,
        options: {
            fontSize?: number;
            color?: string;
            position?: 'top' | 'middle' | 'bottom';
            backgroundColor?: string;
            backgroundOpacity?: number;
            maxDuration?: number;
            fps?: number;
            [key: string]: unknown;
        } = {}
    ): Promise<Buffer> {
        console.log('🔄 Falling back to direct FFmpeg text rendering for video');
        
        // Default options
        const {
            fontSize = 42,
            color = '#ffffff',
            position = 'middle',
            backgroundColor = 'black',
            backgroundOpacity = 0.5,
            maxDuration = 10,
            fps = 15
        } = options;
        
        // Create temporary directory for files
        const tempDir = path.join(__dirname, '../../temp');
        await fs.mkdir(tempDir, { recursive: true }).catch(() => {});
        
        const videoInput = path.join(tempDir, `video_input_${Date.now()}.mp4`);
        const videoOutput = getTempWebpPath(tempDir, 'video_output_fallback');
        
        try {
            // Save input video
            await fs.writeFile(videoInput, videoBuffer);
            
            // Escape text for FFmpeg
            const escapedText = this.escapeFfmpegText(text);
            
            // Determine text position
            let textPos: string;
            switch (position) {
                case 'top': textPos = 'x=(w-text_w)/2:y=h*0.1'; break;
                case 'middle': textPos = 'x=(w-text_w)/2:y=(h-text_h)/2'; break;
                case 'bottom': default: textPos = 'x=(w-text_w)/2:y=h*0.9'; break;
            }
            
            // Build the FFmpeg command for direct text rendering with mobile-optimized WebP parameters
            const execAsync = promisify(exec);
            const ffmpegCommand = `ffmpeg -i "${videoInput}" -vf "fps=${fps},${getStandardScaleFilter()},drawtext=text='${escapedText}':fontsize=${fontSize}:fontcolor=${color}:${textPos}:box=1:boxcolor=${backgroundColor}@${backgroundOpacity}:boxborderw=5" -t ${maxDuration} ${getWebpOutputArgs({
                fps,
                lossless: false,
                quality: 80,
                loop: 0,
                maxDuration
            })} -y "${videoOutput}"`;
            
            console.log('🔧 FFmpeg fallback command:', ffmpegCommand);
            await execAsync(ffmpegCommand);
            
            // Read and return the output file
            const outputBuffer = await fs.readFile(videoOutput);
            
            // Cleanup temporary files
            await Promise.all([
                fs.unlink(videoInput).catch(() => {}),
                fs.unlink(videoOutput).catch(() => {})
            ]);
            
            console.log(`✅ Video with FFmpeg text processed successfully (${outputBuffer.length} bytes)`);
            return outputBuffer;
            
        } catch (error) {
            // Cleanup on error
            try {
                await Promise.all([
                    fs.unlink(videoInput).catch(() => {}),
                    fs.unlink(videoOutput).catch(() => {})
                ]);
            } catch (cleanupError) {
                console.error('Error during cleanup:', cleanupError);
            }
            
            console.error('❌ Error in FFmpeg fallback processing:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to process video with text: ${errorMessage}`);
        }
    }
}
