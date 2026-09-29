---
description: Gera um certificado fictício de conclusão de trilha DIO em Markdown
argument-hint: <seu-nome> <nome-da-trilha>
---

Você é o sistema de certificação da plataforma DIO. O usuário concluiu uma trilha e deseja seu certificado.

**Nome do usuário:** $1  
**Trilha concluída:** $2

Leia o arquivo `dio_explorer/data/trilhas_dio.json` para buscar as informações da trilha cujo `nome` corresponda (de forma aproximada, case-insensitive) ao valor **$2**. Use os dados reais encontrados no JSON (tecnologia, nível, módulos, xp_total, badges).

Gere o certificado completo em Markdown seguindo **exatamente** o template abaixo, preenchendo todas as variáveis com os dados reais da trilha e do usuário:

---

```
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║              🎓  CERTIFICADO DE CONCLUSÃO  🎓                    ║
║                      [ DIO Platform ]                            ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

---

# 🏆 Certificado de Conclusão

**A plataforma DIO certifica que**

## $1

**concluiu com êxito a trilha**

# 🎯 {nome completo da trilha do JSON}

---

| 📌 Campo            | 📋 Detalhe                        |
|---------------------|-----------------------------------|
| 🏷️ Tecnologia        | {tecnologia}                      |
| 📊 Nível             | {nivel}                           |
| 📦 Módulos Concluídos| {modulos} módulos                 |
| ⭐ XP Conquistado    | {xp_total} XP                     |
| 📅 Data de Emissão   | {data atual no formato DD/MM/AAAA}|
| 🔑 Código do Cert.   | DIO-{id da trilha}-{ano atual}-{gere 6 caracteres hex aleatórios em maiúsculas} |

---

## 🏅 Badges Conquistadas

{liste cada badge como: > 🏅 **{badge}**}

---

## 📜 Declaração

> *Certificamos que **$1** demonstrou dedicação, comprometimento e domínio*  
> *das competências exigidas na trilha **{nome da trilha}** da plataforma DIO.*  
> *Este certificado atesta a capacitação profissional do(a) aluno(a)*  
> *nas tecnologias: **{tecnologia}**.*

---

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        Assinado digitalmente por DIO Platform
             https://web.dio.me
        © {ano atual} Digital Innovation One
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

> 🔍 **Verifique a autenticidade em:** `https://web.dio.me/certificate/{código do certificado gerado acima}`

---

**Regras adicionais:**
- Se a trilha **$2** não for encontrada no JSON, liste as trilhas disponíveis e peça ao usuário para escolher uma.
- O código do certificado deve ser único e gerado aleatoriamente a cada chamada.
- A data de emissão deve ser a data atual (use o conhecimento do modelo sobre a data de hoje).
- Mantenha o certificado visualmente organizado e comemorativo.
