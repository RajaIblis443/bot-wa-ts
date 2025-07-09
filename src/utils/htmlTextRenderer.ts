import puppeteer, { Browser } from 'puppeteer';

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

    /**
     * Initialize Puppeteer browser
     */
    private static async initBrowser(): Promise<Browser> {
        if (!this.browser) {
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
     * Generate text-only sticker using HTML/CSS
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
        } = {}
    ): Promise<Buffer> {
        const {
            fontSize = 60,
            fontFamily = 'Arial, sans-serif',
            fontWeight = 'bold',
            color = '#ffffff',
            backgroundColor = 'transparent',
            padding = 20,
            maxWidth = 512,
            maxHeight = 512,
            textAlign = 'center',
            textShadow = '2px 2px 4px rgba(0,0,0,0.8)'
        } = options;

        const browser = await this.initBrowser();
        const page = await browser.newPage();

        try {
            // Set viewport size
            await page.setViewport({ 
                width: maxWidth, 
                height: maxHeight,
                deviceScaleFactor: 2
            });

            // Create HTML content for text-only sticker
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
                            font-family: ${fontFamily};
                            font-size: ${fontSize}px;
                            font-weight: ${fontWeight};
                            color: ${color};
                            text-shadow: ${textShadow};
                            line-height: 1.2;
                            white-space: pre-wrap;
                            max-width: 100%;
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

            // Take screenshot with transparent background
            const buffer = await page.screenshot({
                type: 'webp',
                omitBackground: true,
                quality: 100,
                optimizeForSpeed: false,
                clip: { x: 0, y: 0, width: maxWidth, height: maxHeight }
            });

            console.log(`✅ HTML text-only sticker generated successfully (${buffer.length} bytes)`);
            return Buffer.from(buffer);

        } catch (error) {
            console.error('❌ Error generating HTML text-only sticker:', error);
            throw error;
        } finally {
            await page.close();
        }
    }

    /**
     * Get predefined text styles for different purposes
     */
    static getTextStyles(): Record<string, HtmlTextOptions> {
        return {
            meme: {
                fontSize: 40,
                fontFamily: 'Impact, "Arial Black", sans-serif',
                color: '#ffffff',
                textAlign: 'center',
                position: 'top',
                shadow: true,
                stroke: true,
                strokeColor: '#000000',
                strokeWidth: 3,
                fontWeight: '900',
                textTransform: 'uppercase',
                letterSpacing: 2
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
                animation: true
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
                padding: 15
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
                letterSpacing: 1
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
                animation: true
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
                letterSpacing: 3
            }
        };
    }

    /**
     * Check if Puppeteer is available
     */
    static async checkAvailability(): Promise<boolean> {
        try {
            const browser = await this.initBrowser();
            return !!browser;
        } catch (error) {
            console.error('Puppeteer not available:', error);
            return false;
        }
    }
}
