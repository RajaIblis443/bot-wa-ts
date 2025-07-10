import * as path from 'path';

/**
 * WebP output parameters optimized for WhatsApp mobile compatibility
 */
export interface WebpOptions {
    fps?: number;           // Frame rate for animated WebP (default: 12)
    lossless?: boolean;     // Whether to use lossless compression (default: false)
    quality?: number;       // Quality setting 0-100, higher = better quality (default: 80)
    loop?: number;          // Loop count, 0 = infinite (default: 0)
    maxDuration?: number;   // Maximum duration in seconds (default: 10)
    compression?: number;   // Compression level 0-6 (default: 4)
}

/**
 * Get standardized FFmpeg WebP output parameters for WhatsApp compatibility
 * These settings are optimized for maximum compatibility with WhatsApp mobile
 * 
 * @param options WebP options
 * @returns FFmpeg WebP output parameters as string
 */
export function getWebpOutputArgs(options: WebpOptions = {}): string {
    const {
        fps = 12,
        lossless = false, 
        quality = 80,
        loop = 0,
        compression = 4
    } = options;
    
    // WebP parameters optimized for WhatsApp mobile compatibility
    return `-c:v libwebp -vf "fps=${fps}" -loop ${loop} -lossless ${lossless ? 1 : 0} -compression_level ${compression} -quality ${quality} -preset default -an -vsync 0 -f webp`;
}

/**
 * Generate a temporary output file path with webp extension
 * 
 * @param tempDir Directory to create file in
 * @param prefix Prefix for the filename
 * @returns Path to temporary output file
 */
export function getTempWebpPath(tempDir: string, prefix: string = 'output'): string {
    return path.join(tempDir, `${prefix}_${Date.now()}.webp`);
}

/**
 * Generate FFmpeg scale filter that maintains aspect ratio
 * and fits within WhatsApp's 512x512 sticker size requirements
 * 
 * @returns FFmpeg scale filter string
 */
export function getStandardScaleFilter(): string {
    return 'scale=512:512:force_original_aspect_ratio=decrease';
}
