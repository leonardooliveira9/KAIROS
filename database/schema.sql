-- Banco de dados da loja KAIROS (MySQL 5.7+ / MariaDB 10.2+)
--
-- Mesmo formato que lib/server/db.ts cria sozinho no primeiro uso: cada conta e cada pedido
-- é guardado inteiro como JSON na coluna `data`; buscas por campo usam JSON_EXTRACT.
--
-- Criar:  mysql -h 127.0.0.1 -P 3306 -u root < database/schema.sql

CREATE DATABASE IF NOT EXISTS kairos
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE kairos;

-- Contas (clientes e admins). data = { id, name, email, passwordHash, role, createdAt, ... }
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  created_at VARCHAR(32) NOT NULL,
  data LONGTEXT NOT NULL,
  -- e-mail extraído do JSON, com índice único (impede duas contas com o mesmo e-mail)
  email VARCHAR(255) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.email'))) STORED,
  KEY users_created (created_at),
  UNIQUE KEY users_email (email)
) DEFAULT CHARSET=utf8mb4;

-- Pedidos. data = { id, userId, status, customer, address, items, subtotal, shipping, total, payment, ... }
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  created_at VARCHAR(32) NOT NULL,
  data LONGTEXT NOT NULL,
  KEY orders_created (created_at)
) DEFAULT CHARSET=utf8mb4;
