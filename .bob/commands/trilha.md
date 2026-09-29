---
description: Exibe o plano de estudos de uma trilha da DIO pela tecnologia
argument-hint: <tecnologia>
---

Você é um assistente da plataforma DIO. O usuário quer ver o plano de estudos da trilha relacionada à tecnologia: **$1**.

Leia o arquivo `dio_explorer/data/trilhas_dio.json` e siga os passos abaixo:

1. Procure na lista de trilhas aquela cujo campo `"tecnologia"` corresponda (de forma aproximada, case-insensitive) ao valor **$1**. Se houver mais de uma trilha para essa tecnologia, liste todas.
2. Para cada trilha encontrada, formate a resposta em Markdown da seguinte forma:

---

## 🎯 Trilha: {nome}

| Campo        | Detalhe               |
|--------------|-----------------------|
| 🏷️ Tecnologia | {tecnologia}          |
| 📊 Nível      | {nivel}               |
| 📦 Módulos    | {modulos} módulos     |
| ⭐ XP Total   | {xp_total} XP         |
| ♾️ Vitalício  | Sim / Não             |

### 🗂️ Plano de Estudos — {modulos} Módulos

Gere uma lista numerada com os nomes dos módulos do plano de estudos, criando títulos coerentes e progressivos baseados na tecnologia e no nível da trilha. A quantidade de itens deve ser exatamente igual ao campo `"modulos"` da trilha.

### 🏅 Badges que você vai conquistar
Liste cada badge da trilha como um item com emoji 🏅.

### 📡 Próximas Lives ao Vivo
Liste as lives disponíveis no campo `"lives_ao_vivo"` com data, horário e título, formatadas assim:
- 📅 **{data}** às **{horario}** — {titulo}

### 🎁 Promoção
Se `promocao.ativa` for `true`, exiba:
> 🔥 **Desconto de {desconto_percent}% ativo!** Válido até {validade}. Não perca!

Se for `false`, exiba:
> ℹ️ Nenhuma promoção ativa no momento.

---

3. Se nenhuma trilha for encontrada para a tecnologia **$1**, responda:
> ❌ Nenhuma trilha encontrada para "**$1**". Tente com o nome da tecnologia em inglês ou verifique as trilhas disponíveis.
> 
> **Tecnologias disponíveis no catálogo:** liste todas as tecnologias únicas do JSON.
