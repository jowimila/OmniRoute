import { getDbInstance } from "./core";

export interface NotebookLMCredential {
  id: string;
  userId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  tokenType: "oauth" | "personal_access_token";
  scope?: string;
  email?: string;
  createdAt: number;
  updatedAt: number;
}

export interface NotebookLMNotebook {
  id: string;
  credentialId: string;
  notebookId: string;
  title: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export async function saveNotebookLMCredential(
  userId: string,
  credential: Omit<NotebookLMCredential, "id" | "createdAt" | "updatedAt">
): Promise<NotebookLMCredential> {
  const db = getDbInstance();
  const id = `nlm_cred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = Date.now();

  const stmt = db.prepare(`
    INSERT INTO notebooklm_credentials
    (id, user_id, access_token, refresh_token, expires_at, token_type, scope, email, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    userId,
    credential.accessToken,
    credential.refreshToken || null,
    credential.expiresAt || null,
    credential.tokenType,
    credential.scope || null,
    credential.email || null,
    now,
    now
  );

  return {
    id,
    userId,
    ...credential,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getNotebookLMCredential(
  credentialId: string
): Promise<NotebookLMCredential | null> {
  const db = getDbInstance();
  const stmt = db.prepare(`
    SELECT id, user_id, access_token, refresh_token, expires_at, token_type, scope, email, created_at, updated_at
    FROM notebooklm_credentials
    WHERE id = ?
  `);

  const row = stmt.get(credentialId) as any;
  if (!row) return null;

  return {
    id: row.id,
    userId: row.user_id,
    accessToken: row.access_token,
    refreshToken: row.refresh_token,
    expiresAt: row.expires_at,
    tokenType: row.token_type,
    scope: row.scope,
    email: row.email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listNotebookLMCredentials(
  userId: string
): Promise<NotebookLMCredential[]> {
  const db = getDbInstance();
  const stmt = db.prepare(`
    SELECT id, user_id, access_token, refresh_token, expires_at, token_type, scope, email, created_at, updated_at
    FROM notebooklm_credentials
    WHERE user_id = ?
    ORDER BY created_at DESC
  `);

  const rows = stmt.all(userId) as any[];
  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    accessToken: row.access_token,
    refreshToken: row.refresh_token,
    expiresAt: row.expires_at,
    tokenType: row.token_type,
    scope: row.scope,
    email: row.email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function deleteNotebookLMCredential(credentialId: string): Promise<boolean> {
  const db = getDbInstance();
  const stmt = db.prepare(`DELETE FROM notebooklm_credentials WHERE id = ?`);
  const result = stmt.run(credentialId);
  return (result.changes ?? 0) > 0;
}

export async function updateNotebookLMToken(
  credentialId: string,
  accessToken: string,
  refreshToken?: string,
  expiresAt?: number
): Promise<void> {
  const db = getDbInstance();
  const now = Date.now();

  const stmt = db.prepare(`
    UPDATE notebooklm_credentials
    SET access_token = ?, refresh_token = ?, expires_at = ?, updated_at = ?
    WHERE id = ?
  `);

  stmt.run(
    accessToken,
    refreshToken || null,
    expiresAt || null,
    now,
    credentialId
  );
}

export async function saveNotebook(notebook: Omit<NotebookLMNotebook, "createdAt" | "updatedAt">): Promise<NotebookLMNotebook> {
  const db = getDbInstance();
  const now = Date.now();

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO notebooklm_notebooks
    (id, credential_id, notebook_id, title, description, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const id = `nlm_nb_${notebook.credentialId}_${notebook.notebookId}`;
  stmt.run(
    id,
    notebook.credentialId,
    notebook.notebookId,
    notebook.title,
    notebook.description || null,
    now,
    now
  );

  return {
    ...notebook,
    id,
    createdAt: now,
    updatedAt: now,
  };
}

export async function listNotebooks(
  credentialId: string
): Promise<NotebookLMNotebook[]> {
  const db = getDbInstance();
  const stmt = db.prepare(`
    SELECT id, credential_id, notebook_id, title, description, created_at, updated_at
    FROM notebooklm_notebooks
    WHERE credential_id = ?
    ORDER BY updated_at DESC
  `);

  const rows = stmt.all(credentialId) as any[];
  return rows.map((row) => ({
    id: row.id,
    credentialId: row.credential_id,
    notebookId: row.notebook_id,
    title: row.title,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}
