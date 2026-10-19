# Banco de dados

MySQL/MariaDB com duas tabelas, `users` e `orders`. Cada registro guarda o documento inteiro
em JSON (coluna `data`), no mesmo formato que `lib/server/db.ts` usa.

| Arquivo          | O que faz                                                     |
| ---------------- | ------------------------------------------------------------- |
| `schema.sql`     | Cria o banco `kairos` e as tabelas                            |
| `import-json.js` | Copia as contas e pedidos de `.data/*.json` para o banco      |

## Criar o banco (local, XAMPP)

```bash
mysql -h 127.0.0.1 -P 3306 -u root < database/schema.sql
node database/import-json.js
```

Se `mysql` não estiver no PATH, use `C:\xampp\mysql\bin\mysql.exe`.

## Ligar o app ao banco

No `.env.local`:

```
DATABASE_URL=mysql://root@127.0.0.1:3306/kairos
```

Sem `DATABASE_URL`, o app volta a usar os arquivos JSON em `.data`.
