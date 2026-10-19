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
| Terço personalizado: cores, cruzes, medalhas, preço do nome | `lib/customizer.ts` |
| Cores e tema | `app/globals.css` |

## Pagamento PIX

- **Sem `ABACATEPAY_API_KEY`**: o checkout gera um PIX estático na chave de `lib/store-config.ts`.
  Você confere o extrato e clica em **Confirmar pagamento recebido** em `/admin/pedidos`.
- **Com `ABACATEPAY_API_KEY`**: QR Code dinâmico da AbacatePay e confirmação automática
  (a tela consulta a AbacatePay a cada 5 s; o webhook acelera isso).
  Cadastre o webhook: `https://SEU-DOMINIO/api/payment/webhook?webhookSecret=<ABACATEPAY_WEBHOOK_SECRET>`.

O botão "Simular confirmação bancária" só aparece em desenvolvimento ou com chave sandbox da AbacatePay.

## Contas e permissões

Há dois papéis: **cliente** (padrão) e **admin**.

| | Visitante | Cliente | Admin |
| --- | --- | --- | --- |
| Comprar (checkout PIX) | — | ✓ com e-mail **e** celular confirmados | ✓ (mesma regra) |
| Acompanhar pedido por nº + e-mail | ✓ | ✓ | ✓ |
| `/conta`: meus pedidos, dados, senha | — | ✓ | ✓ |
| `/admin/pedidos` e `/admin/usuarios` | — | — | ✓ |

- Telas: `/entrar`, `/cadastrar`, `/conta`, `/esqueci-senha`, `/redefinir-senha`.
- **Login com Google** e **confirmação do celular por SMS** usam o Firebase Auth (variáveis `NEXT_PUBLIC_FIREBASE_*`).
  O servidor confere o token do Firebase pelas chaves públicas do Google — não há chave privada.
  No console do Firebase:
  1. *Authentication > Método de login*: ative **Google** e **Telefone**;
  2. *Authentication > Configurações > Política de região de SMS*: **permita o Brasil** — sem isso o Firebase recusa
     todo SMS ("SMS unable to be sent until this region enabled");
  3. *Authentication > Configurações > Domínios autorizados*: adicione o domínio da loja;
  4. sem conta de faturamento o limite é 10 SMS por dia; para testar sem gastar, cadastre números de teste com
     código fixo em *Método de login > Telefone*.
- Quem entra com Google já tem o e-mail confirmado. Se já existia uma conta com o mesmo e-mail **não confirmado**,
  o Google é ligado a ela e a senha antiga é apagada (evita que alguém que cadastrou o e-mail de outra pessoa mantenha acesso).
- Um celular confirmado só pode pertencer a uma conta. O telefone só muda por nova verificação.
- **Primeiro admin**: coloque seu e-mail em `ADMIN_EMAILS` e crie a conta em `/cadastrar`.
  Isso só funciona enquanto a loja não tem nenhum admin. Os próximos são promovidos em `/admin/usuarios`.
- Senhas com scrypt; sessão em cookie `httpOnly` assinado com `SESSION_SECRET`
  (gere com `node scripts/generate-session-secret.js`).
- Trocar a senha ou mudar o papel de alguém encerra as sessões antigas dessa pessoa.
- Em desenvolvimento, `.env.local` tem as senhas das contas de teste `admin@kairos.test` e `cliente@kairos.test`
  (crie-as em `/cadastrar` se a pasta `.data` estiver vazia).
- **Verificação de e-mail**: ao se cadastrar, a pessoa recebe um link (vale 24 h; reenviar em `/conta`).
  Com o e-mail confirmado, `/conta` mostra também os pedidos feitos como visitante com esse e-mail.
- **Esqueci minha senha**: link de uso único que vale 1 h; ao redefinir, todas as sessões são encerradas.
- Os e-mails saem pelo Gmail (`EMAIL_USER`/`EMAIL_PASSWORD`). Sem essas variáveis, em desenvolvimento
  o link aparece no console do servidor (`[mail:dev]`). Limite: 10 envios/h por IP e 3/h por e-mail.
- Em produção defina `SITE_URL` (ex.: `https://kairos.com.br`) para montar os links dos e-mails.

## Antes de publicar

1. **Banco de dados**: defina `DATABASE_URL` (MySQL/MariaDB) — obrigatório na Vercel, senão as contas e os pedidos
   se perdem e o login cai. Sem ela, os dados ficam em `.data/*.json` (bom só para desenvolvimento/VPS).
2. Substitua os depoimentos de exemplo em `lib/testimonials.ts` por depoimentos reais.
3. Confirme se os modelos "Madeira Nobre" e "Pérola Suave" existem (ou marque `available: false`).
4. Configure as variáveis de `.env.example`.
5. Configure `EMAIL_USER`/`EMAIL_PASSWORD` e `SITE_URL`: sem eles, verificação de e-mail e recuperação de senha não enviam nada.
