"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageUtils = void 0;
/**
 * Utility class for message operations
 */
var MessageUtils = /** @class */ (function () {
    function MessageUtils() {
    }
    /**
     * Send a text message
     */
    MessageUtils.sendMessage = function (sock, chatId, text) {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, sock.sendMessage(chatId, { text: text })];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        console.error('❌ Error sending message:', error_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Send an image message
     */
    MessageUtils.sendImage = function (sock, chatId, imageBuffer, caption) {
        return __awaiter(this, void 0, void 0, function () {
            var error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, sock.sendMessage(chatId, {
                                image: imageBuffer,
                                caption: caption
                            })];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _a.sent();
                        console.error('❌ Error sending image:', error_2);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Send a sticker
     */
    MessageUtils.sendSticker = function (sock, chatId, stickerBuffer) {
        return __awaiter(this, void 0, void 0, function () {
            var error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, sock.sendMessage(chatId, {
                                sticker: stickerBuffer,
                                mimetype: 'image/webp'
                            })];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_3 = _a.sent();
                        console.error('❌ Error sending sticker:', error_3);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Extract message text from various message types
     */
    MessageUtils.extractMessageText = function (message) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        return ((_a = message.message) === null || _a === void 0 ? void 0 : _a.conversation) ||
            ((_c = (_b = message.message) === null || _b === void 0 ? void 0 : _b.extendedTextMessage) === null || _c === void 0 ? void 0 : _c.text) ||
            ((_e = (_d = message.message) === null || _d === void 0 ? void 0 : _d.imageMessage) === null || _e === void 0 ? void 0 : _e.caption) ||
            ((_g = (_f = message.message) === null || _f === void 0 ? void 0 : _f.videoMessage) === null || _g === void 0 ? void 0 : _g.caption) ||
            ((_j = (_h = message.message) === null || _h === void 0 ? void 0 : _h.documentMessage) === null || _j === void 0 ? void 0 : _j.caption) || '';
    };
    /**
     * Check if message is from status broadcast
     */
    MessageUtils.isStatusBroadcast = function (message) {
        return message.key.remoteJid === 'status@broadcast';
    };
    /**
     * Check if message is from bot itself
     */
    MessageUtils.isFromBot = function (message) {
        return message.key.fromMe || false;
    };
    /**
     * Get sender ID from message
     */
    MessageUtils.getSenderId = function (message) {
        return message.key.participant || message.key.remoteJid || '';
    };
    /**
     * Get chat ID from message
     */
    MessageUtils.getChatId = function (message) {
        return message.key.remoteJid || '';
    };
    /**
     * Check if message has media
     */
    MessageUtils.hasMedia = function (message) {
        var _a, _b, _c, _d;
        return !!(((_a = message.message) === null || _a === void 0 ? void 0 : _a.imageMessage) ||
            ((_b = message.message) === null || _b === void 0 ? void 0 : _b.videoMessage) ||
            ((_c = message.message) === null || _c === void 0 ? void 0 : _c.documentMessage) ||
            ((_d = message.message) === null || _d === void 0 ? void 0 : _d.audioMessage));
    };
    /**
     * Get media type from message
     */
    MessageUtils.getMediaType = function (message) {
        var _a, _b, _c, _d;
        if ((_a = message.message) === null || _a === void 0 ? void 0 : _a.imageMessage)
            return 'image';
        if ((_b = message.message) === null || _b === void 0 ? void 0 : _b.videoMessage)
            return 'video';
        if ((_c = message.message) === null || _c === void 0 ? void 0 : _c.documentMessage)
            return 'document';
        if ((_d = message.message) === null || _d === void 0 ? void 0 : _d.audioMessage)
            return 'audio';
        return null;
    };
    /**
     * Format uptime to readable string
     */
    MessageUtils.formatUptime = function (uptimeSeconds) {
        var days = Math.floor(uptimeSeconds / (24 * 60 * 60));
        var hours = Math.floor((uptimeSeconds % (24 * 60 * 60)) / (60 * 60));
        var minutes = Math.floor((uptimeSeconds % (60 * 60)) / 60);
        var seconds = Math.floor(uptimeSeconds % 60);
        if (days > 0)
            return "".concat(days, "d ").concat(hours, "h ").concat(minutes, "m");
        if (hours > 0)
            return "".concat(hours, "h ").concat(minutes, "m");
        if (minutes > 0)
            return "".concat(minutes, "m ").concat(seconds, "s");
        return "".concat(seconds, "s");
    };
    /**
     * Get random item from array
     */
    MessageUtils.getRandomItem = function (array) {
        return array[Math.floor(Math.random() * array.length)];
    };
    /**
     * Validate URL
     */
    MessageUtils.isValidUrl = function (string) {
        try {
            new URL(string);
            return true;
        }
        catch (_a) {
            return false;
        }
    };
    /**
     * Clean phone number (remove special characters)
     */
    MessageUtils.cleanPhoneNumber = function (phone) {
        return phone.replace(/\D/g, '');
    };
    /**
     * Generate mention text
     */
    MessageUtils.generateMention = function (phoneNumber) {
        return "@".concat(phoneNumber.replace('@s.whatsapp.net', ''));
    };
    return MessageUtils;
}());
exports.MessageUtils = MessageUtils;
