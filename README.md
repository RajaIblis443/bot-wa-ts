# WhatsApp Bot dengan TypeScript

Bot WhatsApp yang dibuat dengan TypeScript menggunakan library Baileys dengan fitur lengkap dan struktur kode yang rapi.

## ✨ Fitur

### 📋 Commands Dasar

- `/help` - Menampilkan daftar semua command
- `/ping` - Cek status bot dan uptime
- `/info` - Informasi detail tentang bot

### 🎉 Commands Fun

- `/joke` - Mendapatkan joke random
- `/quote` - Mendapatkan quote inspirasional

### 🛠️ Commands Utility

- `/qr <text>` - Generate QR code dari text
- `/shorturl <url>` - Mempersingkat URL
- `/weather <city>` - Mendapatkan info cuaca (perlu API key)

### 🎨 Commands Media

- `/sticker` - Convert gambar ke sticker (reply ke gambar)

### 🤖 Auto Reply

- Responds to greetings: "hello", "hi", "hey"
- Responds to "good morning", "good night"
- Responds to "thank you"

## 📁 Struktur Project

```
bot-wa/
├── src/
│   ├── bot/
│   │   └── whatsappBot.ts          # Main bot class
│   ├── commands/
│   │   ├── basic.ts                # Basic commands (help, ping, info)
│   │   ├── fun.ts                  # Fun commands (joke, quote)
│   │   ├── media.ts                # Media commands (sticker)
│   │   └── utility.ts              # Utility commands (qr, shorturl, weather)
│   ├── config/
│   │   └── constants.ts            # Configuration and constants
│   ├── handlers/
│   │   ├── connectionHandler.ts    # Connection management
│   │   └── messageHandler.ts       # Message processing
│   ├── types/
│   │   └── index.ts                # TypeScript interfaces
│   └── utils/
│       └── messageUtils.ts         # Message utilities
├── session/                        # WhatsApp session files
├── index.ts                        # Entry point
├── package.json
├── tsconfig.json
└── nodemon.json
```

## 🚀 Cara Menjalankan

### 1. Install Dependencies

```bash
npm install
```

### 2. Jalankan Bot

```bash
# Development mode dengan auto-reload
npm run dev

# atau
nodemon

# Production mode
npm start
```

### 3. Scan QR Code

- QR code akan muncul di terminal
- Scan dengan WhatsApp di phone Anda
- Bot akan otomatis connect

## 🔧 Konfigurasi

### Environment Variables

Buat file `.env` (optional):

```env
OPENWEATHER_API_KEY=your_api_key_here
```

### Bot Configuration

Edit `src/config/constants.ts`:

```typescript
export const BOT_CONFIG: BotConfig = {
  sessionPath: path.join(__dirname, "../../session"),
  logLevel: "silent",
  markOnlineOnConnect: true,
  browser: ["MyWhatsAppBot", "Chrome", "1.0.0"],
};
```

## 📚 Cara Menambah Command Baru

### 1. Buat Command Class

```typescript
// src/commands/mycommand.ts
import { WASocket } from "@whiskeysockets/baileys";
import { MessageUtils } from "../utils/messageUtils";

export class MyCommand {
  static async execute(
    sock: WASocket,
    chatId: string,
    senderId: string,
    args: string[]
  ): Promise<void> {
    await MessageUtils.sendMessage(sock, chatId, "Hello from my command!");
  }
}
```

### 2. Register Command

Edit `src/handlers/messageHandler.ts`:

```typescript
import { MyCommand } from "../commands/mycommand";

// Tambahkan dalam initializeCommands()
{
    command: '/mycommand',
    handler: async (sock, chatId, senderId, args) => {
        await MyCommand.execute(sock, chatId, senderId, args);
    },
    description: 'My custom command'
}
```

## 🛡️ Best Practices

### 1. Error Handling

- Semua command memiliki try-catch
- Error logging dengan console.error
- User-friendly error messages

### 2. Type Safety

- Menggunakan TypeScript interfaces
- Proper typing untuk semua functions
- Type-safe command handlers

### 3. Code Organization

- Separation of concerns
- Modular architecture
- Reusable utilities

### 4. Security

- Input validation
- URL validation
- Rate limiting (bisa ditambahkan)

## 🐛 Troubleshooting

### Bot tidak connect

1. Pastikan WhatsApp Web tidak terbuka di browser
2. Hapus folder `session` dan scan QR lagi
3. Restart bot

### Command tidak respond

1. Cek console untuk error messages
2. Pastikan command dimulai dengan `/`
3. Cek apakah bot masih connected

### Memory issues

1. Restart bot secara berkala
2. Monitor memory usage
3. Implementasi cleanup routines

## 🔄 Auto Restart

Bot memiliki built-in auto-restart mechanism:

- Reconnect otomatis jika koneksi terputus
- Graceful shutdown dengan SIGINT/SIGTERM
- Error recovery

## 📝 Logging

Bot menggunakan structured logging:

- Connection status
- Message processing
- Error tracking
- Command execution

## 🚧 Pengembangan

### Development Mode

```bash
nodemon
```

### Production Mode

```bash
npm start
```

### Linting

```bash
npm run lint
```

## 📋 TODO

- [ ] Database integration
- [ ] User management
- [ ] Rate limiting
- [ ] Webhooks support
- [ ] Multi-device support
- [ ] Scheduled messages
- [ ] Plugin system

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - bebas digunakan untuk proyek apapun.
