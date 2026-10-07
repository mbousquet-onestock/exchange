-- Logs des appels API OneStock de l'extension exchange.
-- Les tables existent déjà dans la base partagée avec l'extension substitution :
-- le CREATE ne sert que pour un environnement vierge.

CREATE TABLE IF NOT EXISTS api_logs (
  id            bigserial PRIMARY KEY,
  created_at    timestamptz NOT NULL DEFAULT now(),
  method        text NOT NULL,
  url           text NOT NULL,
  request       jsonb,
  status        integer,
  duration_ms   integer,
  response      jsonb,
  error         text,
  site_id       text,
  extension_id  text,
  environment   text
);

CREATE INDEX IF NOT EXISTS api_logs_created_at_idx ON api_logs (created_at DESC);

-- Paramètre d'activation des logs (true / false).
-- Global pour l'extension exchange en qualif ; ajouter une ligne avec site_id
-- (ex. 'o0057') pour surcharger site par site.
INSERT INTO settings (key, value, updated_at, site_id, extension_id, environment, scope)
VALUES ('api_logs_enabled', 'true', now(), NULL, 'exchange', 'qualif', 'extension');
