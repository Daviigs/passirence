/**
 * Verifica se o JID é de grupo, broadcast ou status.
 */
export function shouldIgnoreJid(jid: string | undefined | null): boolean {
  if (!jid) return true;

  return (
    jid.endsWith('@g.us') ||
    jid.endsWith('@broadcast') ||
    jid === 'status@broadcast'
  );
}

export function isPersonalChatJid(jid: string): boolean {
  return jid.endsWith('@s.whatsapp.net');
}
