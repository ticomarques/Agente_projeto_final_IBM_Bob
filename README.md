# DIO Explorer — MCP Server

Servidor MCP (Model Context Protocol) que expõe trilhas de aprendizado, promoções e lives da plataforma **DIO (Digital Innovation One)** para agentes de IA como o **IBM Bob**.

---

## Visão Geral

O **DIO Explorer** é composto por:

| Componente | Localização | Descrição |
|---|---|---|
| MCP Server | `MCP/` | Servidor TypeScript que implementa o protocolo MCP |
| Dados das trilhas | `dio_explorer/data/trilhas_dio.json` | Catálogo com 10+ trilhas da plataforma DIO |
| Comandos Bob | `.bob/commands/` | Atalhos de linguagem natural para o IBM Bob |

---

## Estrutura do Projeto

```
.
├── MCP/                          # Servidor MCP (Node.js / TypeScript)
│   ├── src/
│   │   ├── index.ts              # Ponto de entrada — HTTP e STDIO
│   │   ├── tools.ts              # Ferramentas MCP (6 tools)
│   │   ├── resources.ts          # Resources MCP (4 resources)
│   │   └── auth.ts               # Middleware de autenticação
│   ├── package.json
│   └── tsconfig.json
│
├── dio_explorer/
│   └── data/
│       └── trilhas_dio.json      # Base de dados das trilhas DIO
│
├── .bob/
│   └── commands/
│       ├── certificado.md        # Comando /certificado
│       ├── desafio.md            # Comando /desafio
│       └── trilha.md             # Comando /trilha
│
└── .bobignore                    # Arquivos ignorados pelo Bob
```

---

## Servidor MCP (`MCP/`)

### Modos de Execução

O servidor suporta dois transportes:

| Modo | Comando | Uso |
|---|---|---|
| **HTTP** (padrão) | `node build/index.js` | Uso remoto, API, integração SSO |
| **STDIO** | `MCP_TRANSPORT=stdio node build/index.js` | Uso local com Bob / clientes MCP padrão |

### Variáveis de Ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `MCP_PORT` | `3000` | Porta do servidor HTTP |
| `MCP_HOST` | `0.0.0.0` | Host do servidor HTTP |
| `MCP_TRANSPORT` | `http` | Transporte: `http` ou `stdio` |
| `MCP_AUTH_MODE` | `both` | Modo de autenticação: `apikey`, `bearer`, `both`, ou `none` |
| `MCP_API_KEYS` | — | Chaves de API válidas, separadas por vírgula |
| `MCP_SSO_ISSUER` | — | URL do emissor SSO para validação de tokens Bearer |
| `DATA_PATH` | *(caminho relativo ao build)* | Caminho customizado para `trilhas_dio.json` |

### Scripts

```bash
# Instalar dependências
cd MCP && npm install

# Desenvolvimento (com tsx, sem build)
npm run dev

# Build TypeScript
npm run build

# Produção
npm start
```

### Endpoints HTTP

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `GET` | `/` | Não | Informações de uso da API |
| `GET` | `/health` | Não | Healthcheck do servidor |
| `POST` | `/mcp` | Sim | Endpoint do protocolo MCP |

---

## Ferramentas MCP (Tools)

Registradas em [`MCP/src/tools.ts`](MCP/src/tools.ts):

### `list-trilhas`
Lista todas as trilhas disponíveis com suporte a filtros.

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `nivel` | `enum` | Não | `"Básico"`, `"Intermediário"` ou `"Avançado"` |
| `tecnologia` | `string` | Não | Filtra por tecnologia (case-insensitive, parcial) |
| `somente_com_promocao` | `boolean` | Não | Se `true`, retorna apenas trilhas com promoção ativa |

### `get-trilha`
Retorna todos os detalhes de uma trilha pelo ID, incluindo badges, promoção e lives.

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `number` | Sim | ID numérico da trilha |

### `search-trilhas`
Busca trilhas por termo livre no nome, tecnologia ou badges.

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `query` | `string` | Sim | Termo de busca (mínimo 2 caracteres) |

### `list-promocoes`
Lista todas as trilhas com promoção ativa, ordenadas por maior desconto.

*(Sem parâmetros)*

### `list-lives`
Lista as próximas lives ao vivo de todas as trilhas, com suporte a filtro por data.

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `a_partir_de` | `string` | Não | Data mínima no formato `YYYY-MM-DD` |

### `get-resumo-plataforma`
Retorna métricas gerais: total de trilhas, distribuição por nível, XP médio, total de lives e trilhas com promoção ativa.

*(Sem parâmetros)*

---

## Resources MCP

Registrados em [`MCP/src/resources.ts`](MCP/src/resources.ts):

