-- NotebookLM Authentication Support (Issue: setup auth notebooklm)
-- Stores NotebookLM OAuth credentials and notebook metadata

CREATE TABLE IF NOT EXISTS notebooklm_credentials (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at INTEGER,
  token_type TEXT NOT NULL DEFAULT 'oauth',
  scope TEXT,
  email TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS notebooklm_credentials_user_id
  ON notebooklm_credentials(user_id);

CREATE TABLE IF NOT EXISTS notebooklm_notebooks (
  id TEXT PRIMARY KEY,
  credential_id TEXT NOT NULL,
  notebook_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (credential_id) REFERENCES notebooklm_credentials(id) ON DELETE CASCADE,
  UNIQUE(credential_id, notebook_id)
);

CREATE INDEX IF NOT EXISTS notebooklm_notebooks_credential_id
  ON notebooklm_notebooks(credential_id);
