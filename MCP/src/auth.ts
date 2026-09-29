import type { Request, Response, NextFunction } from "express";

/**
 * Estratégias de autenticação suportadas:
 *
 *  1. API Key  — cabeçalho  X-API-Key: <chave>
 *  2. Bearer   — cabeçalho  Authorization: Bearer <token>
 *               (JWT emitido por um IdP SSO, ex.: Keycloak, Auth0, Azure AD)
 *
 * Configuração por variáveis de ambiente:
 *
 *  MCP_API_KEYS   — lista de chaves válidas separadas por vírgula
 *                   ex.: "chave1,chave2"
 *  MCP_SSO_ISSUER — URL do emissor SSO (usado para validação de Bearer tokens)
 *                   ex.: "https://accounts.google.com"
 *                   Quando definida, tokens Bearer são verificados via
 *                   instrospection/JWKS (a aplicação pode expandir isso).
 *  MCP_AUTH_MODE  — "apikey" | "bearer" | "both" (padrão: "both")
 *                   "none" desativa a autenticação (somente para desenvolvimento)
 */

// ---------------------------------------------------------------------------
// Lê a configuração do ambiente
// ---------------------------------------------------------------------------

const RAW_KEYS = process.env.MCP_API_KEYS ?? "";
const VALID_API_KEYS: Set<string> = new Set(
  RAW_KEYS.split(",")
    .map((k) => k.trim())
    .filter(Boolean)
);

const AUTH_MODE = (process.env.MCP_AUTH_MODE ?? "both").toLowerCase();
const SSO_ISSUER = process.env.MCP_SSO_ISSUER ?? "";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractApiKey(req: Request): string | null {
  return (req.headers["x-api-key"] as string | undefined) ?? null;
}

function extractBearerToken(req: Request): string | null {
  const auth = req.headers["authorization"] ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(auth);
  return match ? match[1] : null;
}

/**
 * Validação mínima de Bearer token.
 * Em produção, substitua pela verificação de assinatura JWKS ou por uma
 * chamada ao endpoint de introspection do seu IdP SSO.
 */
function validateBearerToken(token: string): boolean {
  if (!SSO_ISSUER) {
    // Se não há emissor configurado, rejeita tokens Bearer por segurança
    return false;
  }

  // Decodifica o payload sem verificar a assinatura (apenas inspeção básica).
  // ATENÇÃO: em produção use uma biblioteca como `jose` ou `jsonwebtoken`
  // para verificar a assinatura criptográfica contra o JWKS do IdP.
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8")
    );

    const now = Math.floor(Date.now() / 1000);

    // Verifica expiração
    if (payload.exp && payload.exp < now) return false;

    // Verifica emissor
    if (payload.iss && !payload.iss.startsWith(SSO_ISSUER)) return false;

    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Middleware principal
// ---------------------------------------------------------------------------

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Rota de healthcheck não requer autenticação
  if (req.path === "/health") {
    next();
    return;
  }

  if (AUTH_MODE === "none") {
    console.error(
      "[auth] AVISO: autenticação DESATIVADA (MCP_AUTH_MODE=none). Use somente em desenvolvimento."
    );
    next();
    return;
  }

  const apiKey = extractApiKey(req);
  const bearerToken = extractBearerToken(req);

  const checkApiKey =
    AUTH_MODE === "apikey" || AUTH_MODE === "both";
  const checkBearer =
    AUTH_MODE === "bearer" || AUTH_MODE === "both";

  // Tenta autenticar com API Key
  if (checkApiKey && apiKey) {
    if (VALID_API_KEYS.size === 0) {
      console.error(
        "[auth] Nenhuma MCP_API_KEYS configurada — API Key rejeitada."
      );
    } else if (VALID_API_KEYS.has(apiKey)) {
      next();
      return;
    }
  }

  // Tenta autenticar com Bearer (SSO)
  if (checkBearer && bearerToken) {
    if (validateBearerToken(bearerToken)) {
      next();
      return;
    }
  }

  // Nenhuma credencial válida encontrada
  res.status(401).json({
    error: "Unauthorized",
    message: buildUnauthorizedMessage(checkApiKey, checkBearer),
  });
}

function buildUnauthorizedMessage(
  apiKey: boolean,
  bearer: boolean
): string {
  const methods: string[] = [];
  if (apiKey) methods.push("X-API-Key header");
  if (bearer) methods.push("Authorization: Bearer <token> (SSO)");
  return `Autenticação necessária. Forneça: ${methods.join(" ou ")}.`;
}
