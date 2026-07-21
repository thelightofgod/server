-- ================================================================
-- BiTechnology Writeback — Supabase Schema
-- Supabase SQL Editor'da çalıştır
-- ================================================================

-- 1. Müşteri / API key tablosu
CREATE TABLE IF NOT EXISTS tenants (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(255) NOT NULL,
    api_key    VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Tüm değişikliklerin log tablosu
CREATE TABLE IF NOT EXISTS transactions (
    id          BIGSERIAL PRIMARY KEY,
    tenant_name VARCHAR(255) NOT NULL,
    user_id     VARCHAR(255),
    row_key     VARCHAR(255) NOT NULL,
    field_name  VARCHAR(255) NOT NULL,
    old_value   TEXT,
    new_value   TEXT NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- 3. Index'ler
CREATE INDEX IF NOT EXISTS idx_transactions_tenant ON transactions (tenant_name);
CREATE INDEX IF NOT EXISTS idx_transactions_user   ON transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date   ON transactions (created_at);

-- Örnek müşteri ekle:
-- INSERT INTO tenants (name, api_key) VALUES ('Migros', 'mg_abc123');
-- INSERT INTO tenants (name, api_key) VALUES ('Yataş',  'yt_abc123');
