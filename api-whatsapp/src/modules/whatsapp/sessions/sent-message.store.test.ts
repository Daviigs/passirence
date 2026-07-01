import type { proto } from '@whiskeysockets/baileys';
import { describe, expect, it } from 'vitest';
import { sentMessageStore } from './sent-message.store.js';

describe('sentMessageStore', () => {
  const key: proto.IMessageKey = {
    remoteJid: '5511999998888@s.whatsapp.net',
    id: 'ABC123',
    fromMe: true,
  };

  const message: proto.IMessage = {
    conversation: 'Olá',
  };

  it('armazena e recupera mensagem por chave', () => {
    sentMessageStore.set(key, message);
    expect(sentMessageStore.get(key)).toEqual(message);
    sentMessageStore.clear();
  });

  it('retorna undefined para chave inexistente', () => {
    expect(sentMessageStore.get({ remoteJid: '1@s.whatsapp.net', id: 'X', fromMe: true })).toBeUndefined();
  });
});
