# Kairos — Terços Artesanais

Loja virtual em Next.js 16 + React 19 + Tailwind 4, com pagamento PIX.

## Rodar localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000. O arquivo `.env.local` (não versionado) já tem uma senha de teste do painel `/admin`.

## Onde editar

| O quê | Arquivo |
| --- | --- |
| Produtos, fotos, textos e especificações | `lib/products.ts` |
| Preço, frete, chave PIX, WhatsApp, Instagram | `lib/store-config.ts` |
| Depoimentos (substitua pelos reais!) | `lib/testimonials.ts` |
| Cores e tema | `app/globals.css` |

## Pagamento PIX

- **Sem `ABACATEPAY_API_KEY`**: o checkout gera um PIX estático na chave de `lib/store-config.ts`.
  Você confere o extrato e clica em **Confirmar pagamento recebido** em `/admin/pedidos`.
- **Com `ABACATEPAY_API_KEY`**: QR Code dinâmico da AbacatePay e confirmação automática
  (a tela consulta a AbacatePay a cada 5 s; o webhook acelera isso).
  Cadastre o webhook: `https://SEU-DOMINIO/api/payment/webhook?webhookSecret=<ABACATEPAY_WEBHOOK_SECRET>`.

O botão "Simular confirmação bancária" só aparece em desenvolvimento ou com chave sandbox da AbacatePay.

## Painel admin

`/admin` → login com senha. Gere a senha de produção com:

```bash
node scripts/generate-password-hash.js "sua-senha-forte"
```

e coloque `ADMIN_PASSWORD_HASH` e `SESSION_SECRET` nas variáveis de ambiente da hospedagem.

## Antes de publicar

1. **Banco de dados**: os pedidos ficam em `.data/orders.json`. Isso funciona num servidor/VPS,
   mas **na Vercel o disco não é persistente** — troque `lib/server/orders-store.ts` por Postgres/Supabase/Neon.
2. Substitua os depoimentos de exemplo em `lib/testimonials.ts` por depoimentos reais.
3. Confirme se os modelos "Madeira Nobre" e "Pérola Suave" existem (ou marque `available: false`).
4. Configure as variáveis de `.env.example`.
