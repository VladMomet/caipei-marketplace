-- Migration: add site_tier enum + columns to orders/sourcing_requests
-- Идемпотентна — можно запускать многократно.

DO $$ BEGIN
  CREATE TYPE site_tier AS ENUM ('lite', 'standard', 'prestige');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS site_tier site_tier NOT NULL DEFAULT 'standard';

ALTER TABLE sourcing_requests
  ADD COLUMN IF NOT EXISTS site_tier site_tier NOT NULL DEFAULT 'standard';

-- Индексы для отчётов по тарифу
CREATE INDEX IF NOT EXISTS orders_site_tier_idx ON orders(site_tier, created_at DESC);
CREATE INDEX IF NOT EXISTS sourcing_site_tier_idx ON sourcing_requests(site_tier, created_at DESC);
