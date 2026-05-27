# API WhatsApp (Baileys)

API REST single-tenant para gerenciamento de WhatsApp e envio/recebimento de mensagens, sem integração com banco de dados.

## Stack

- Node.js 20+
- TypeScript
- Express
- [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys) 6.7.22
- Pino

## Estrutura

```
src/
├── app.ts
├── server.ts
├── config/
├── modules/whatsapp/
│   ├── controllers/
│   ├── services/        # whatsapp-manager (singleton), mensagens, boas-vindas
│   ├── routes/
│   ├── sessions/        # useMultiFileAuthState
│   ├── handlers/        # connection.update, mensagens recebidas
│   ├── utils/           # normalização de telefone/JID
│   └── types/
└── shared/
storage/auth/            # sessão persistida (gitignored)
```

## Instalação

```bash
cd api-whatsapp
cp .env.example .env
npm install
npm run dev
```

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/health` | Status da API e WhatsApp |
| GET | `/whatsapp/status` | Conexão, perfil, QR |
| POST | `/whatsapp/connect` | Inicia conexão / gera QR |
| POST | `/whatsapp/logout` | Desconecta e limpa sessão |
| POST | `/messages/send` | Mensagem genérica |
| POST | `/messages/appointment/confirmation` | Confirmação de agendamento |
| POST | `/messages/appointment/cancel` | Cancelamento |
| POST | `/messages/appointment/reminder` | Lembrete |

### Exemplo: conectar e enviar

```bash
# Conectar (escaneie o QR retornado em /whatsapp/status)
curl -X POST http://localhost:3001/whatsapp/connect

# Status (inclui qrCode em base64/string quando pendente)
curl http://localhost:3001/whatsapp/status

# Enviar mensagem
curl -X POST http://localhost:3001/messages/send \
  -H "Content-Type: application/json" \
  -d '{"phone":"5581999999999","message":"Olá"}'
```

### Agendamento

```bash
curl -X POST http://localhost:3001/messages/appointment/confirmation \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "5581999999999",
    "clientName": "João",
    "service": "Corte",
    "date": "10/05/2026",
    "time": "14:00"
  }'
```

## Segurança

- CORS configurável (`CORS_ORIGIN`)
- Rate limit (`RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS`)
- Validação de body com Zod
- Header opcional `X-API-Key` quando `API_KEY` está definido

## Boas-vindas automáticas

Na **primeira mensagem** de cada contato, a API envia a mensagem configurada em `WELCOME_MESSAGE`. Novas mensagens do mesmo número são ignoradas por `WELCOME_COOLDOWN_HOURS` (padrão: 6h). Controle em memória (`Map`), sem banco.

- Ignora grupos, status e broadcast
- Ignora mensagens do próprio bot

## Produção

```bash
npm run build
npm start
```

Defina `NODE_ENV=production` e, se possível, `API_KEY` para proteger os endpoints.
