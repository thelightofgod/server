-- ================================================================
-- BiTechnology Writeback — Supabase Schema
-- ================================================================

CREATE TABLE IF NOT EXISTS tenants (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(255) NOT NULL,
    api_key    VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS current_values (
    id          BIGSERIAL PRIMARY KEY,
    tenant_name VARCHAR(255) NOT NULL,
    row_key     VARCHAR(255) NOT NULL,
    field_name  VARCHAR(255) NOT NULL,
    value       TEXT NOT NULL,
    updated_by  VARCHAR(255),
    updated_at  TIMESTAMP DEFAULT NOW(),
    UNIQUE (tenant_name, row_key, field_name)
);

CREATE INDEX IF NOT EXISTS idx_tx_tenant  ON transactions   (tenant_name);
CREATE INDEX IF NOT EXISTS idx_tx_date    ON transactions   (created_at);
CREATE INDEX IF NOT EXISTS idx_cv_tenant  ON current_values (tenant_name);
