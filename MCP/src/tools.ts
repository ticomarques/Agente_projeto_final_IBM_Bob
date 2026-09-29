import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { join, dirname } from "path";

// ---------------------------------------------------------------------------
// Carrega os dados do JSON de trilhas
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));

const DATA_PATH =
  process.env.DATA_PATH ??
  join(__dirname, "../../dio_explorer/data/trilhas_dio.json");

interface Promocao {
  ativa: boolean;
  desconto_percent: number;
  validade: string | null;
}

interface Live {
  titulo: string;
  data: string;
  horario: string;
}

interface Trilha {
  id: number;
  nome: string;
  tecnologia: string;
  nivel: string;
  modulos: number;
  xp_total: number;
  badges: string[];
  promocao: Promocao;
  vitalicio: boolean;
  lives_ao_vivo: Live[];
}

function loadTrilhas(): Trilha[] {
  try {
    const raw = readFileSync(DATA_PATH, "utf8");
    return (JSON.parse(raw) as { trilhas: Trilha[] }).trilhas;
  } catch (err) {
    console.error("[tools] Erro ao carregar trilhas_dio.json:", err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Registro das ferramentas no servidor MCP
// ---------------------------------------------------------------------------

export function registerTools(server: McpServer): void {
  // ------------------------------------------------------------------
  // 1. list-trilhas — lista todas as trilhas disponíveis
  // ------------------------------------------------------------------
  server.registerTool(
    "list-trilhas",
    {
      description:
        "Lista todas as trilhas de aprendizado disponíveis na plataforma DIO. " +
        "Retorna id, nome, tecnologia, nível, módulos, XP total e se é vitalício.",
      inputSchema: {
        nivel: z
          .enum(["Básico", "Intermediário", "Avançado"])
          .optional()
          .describe("Filtra pelo nível da trilha (opcional)"),
        tecnologia: z
          .string()
          .optional()
          .describe("Filtra por tecnologia/linguagem (parcial, case-insensitive)"),
        somente_com_promocao: z
          .boolean()
          .optional()
          .describe("Se true, retorna apenas trilhas com promoção ativa"),
      },
    },
    async ({ nivel, tecnologia, somente_com_promocao }) => {
      let trilhas = loadTrilhas();

      if (nivel) {
        trilhas = trilhas.filter((t) => t.nivel === nivel);
      }

      if (tecnologia) {
        const q = tecnologia.toLowerCase();
        trilhas = trilhas.filter((t) =>
          t.tecnologia.toLowerCase().includes(q)
        );
      }

      if (somente_com_promocao) {
        trilhas = trilhas.filter((t) => t.promocao.ativa);
      }

      const resultado = trilhas.map((t) => ({
        id: t.id,
        nome: t.nome,
        tecnologia: t.tecnologia,
        nivel: t.nivel,
        modulos: t.modulos,
        xp_total: t.xp_total,
        vitalicio: t.vitalicio,
        promocao_ativa: t.promocao.ativa,
        desconto_percent: t.promocao.desconto_percent,
      }));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { total: resultado.length, trilhas: resultado },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // ------------------------------------------------------------------
  // 2. get-trilha — detalhes completos de uma trilha pelo id
  // ------------------------------------------------------------------
  server.registerTool(
    "get-trilha",
    {
      description:
        "Retorna todos os detalhes de uma trilha específica, incluindo badges, " +
        "informações de promoção e cronograma de lives ao vivo.",
      inputSchema: {
        id: z.number().int().positive().describe("ID numérico da trilha"),
      },
    },
    async ({ id }) => {
      const trilhas = loadTrilhas();
      const trilha = trilhas.find((t) => t.id === id);

      if (!trilha) {
        return {
          content: [
            {
              type: "text",
              text: `Trilha com id ${id} não encontrada.`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(trilha, null, 2),
          },
        ],
      };
    }
  );

  // ------------------------------------------------------------------
  // 3. search-trilhas — busca por termo livre no nome ou tecnologia
  // ------------------------------------------------------------------
  server.registerTool(
    "search-trilhas",
    {
      description:
        "Busca trilhas por termo livre no nome ou tecnologia. " +
        "Útil para encontrar trilhas sobre um assunto específico.",
      inputSchema: {
        query: z
          .string()
          .min(2)
          .describe("Termo de busca (mínimo 2 caracteres)"),
      },
    },
    async ({ query }) => {
      const trilhas = loadTrilhas();
      const q = query.toLowerCase();

      const resultados = trilhas.filter(
        (t) =>
          t.nome.toLowerCase().includes(q) ||
          t.tecnologia.toLowerCase().includes(q) ||
          t.badges.some((b) => b.toLowerCase().includes(q))
      );

      if (resultados.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `Nenhuma trilha encontrada para: "${query}"`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                query,
                total: resultados.length,
                trilhas: resultados.map((t) => ({
                  id: t.id,
                  nome: t.nome,
                  tecnologia: t.tecnologia,
                  nivel: t.nivel,
                  xp_total: t.xp_total,
                  badges: t.badges,
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // ------------------------------------------------------------------
  // 4. list-promocoes — todas as promoções ativas
  // ------------------------------------------------------------------
  server.registerTool(
    "list-promocoes",
    {
      description:
        "Lista todas as trilhas que possuem promoção ativa atualmente, " +
        "com o percentual de desconto e data de validade.",
      inputSchema: {},
    },
    async () => {
      const trilhas = loadTrilhas();
      const comPromocao = trilhas
        .filter((t) => t.promocao.ativa)
        .map((t) => ({
          id: t.id,
          nome: t.nome,
          tecnologia: t.tecnologia,
          nivel: t.nivel,
          desconto_percent: t.promocao.desconto_percent,
          validade: t.promocao.validade,
          xp_total: t.xp_total,
        }))
        .sort((a, b) => b.desconto_percent - a.desconto_percent);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { total_em_promocao: comPromocao.length, promocoes: comPromocao },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // ------------------------------------------------------------------
  // 5. list-lives — próximas lives ao vivo
  // ------------------------------------------------------------------
  server.registerTool(
    "list-lives",
    {
      description:
        "Lista as próximas lives ao vivo agendadas nas trilhas da DIO. " +
        "Pode ser filtrado por data de início.",
      inputSchema: {
        a_partir_de: z
          .string()
          .optional()
          .describe(
            "Data mínima no formato YYYY-MM-DD. Se omitida, retorna todas as lives."
          ),
      },
    },
    async ({ a_partir_de }) => {
      const trilhas = loadTrilhas();

      interface LiveComTrilha extends Live {
        trilha_id: number;
        trilha_nome: string;
        tecnologia: string;
      }

      const todasLives: LiveComTrilha[] = trilhas.flatMap((t) =>
        t.lives_ao_vivo.map((l) => ({
          ...l,
          trilha_id: t.id,
          trilha_nome: t.nome,
          tecnologia: t.tecnologia,
        }))
      );

      const filtradas = a_partir_de
        ? todasLives.filter((l) => l.data >= a_partir_de)
        : todasLives;

      filtradas.sort((a, b) => a.data.localeCompare(b.data));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { total: filtradas.length, lives: filtradas },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // ------------------------------------------------------------------
  // 6. get-resumo-plataforma — métricas gerais
  // ------------------------------------------------------------------
  server.registerTool(
    "get-resumo-plataforma",
    {
      description:
        "Retorna um resumo estatístico da plataforma: total de trilhas, " +
        "distribuição por nível, XP médio, total de lives agendadas e " +
        "quantidade de trilhas com promoção ativa.",
      inputSchema: {},
    },
    async () => {
      const trilhas = loadTrilhas();

      const total = trilhas.length;
      const porNivel = trilhas.reduce<Record<string, number>>((acc, t) => {
        acc[t.nivel] = (acc[t.nivel] ?? 0) + 1;
        return acc;
      }, {});

      const xpMedio =
        total > 0
          ? Math.round(
              trilhas.reduce((acc, t) => acc + t.xp_total, 0) / total
            )
          : 0;

      const comPromocao = trilhas.filter((t) => t.promocao.ativa).length;
      const totalLives = trilhas.reduce(
        (acc, t) => acc + t.lives_ao_vivo.length,
        0
      );
      const vitalicio = trilhas.filter((t) => t.vitalicio).length;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                total_trilhas: total,
                distribuicao_por_nivel: porNivel,
                xp_medio: xpMedio,
                trilhas_com_promocao: comPromocao,
                total_lives_agendadas: totalLives,
                trilhas_vitalicio: vitalicio,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );
}
