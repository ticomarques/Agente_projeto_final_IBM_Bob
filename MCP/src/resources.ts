import { McpServer, ResourceTemplate } from "@modelcontextprotocol/server";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { join, dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const DATA_PATH =
  process.env.DATA_PATH ??
  join(__dirname, "../../dio_explorer/data/trilhas_dio.json");

interface Trilha {
  id: number;
  nome: string;
  tecnologia: string;
  nivel: string;
  modulos: number;
  xp_total: number;
  badges: string[];
  promocao: { ativa: boolean; desconto_percent: number; validade: string | null };
  vitalicio: boolean;
  lives_ao_vivo: { titulo: string; data: string; horario: string }[];
}

function loadTrilhas(): Trilha[] {
  try {
    const raw = readFileSync(DATA_PATH, "utf8");
    return (JSON.parse(raw) as { trilhas: Trilha[] }).trilhas;
  } catch (err) {
    console.error("[resources] Erro ao carregar dados:", err);
    return [];
  }
}

/**
 * Registra os Resources MCP:
 *
 *  dio://trilhas                — catálogo completo (JSON)
 *  dio://trilhas/{id}           — detalhes de uma trilha específica
 *  dio://trilhas/promocoes      — somente trilhas com promoção ativa
 *  dio://trilhas/lives          — todas as lives de todas as trilhas
 */
export function registerResources(server: McpServer): void {
  // ------------------------------------------------------------------
  // Catálogo completo
  // ------------------------------------------------------------------
  server.registerResource(
    "trilhas-catalogo",
    "dio://trilhas",
    {
      description:
        "Catálogo completo com todas as trilhas de aprendizado disponíveis na DIO.",
      mimeType: "application/json",
    },
    async (_uri) => {
      const trilhas = loadTrilhas();
      return {
        contents: [
          {
            uri: "dio://trilhas",
            mimeType: "application/json",
            text: JSON.stringify({ trilhas }, null, 2),
          },
        ],
      };
    }
  );

  // ------------------------------------------------------------------
  // Trilha individual por id (resource template)
  // ------------------------------------------------------------------
  server.registerResource(
    "trilha-por-id",
    new ResourceTemplate("dio://trilhas/{id}", { list: undefined }),
    {
      description:
        "Retorna todos os campos de uma trilha pelo id numérico. Use dio://trilhas/1, dio://trilhas/2, etc.",
      mimeType: "application/json",
    },
    async (uri, { id }) => {
      const trilhas = loadTrilhas();
      const parsed = parseInt(String(id), 10);
      const trilha = trilhas.find((t) => t.id === parsed);

      if (!trilha) {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "application/json",
              text: JSON.stringify({ error: `Trilha ${id} não encontrada.` }),
            },
          ],
        };
      }

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(trilha, null, 2),
          },
        ],
      };
    }
  );

  // ------------------------------------------------------------------
  // Promoções ativas
  // ------------------------------------------------------------------
  server.registerResource(
    "trilhas-promocoes",
    "dio://trilhas/promocoes",
    {
      description: "Lista de trilhas que possuem promoção ativa no momento.",
      mimeType: "application/json",
    },
    async (_uri) => {
      const trilhas = loadTrilhas();
      const promocoes = trilhas
        .filter((t) => t.promocao.ativa)
        .map((t) => ({
          id: t.id,
          nome: t.nome,
          tecnologia: t.tecnologia,
          nivel: t.nivel,
          desconto_percent: t.promocao.desconto_percent,
          validade: t.promocao.validade,
        }));

      return {
        contents: [
          {
            uri: "dio://trilhas/promocoes",
            mimeType: "application/json",
            text: JSON.stringify({ total: promocoes.length, promocoes }, null, 2),
          },
        ],
      };
    }
  );

  // ------------------------------------------------------------------
  // Lives ao vivo (todas as trilhas)
  // ------------------------------------------------------------------
  server.registerResource(
    "trilhas-lives",
    "dio://trilhas/lives",
    {
      description: "Calendário de todas as lives ao vivo das trilhas da DIO.",
      mimeType: "application/json",
    },
    async (_uri) => {
      const trilhas = loadTrilhas();
      const lives = trilhas.flatMap((t) =>
        t.lives_ao_vivo.map((l) => ({
          ...l,
          trilha_id: t.id,
          trilha_nome: t.nome,
          tecnologia: t.tecnologia,
        }))
      );
      lives.sort((a, b) => a.data.localeCompare(b.data));

      return {
        contents: [
          {
            uri: "dio://trilhas/lives",
            mimeType: "application/json",
            text: JSON.stringify({ total: lives.length, lives }, null, 2),
          },
        ],
      };
    }
  );
}
