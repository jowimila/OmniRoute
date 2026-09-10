/**
 * NotebookLM API Client
 * Handles OAuth-authenticated requests to Google NotebookLM API
 */

const NOTEBOOKLM_BASE_URL = "https://notebooklm.googleapis.com/v1alpha";

interface NotebookLMError {
  code: number;
  message: string;
  status: string;
}

async function request<T>(
  endpoint: string,
  accessToken: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET",
  body?: unknown
): Promise<T> {
  const url = `${NOTEBOOKLM_BASE_URL}${endpoint}`;
  const headers: HeadersInit = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const error: NotebookLMError = await response.json().catch(() => ({
      code: response.status,
      message: response.statusText,
      status: "UNKNOWN",
    }));

    throw new Error(
      `NotebookLM API Error (${error.code}): ${error.message || error.status}`
    );
  }

  return response.json();
}

export const notebooklmApi = {
  /**
   * List all notebooks accessible with the given token
   */
  async listNotebooks(accessToken: string, pageSize = 50) {
    const response: any = await request(
      `/notebooks?pageSize=${pageSize}`,
      accessToken,
      "GET"
    );
    return response.notebooks || [];
  },

  /**
   * Get details of a specific notebook
   */
  async getNotebook(accessToken: string, notebookId: string) {
    return request(`/notebooks/${notebookId}`, accessToken, "GET");
  },

  /**
   * Create a new notebook
   */
  async createNotebook(
    accessToken: string,
    title: string,
    description?: string,
    sources?: Array<{ url?: string; text?: string; filename?: string }>
  ) {
    const body: any = {
      displayName: title,
    };

    if (description) {
      body.description = description;
    }

    const notebook: any = await request("/notebooks", accessToken, "POST", body);

    if (sources && sources.length > 0) {
      await notebooklmApi.addSources(accessToken, notebook.name, sources);
    }

    return notebook;
  },

  /**
   * Add sources to a notebook
   */
  async addSources(
    accessToken: string,
    notebookId: string,
    sources: Array<{ url?: string; text?: string; filename?: string }>
  ) {
    const results = [];

    for (const source of sources) {
      try {
        const body: any = {};

        if (source.url) {
          body.uriSource = { uri: source.url };
        } else if (source.text) {
          body.textSource = { text: source.text };
        }

        if (!body.uriSource && !body.textSource) {
          continue;
        }

        const result: any = await request(
          `/${notebookId}/sources`,
          accessToken,
          "POST",
          body
        );

        results.push({
          sourceId: result.name,
          title: source.filename || source.url || "Text source",
          status: "added",
        });
      } catch (error) {
        results.push({
          title: source.filename || source.url || "Text source",
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  },

  /**
   * Chat with a notebook (ask questions about its content)
   */
  async chat(
    accessToken: string,
    notebookId: string,
    message: string,
    conversationId?: string
  ) {
    const body: any = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: message,
            },
          ],
        },
      ],
    };

    if (conversationId) {
      body.conversationId = conversationId;
    }

    const response: any = await request(
      `/${notebookId}:chat`,
      accessToken,
      "POST",
      body
    );

    // Extract content from the response
    const content =
      response.candidates?.[0]?.content?.parts?.[0]?.text || response.text || "";
    const citations = response.candidates?.[0]?.citations || [];

    return {
      content,
      citations,
      conversationId: response.conversationId || conversationId,
      confidence: response.confidence || 0.9,
    };
  },

  /**
   * Delete a notebook
   */
  async deleteNotebook(accessToken: string, notebookId: string) {
    await request(`/notebooks/${notebookId}`, accessToken, "DELETE");
    return { success: true };
  },

  /**
   * Update notebook metadata
   */
  async updateNotebook(
    accessToken: string,
    notebookId: string,
    updates: { title?: string; description?: string }
  ) {
    const body: any = {};

    if (updates.title) {
      body.displayName = updates.title;
    }

    if (updates.description) {
      body.description = updates.description;
    }

    return request(
      `/notebooks/${notebookId}`,
      accessToken,
      "PATCH",
      body
    );
  },
};
