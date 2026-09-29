#!/usr/bin/env node
/**
 * DIO Explorer — MCP Server
 *
 * Modos de execução:
 *
 *  1. HTTP (padrão)  — inicia um servidor Express que expõe o protocolo
 *     MCP via HTTP por requisição (PerRequestHTTPServerTransport).
 *     Adequado para uso remoto, integrações via API e autenticação SSO.
 *
 *     Iniciar:  node build/index.js
 *     Porta:    MCP_PORT (padrão: 3000)
 *     Endpoint: POST /mcp
 *     Auth:     X-API-Key header  ou  Authorization: Bearer <token>
 *
 *  2. STDIO (para uso local com Bob / clientes MCP padrão)
 *     Iniciar:  MCP_TRANSPORT=stdio node build/index.js
 */

import express from "express";
import { McpServer, PerRequestHTTPServerTransport } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";

import { authMiddleware } from "./auth.js";
import { registerTools } from "./tools.js";
import { registerResources } from "./resources.js";

// ---------------------------------------------------------------------------
// Cria e configura o servidor MCP
// ---------------------------------------------------------------------------

function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "dio-explorer",
    version: "1.0.0",
  });
  registerTools(server);
  registerResources(server);
  return server;
}

// ---------------------------------------------------------------------------
// Decide o transporte
// ---------------------------------------------------------------------------

const TRANSPORT = (process.env.MCP_TRANSPORT ?? "http").toLowerCase();

if (TRANSPORT === "stdio") {
  await startStdio();
} else {
  await startHttp();
}

// ---------------------------------------------------------------------------
// Modo STDIO (para clientes locais como Bob)
// ---------------------------------------------------------------------------

async function startStdio(): Promise<void> {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[dio-explorer] MCP Server rodando em modo STDIO");
}

// ---------------------------------------------------------------------------
// Modo HTTP — PerRequestHTTPServerTransport (stateless, uma instância por req)
// ---------------------------------------------------------------------------

async function startHttp(): Promise<void> {
  const PORT = parseInt(process.env.MCP_PORT ?? "3000", 10);
  const HOST = process.env.MCP_HOST ?? "0.0.0.0";

  const app = express();

  // Parse JSON bodies
  app.use(express.json());

  // ---------------------------------------------------------------------------
  // Healthcheck público (sem autenticação)
  // ---------------------------------------------------------------------------
  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      server: "dio-explorer-mcp",
      version: "1.0.0",
      transport: "http",
      timestamp: new Date().toISOString(),
    });
  });

  // ---------------------------------------------------------------------------
  // Rota raiz — informações de uso
  // ---------------------------------------------------------------------------
  app.get("/", (_req, res) => {
    res.json({
      name: "DIO Explorer MCP Server",
      version: "1.0.0",
      description:
        "MCP Server que expõe trilhas de aprendizado, promoções e lives da DIO.",
      endpoints: {
        mcp: "POST /mcp  (protocolo MCP sobre HTTP)",
        health: "GET /health",
      },
      autenticacao: {
        metodos: ["X-API-Key header", "Authorization: Bearer <token> (SSO)"],
        modo: process.env.MCP_AUTH_MODE ?? "both",
      },
      ferramentas: [
        "list-trilhas",
        "get-trilha",
        "search-trilhas",
        "list-promocoes",
        "list-lives",
        "get-resumo-plataforma",
      ],
    });
  });

  // ---------------------------------------------------------------------------
  // Middleware de autenticação — aplicado ao endpoint MCP
  // ---------------------------------------------------------------------------
  app.use("/mcp", authMiddleware);

  // ---------------------------------------------------------------------------
  // Endpoint MCP — cria um servidor + transport por requisição (stateless)
  // ---------------------------------------------------------------------------
  app.post("/mcp", async (req, res) => {
    const server = createMcpServer();
    const transport = new PerRequestHTTPServerTransport({ req, res });

    try {
      await server.connect(transport);
    } catch (err) {
      console.error("[mcp] Erro ao processar requisição:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Erro interno no servidor MCP" });
      }
    }
  });

  // ---------------------------------------------------------------------------
  // Inicia o servidor
  // ---------------------------------------------------------------------------
  app.listen(PORT, HOST, () => {
    console.error(`[dio-explorer] MCP Server HTTP iniciado em http://${HOST}:${PORT}`);
    console.error(`[dio-explorer] Healthcheck: http://${HOST}:${PORT}/health`);
    console.error(`[dio-explorer] Endpoint MCP:  POST http://${HOST}:${PORT}/mcp`);
    console.error(
      `[dio-explorer] Auth mode: ${process.env.MCP_AUTH_MODE ?? "both"}`
    );

    if (!process.env.MCP_API_KEYS && process.env.MCP_AUTH_MODE !== "none") {
      console.error(
        "[dio-explorer] AVISO: MCP_API_KEYS não definida — " +
          "defina MCP_API_KEYS=chave1,chave2 ou use MCP_AUTH_MODE=bearer com MCP_SSO_ISSUER."
      );
    }
  });
}
