import type { proto } from '@whiskeysockets/baileys';

const MAX_STORED_MESSAGES = 512;

function toStoreKey(key: proto.IMessageKey): string | null {
  if (!key.id || !key.remoteJid) return null;
  return `${key.remoteJid}:${key.id}:${key.fromMe ? '1' : '0'}`;
}

/**
 * Cache em memória para getMessage do Baileys.
 * Necessário para retry de descriptografia em dispositivos vinculados (ex.: WhatsApp Web).
 */
class SentMessageStore {
  private readonly store = new Map<string, proto.IMessage>();
  private readonly order: string[] = [];

  set(key: proto.IMessageKey, message: proto.IMessage | null | undefined): void {
    const storeKey = toStoreKey(key);
    if (!storeKey || !message) return;

    if (!this.store.has(storeKey)) {
      this.order.push(storeKey);
    }
    this.store.set(storeKey, message);

    while (this.order.length > MAX_STORED_MESSAGES) {
      const oldest = this.order.shift();
      if (oldest) this.store.delete(oldest);
    }
  }

  get(key: proto.IMessageKey): proto.IMessage | undefined {
    const storeKey = toStoreKey(key);
    if (!storeKey) return undefined;
    return this.store.get(storeKey);
  }

  clear(): void {
    this.store.clear();
    this.order.length = 0;
  }
}

export const sentMessageStore = new SentMessageStore();
