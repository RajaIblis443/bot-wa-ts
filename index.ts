import { WhatsAppBot } from "./src/bot/whatsappBot";

/**
 * Main entry point for the WhatsApp Bot
 */
async function main(): Promise<void> {
    console.log('🤖 Initializing WhatsApp Bot...');
    
    const bot = new WhatsAppBot();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Received SIGINT, shutting down gracefully...');
        await bot.stop();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
        await bot.stop();
        process.exit(0);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
        console.error('❌ Uncaught Exception:', error);
        console.log('🔄 Restarting bot...');
        bot.stop().then(() => {
            setTimeout(() => {
                main();
            }, 3000);
        });
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
        console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
        console.log('� Continuing...');
    });

    // Start the bot
    await bot.start();
}

// Start the application
main().catch((error) => {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
});