| URI | Nome | Descrição |
|---|---|---|
| `dio://trilhas` | `trilhas-catalogo` | Catálogo completo de trilhas (JSON) |
| `dio://trilhas/{id}` | `trilha-por-id` | Detalhes de uma trilha específica |
| `dio://trilhas/promocoes` | `trilhas-promocoes` | Trilhas com promoção ativa |
| `dio://trilhas/lives` | `trilhas-lives` | Calendário de todas as lives |

---

## Autenticação

Implementada em [`MCP/src/auth.ts`](MCP/src/auth.ts). O middleware aplica-se apenas ao endpoint `POST /mcp`.

### Métodos suportados

**API Key** — envie o cabeçalho:
```
X-API-Key: sua-chave-aqui
```

**Bearer Token (SSO)** — envie o cabeçalho:
```
Authorization: Bearer <jwt-token>
```
> O token é validado quanto à expiração e ao emissor (`iss`). Para produção, integre a verificação via JWKS usando `jose` ou `jsonwebtoken`.

### Configuração de segurança
```bash
# Ativar apenas API Key
MCP_AUTH_MODE=apikey MCP_API_KEYS=chave1,chave2 npm start

# Ativar apenas Bearer SSO
MCP_AUTH_MODE=bearer MCP_SSO_ISSUER=https://accounts.google.com npm start

# Desativar autenticação (somente desenvolvimento)
MCP_AUTH_MODE=none npm start
```

---

## Base de Dados (`dio_explorer/data/trilhas_dio.json`)

Catálogo com **10 trilhas** cobrindo as principais tecnologias:

| ID | Nome da Trilha | Tecnologia | Nível |
|---|---|---|---|
| 1 | Fullstack Java & Spring Boot | Java | Intermediário |
| 2 | Python para Data Science | Python | Básico |
| 3 | Desenvolvedor React Frontend | React | Intermediário |
| 4 | Cloud AWS Foundations | AWS | Básico |
| 5 | DevOps & CI/CD com Docker | Docker/K8s | Avançado |
| 6 | Mobile com Flutter | Flutter | Intermediário |
| 7 | Engenharia de Dados com SQL | SQL/BigQuery | Avançado |
| 8 | Segurança e Ethical Hacking | Cybersecurity | Avançado |
| 9 | IA e Machine Learning | Python/AI | Avançado |
| 10 | Go Backend Developer | Go | Intermediário |

### Estrutura de cada trilha

```json
{
  "id": 1,
  "nome": "Fullstack Java & Spring Boot",
  "tecnologia": "Java",
  "nivel": "Básico | Intermediário | Avançado",
  "modulos": 12,
  "xp_total": 18500,
  "badges": ["Java Developer", "Spring Boot Expert"],
  "promocao": {
    "ativa": true,
    "desconto_percent": 30,
    "validade": "2025-08-31"
  },
  "vitalicio": true,
  "lives_ao_vivo": [
    { "titulo": "Spring Boot na Prática", "data": "2025-07-10", "horario": "19:00" }
  ]
}
```

---

## Comandos Bob (`.bob/commands/`)

Comandos de linguagem natural para uso dentro do **IBM Bob**:

### `/trilha <tecnologia>`
Exibe o plano de estudos completo da trilha com módulos gerados, badges, lives e informações de promoção.

**Exemplo:** `/trilha Python`

### `/certificado <seu-nome> <nome-da-trilha>`
Gera um certificado fictício de conclusão de trilha em Markdown, com código de certificado único, data de emissão e badges conquistadas.

**Exemplo:** `/certificado João Silva Python para Data Science`

### `/desafio <tecnologia> <nivel>`
Cria um desafio de código original e contextualizado, com enunciado, exemplos, restrições, dicas e critérios de avaliação. Após a resolução, o Bob oferece code review.

**Exemplo:** `/desafio Java Intermediário`

---

## Integração com IBM Bob

Para usar o servidor como MCP no Bob, adicione ao arquivo de configuração MCP:

```json
{
  "mcpServers": {
    "dio-explorer": {
      "transport": "http",
      "url": "http://localhost:3000/mcp",
      "headers": {
        "X-API-Key": "sua-chave-aqui"
      }
    }
  }
}
```

Para uso local via STDIO:

```json
{
  "mcpServers": {
    "dio-explorer": {
      "command": "node",
      "args": ["/caminho/para/MCP/build/index.js"],
      "env": {
        "MCP_TRANSPORT": "stdio",
        "DATA_PATH": "/caminho/para/dio_explorer/data/trilhas_dio.json"
      }
    }
  }
}
```

---

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js (ESM) |
| Linguagem | TypeScript 5 |
| Framework HTTP | Express 4 |
| Protocolo IA | `@modelcontextprotocol/server` |
| Validação de Schema | Zod 3 |
| Build | `tsc` (TypeScript Compiler) |
| Dev runner | `tsx` |
