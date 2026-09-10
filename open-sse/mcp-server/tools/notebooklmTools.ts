import { z } from "zod";
import {
  getNotebookLMCredential,
  listNotebookLMCredentials,
  saveNotebook,
  listNotebooks,
} from "../../../src/lib/db/notebooklm.ts";
import { notebooklmApi } from "../../../src/lib/notebooklm/api.ts";

function requireCredential(credentialId?: string): string {
  if (!credentialId) {
    throw new Error("NotebookLM credential ID required. Use notebooklm_list_credentials to find your credential ID.");
  }
  return credentialId;
}

export const notebooklmTools = [
  {
    name: "notebooklm_list_credentials",
    description:
      "List all saved NotebookLM OAuth credentials. Returns credential IDs, emails, and creation dates. Use credential ID in other operations.",
    scopes: ["admin", "read:notebooklm"],
    inputSchema: z.object({
      userId: z.string().optional().describe("User ID (defaults to current user)"),
    }),
    handler: async (args: { userId?: string }) => {
      const credentials = await listNotebookLMCredentials(args.userId || "default");
      return {
        credentials: credentials.map((c) => ({
          id: c.id,
          email: c.email,
          tokenType: c.tokenType,
          expiresAt: c.expiresAt,
          createdAt: new Date(c.createdAt).toISOString(),
        })),
        count: credentials.length,
      };
    },
  },
  {
    name: "notebooklm_list_notebooks",
    description:
      "List all notebooks in your NotebookLM account. Returns notebook IDs, titles, and descriptions. Requires a valid credential ID.",
    scopes: ["read:notebooklm"],
    inputSchema: z.object({
      credentialId: z.string().describe("NotebookLM credential ID (from notebooklm_list_credentials)"),
      pageSize: z.number().min(1).max(100).default(50).describe("Results per page (max 100)"),
    }),
    handler: async (args: { credentialId: string; pageSize?: number }) => {
      const credentialId = requireCredential(args.credentialId);
      const credential = await getNotebookLMCredential(credentialId);
      if (!credential) {
        throw new Error(`Credential not found: ${credentialId}`);
      }

      const notebooks = await notebooklmApi.listNotebooks(credential.accessToken, args.pageSize);
      const cached = await listNotebooks(credentialId);

      return {
        notebooks: notebooks.map((nb: any) => ({
          id: nb.displayName || nb.name,
          title: nb.title,
          description: nb.description,
          createdAt: nb.createTime,
          updatedAt: nb.updateTime,
        })),
        cached: cached.length,
        count: notebooks.length,
      };
    },
  },
  {
    name: "notebooklm_create_notebook",
    description:
      "Create a new notebook in NotebookLM. Returns the created notebook ID. Optionally upload documents or set description.",
    scopes: ["write:notebooklm"],
    inputSchema: z.object({
      credentialId: z.string().describe("NotebookLM credential ID"),
      title: z.string().min(1).max(255).describe("Notebook title"),
      description: z.string().max(2000).optional().describe("Optional notebook description"),
      sources: z
        .array(
          z.object({
            url: z.string().optional().describe("Public URL to source document"),
            text: z.string().optional().describe("Direct text content"),
            filename: z.string().optional().describe("Filename for reference"),
          })
        )
        .optional()
        .describe("Optional sources to import (URLs or text)"),
    }),
    handler: async (args: {
      credentialId: string;
      title: string;
      description?: string;
      sources?: Array<{ url?: string; text?: string; filename?: string }>;
    }) => {
      const credentialId = requireCredential(args.credentialId);
      const credential = await getNotebookLMCredential(credentialId);
      if (!credential) {
        throw new Error(`Credential not found: ${credentialId}`);
      }

      const notebook = await notebooklmApi.createNotebook(
        credential.accessToken,
        args.title,
        args.description,
        args.sources
      );

      await saveNotebook({
        credentialId,
        notebookId: notebook.id,
        title: args.title,
        description: args.description,
      });

      return {
        id: notebook.id,
        title: notebook.title,
        description: notebook.description,
        createdAt: notebook.createTime,
        message: "Notebook created successfully",
      };
    },
  },
  {
    name: "notebooklm_chat",
    description:
      "Chat with a NotebookLM notebook. Ask questions about the notebook's content and get AI-powered answers with citations.",
    scopes: ["read:notebooklm"],
    inputSchema: z.object({
      credentialId: z.string().describe("NotebookLM credential ID"),
      notebookId: z.string().describe("Notebook ID (from notebooklm_list_notebooks)"),
      message: z.string().min(1).max(5000).describe("Your question or message"),
      conversationId: z.string().optional().describe("Conversation ID for multi-turn chat"),
    }),
    handler: async (args: {
      credentialId: string;
      notebookId: string;
      message: string;
      conversationId?: string;
    }) => {
      const credentialId = requireCredential(args.credentialId);
      const credential = await getNotebookLMCredential(credentialId);
      if (!credential) {
        throw new Error(`Credential not found: ${credentialId}`);
      }

      const response = await notebooklmApi.chat(
        credential.accessToken,
        args.notebookId,
        args.message,
        args.conversationId
      );

      return {
        response: response.content,
        citations: response.citations || [],
        conversationId: response.conversationId,
        confidence: response.confidence,
      };
    },
  },
  {
    name: "notebooklm_get_notebook",
    description: "Get detailed information about a specific NotebookLM notebook, including its sources and metadata.",
    scopes: ["read:notebooklm"],
    inputSchema: z.object({
      credentialId: z.string().describe("NotebookLM credential ID"),
      notebookId: z.string().describe("Notebook ID"),
    }),
    handler: async (args: { credentialId: string; notebookId: string }) => {
      const credentialId = requireCredential(args.credentialId);
      const credential = await getNotebookLMCredential(credentialId);
      if (!credential) {
        throw new Error(`Credential not found: ${credentialId}`);
      }

      const notebook = await notebooklmApi.getNotebook(credential.accessToken, args.notebookId);

      return {
        id: notebook.id,
        title: notebook.title,
        description: notebook.description,
        sources: notebook.sources || [],
        createdAt: notebook.createTime,
        updatedAt: notebook.updateTime,
        resourceName: notebook.name,
      };
    },
  },
  {
    name: "notebooklm_add_sources",
    description:
      "Add sources (documents, URLs, or text) to an existing NotebookLM notebook. Supports URLs, plain text, and file uploads.",
    scopes: ["write:notebooklm"],
    inputSchema: z.object({
      credentialId: z.string().describe("NotebookLM credential ID"),
      notebookId: z.string().describe("Notebook ID"),
      sources: z
        .array(
          z.object({
            url: z.string().optional().describe("Public URL to document"),
            text: z.string().optional().describe("Plain text content"),
            filename: z.string().optional().describe("Name for this source"),
          })
        )
        .min(1)
        .max(10)
        .describe("Sources to add (up to 10)"),
    }),
    handler: async (args: {
      credentialId: string;
      notebookId: string;
      sources: Array<{ url?: string; text?: string; filename?: string }>;
    }) => {
      const credentialId = requireCredential(args.credentialId);
      const credential = await getNotebookLMCredential(credentialId);
      if (!credential) {
        throw new Error(`Credential not found: ${credentialId}`);
      }

      const results = await notebooklmApi.addSources(
        credential.accessToken,
        args.notebookId,
        args.sources
      );

      return {
        added: results.length,
        sources: results,
        message: `Added ${results.length} source(s) to notebook`,
      };
    },
  },
];
