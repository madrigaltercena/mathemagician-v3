# SPEC.md — Mathemagician v3
**Versão:** 1.0
**Data:** 2026-03-25
**Autor:** Ricardo Alexandre / Macacoder

---

## Índice

1. [Navegação e Estrutura de Páginas](#1-navegação-e-estrutura-de-páginas)
2. [Criação de Personagem (`/`)](#2-criação-de-personagem-)
3. [Menu Inicial (`/menu`)](#3-menu-inicial-menu)
4. [Touchculator (`/modos/touchculator`)](#4-touchculator-modos-touchculator)
5. [Aprender a Contar (`/modos/aprender-a-contar`)](#5-aprender-a-contar-modos-aprender-a-contar)
6. [Modo História — Landing (`/modos/historia`)](#6-modo-história--landing-modos-historia)
7. [Modo História — Jogo (`/modos/historia/:kingdomId`)](#7-modo-história--jogo-modos-historia-kingdomid)
8. [Modo Livre (`/modos/livre`)](#8-modo-livre-modos-livre)
9. [Estado Global (GameContext)](#9-estado-global-gamecontext)
10. [Questão (Question Generator)](#10-questão-question-generator)

---

## 1. Navegação e Estrutura de Páginas

### Rotas

| Rota | Componente | Descrição |
|------|-----------|-----------|
| `/` | `PlayerCreation` | Landing / criação de personagem |
| `/menu` | `StartMenu` | Menu principal com 4 modos |
| `/modos/aprender-a-contar` | `LearnToCount` | Contagem livre com tap |
| `/modos/touchculator` | `Touchculator` | Operações visuais com círculos |
| `/modos/historia` | `StoryModeLanding` | Seleção de reino |
| `/modos/historia/:kingdomId` | `StoryModeGame` | Jogo de um reino |
| `/modos/livre` | `FreeMode` | 10 perguntas à escolha |
| `*` | redirect `/` | Fallback |

### Componentes Partilhados

- **`BackButton`**: Navega para trás consoante o contexto
- **`Modal`**: Popup reutilizável com `open`, `onClose`, `title`, `size` (normal|large)
- **`NumericKeypad`**: Teclado numérico virtual com botões 0-9, backspace e submit

---

## 2. Criação de Personagem (`/`)

### Comportamento

Se o jogador já tem nome e avatar no `GameContext`, salta diretamente para `/menu`.

### Fluxo

1. Utilizador seleciona avatar com botões ❮ ❯ (carousel circular sobre `AVATARS`)
2. Utilizador escreve nome no input (máx. 20 caracteres, Trim, Enter submete)
3. Botão "Começar a aventura! 🚀" fica ativo só quando nome não está vazio
4. Ao submeter: `updatePlayer({ name, avatar, title: 'Aprendiz' })` → navega para `/menu`

### Validação

- Nome vazio ou só espaços → botão desabilitado
- Máximo 20 caracteres

---

## 3. Menu Inicial (`/menu`)

### Comportamento

Mostra o avatar, nome e título do jogador no topo. Apresenta 4 cards de modo:

| Card | Rota | Emoji | Cor |
|------|------|-------|-----|
| Aprender a Contar | `/modos/aprender-a-contar` | 🔢 | `#4facfe` |
| Touchculator | `/modos/touchculator` | 🧮 | `#f093fb` |
| Modo História | `/modos/historia` | 🏰 | `#ffd700` |
| Modo Livre | `/modos/livre` | 🎯 | `#7bed9f` |

### Interação

- Click num card → navega para a rota correspondente

---

## 4. Touchculator (`/modos/touchculator`)

### Visão Geral

Sistema de perguntas visuais com **círculos** que o jogador manipula por toques. Cada operação tem um fluxo visual diferente. O jogador nunca escreve numericamente — tudo é feito com taps no ecrã.

### Landing Screen

4 botões de operação: **Adição (+), Subtração (−), Multiplicação (×), Divisão (÷)**

### Geração de Perguntas (`generateTouchculatorQuestion`)

| Operação | `a` | `b` | `answer` | Notas |
|----------|-----|-----|---------|-------|
| Adição | randInt(1,9) | randInt(1,9) | a+b | Padrão |
| Subtração | randInt(2,9) | randInt(1,a-1) | a-b | b < a, resultado ≥1 |
| Multiplicação | randInt(2,5) | randInt(2,5) | a×b | Max 25 |
| Divisão | b×answer | randInt(2,5) | randInt(2,6) | answer ≤6 para não overflow |

---

### 4.1 Adição (+)

**Objetivo:** O jogador aprende a somaraddando círculos um a um.

**Ecrã inicial:**
- `a` círculos visíveis
- Counter: `0/b`
- Hint: "Toque em qualquer zona para avançar"

**Tap 1:** 1 círculo desaparece (fade-out). Counter: `1/b`
**Tap 2:** 1 círculo desaparece. Counter: `2/b`
**...**
**Tap b:** Último círculo desaparece. Counter: `b/b`. `✓` aparece.
**Tap submit:** Modal com `"a + b = resposta"` + botões "Repetir" e "Voltar"

**Nota:** O número de taps = `b` (segundo operando). Se b=3, o jogador precisa de 3 taps.

---

### 4.2 Subtração (−)

**Objetivo:** O jogador aprende a subtrair removendo círculos.

**Ecrã inicial:**
- `a` círculos visíveis
- Counter: `0/(a−answer)` — número de Remoções necessárias
- Hint: "Toque em qualquer zona para avançar"

**Cada tap:** Remove 1 círculo (fade-out da esquerda para a direita). Counter incrementa.
**Último tap:** `✓` aparece.
**Tap submit:** Modal.

**Nota:** Número de taps = `a − answer`.

---

### 4.3 Multiplicação (×)

**Objetivo:** O jogador visualiza a multiplicação como grupos repetidos de círculos.

**Modelo:** Grid de `b` rows × `a` colunas. Cada tap adiciona uma row de `a` círculos.

**Ecrã inicial (`step=1`):**
- 1 row de `a` círculos visível (sem outline)
- Counter: `1/b`
- Hint: "Adiciona um grupo"

**Tap 1 (`step=2`):** Adiciona 2ª row de `a` círculos (sem outline). Counter: `2/b`
**Tap 2 (`step=3`):** Adiciona 3ª row. Counter: `3/b`
**...**
**Tap b−1 (`step=b`):** Adiciona última row. TODAS as rows ganham outline tracejado dourado. `?` transforma-se no `answer`. Counter: `b/b`. Hint: "Confirma o resultado"
**Tap b (confirm):** Modal abre.

**Exemplo 4×4 (b=4, a=4):**
- `startGame`: 1 row de 4 círculos, counter `1/4`
- Tap 1: 2 rows, counter `2/4`
- Tap 2: 3 rows, counter `3/4`
- Tap 3: 4 rows + outlines + `?` → `16`, counter `4/4`, hint "Confirma o resultado"
- Tap 4: Modal

**Constraint:** `a` máximo 5 e `b` máximo 5 → máximo 25 círculos = 5 rows × 5 colunas, cabe no ecrã.

---

### 4.4 Divisão (÷)

**Objetivo:** O jogador visualiza a divisão como grupos organizados em colunas.

**Modelo:** `b` colunas, cada coluna com `answer` círculos ( altura = `answer` ). Total = `a = b × answer`.

**Ecrã inicial (`step=0`):**
- `b` colunas de `answer` círculos cada (total `a`), todas visíveis
- Counter: `0/2`
- Hint: "Confirma as colunas"

**Tap 1 (`step=1`):**
- Todas as colunas recebem outline tracejado dourado
- `?` transforma-se no `answer`
- Counter: `1/2`, Hint: "Submeter resultado"

**Tap 2 (`step=2`):** Modal abre diretamente. Sem botão intermédio.

**Exemplo 21÷3 (b=3, answer=7):**
- `startGame`: 3 colunas de 7 círculos cada = 21 círculos, counter `0/2`
- Tap 1: 3 outlines + `?` → `7`, counter `1/2`
- Tap 2: Modal `"21 ÷ 3 = 7"`

**Constraint:** `answer` máximo 6 para não overflow vertical. `b` máximo 5.

---

### Elementos Comuns do Touchculator

| Elemento | Descrição |
|----------|-----------|
| **Counter** | `"currentStep/targetSteps"` — mostra progresso |
| **Hint** | Texto abaixo do counter com instrução contextual |
| **`✓`** | Aparece quando `readyToSubmit=true` na zona de submit |
| **BackButton** | Reseta tudo e volta ao landing do Touchculator |
| **Modal** | `"🎉 Parabéns! 🎉"` com resultado, "Repetir 🔄" e "Voltar 📚" |

---

## 5. Aprender a Contar (`/modos/aprender-a-contar`)

### Landing

- Input mostra número vazio com placeholder "1 - 1000"
- `NumericKeypad` para inserir o número máximo
- Botão "Começar!" ativo quando `parsedMax >= 1 && parsedMax <= 1000`
- BackButton → `/menu`

### Jogo

- Ecrã com zona de tap
- Número grande no centro: `count` (inicia em 1)
- Texto português por baixo: `numberToPortuguese(count)`
- Hint: "Toque em qualquer zona para +1"

**Cada tap:** `count += 1` até atingir `parsedMax`
**Quando `count === parsedMax`:** Modal "🎉 Parabéns! 🎉" diz "Aprendeste a contar até {parsedMax}!"
**Botão "Obter prémio 🎁":** Emoji aleatório aparece como recompensa overlay e navega para `/menu` após 1200ms.

**Emojis de recompensa:** 🌟 ⭐ 🌙 💫 🎁 🎀 🏆 🎯 🔮 🪄

---

## 6. Modo História — Landing (`/modos/historia`)

### Header

- BackButton → `/menu`
- Título: "🏰 Modo História"
- Subtítulo: "Escolhe um reino para explorar!"

### Reinos (`KINGDOMS`)

4 reinos em cards:

| ID | Emoji | Nome | Descrição |
|----|-------|------|-----------|
| 1 | 🐾 | Reino Animal | Faz operações com os animais! |
| 2 | 🌊 | Reino Aquático | Soma e subtrai no oceano! |
| 3 | 🏔️ | Reino da Montanha | Multiplica e divide nas alturas! |
| 4 | ⭐ | Reino Estelar | O desafio final! |

**Estados do card:**
- `locked` (cinzento + 🔒): reino ainda não desbloqueado
- `completed` (sem 🔒 + ✅): reino completado
- Ativo (pode clicar): unlocked e não completado

**Desbloqueio:** O primeiro reino (ID=1) está sempre desbloqueado. Completar reino `k` desbloqueia reino `k+1`.

### Itens Mágicos (`MAGIC_ITEMS`)

Grelha de itens mágicos. Itens bloqueados mostram `❓` e `???`. Itens desbloqueados mostram emoji, nome e contagem.

---

## 7. Modo História — Jogo (`/modos/historia/:kingdomId`)

### Estrutura

- 4 níveis por reino (Nível 1..4)
- 5 perguntas por nível
- Tipos de pergunta por nível:
  - **Nível 1:** Adição only
  - **Nível 2:** Subtração only
  - **Nível 3:** Multiplicação only
  - **Nível 4:** Divisão only

### Progresso

- Barra de progresso: 5 dots (1 por pergunta, preenchido quando respondida)
- Header: `Emoji do Reino` + `Nível X/4`

### Feedback

- Resposta correta: input fica verde com ✅ "Correcto!"; avança automaticamente após 900ms
- Resposta errada: input fica vermelho com ❌ "Tenta novamente!"; limpa após 1400ms, jogador tenta outra vez

### Modal de Nível Completo

Após nível 4, pergunta 5 correta:
- **Tipo `simple`** (nível completo mas não último): "Completaste o nível X!" + item emoji se applicable + "Próximo Nível ➡️"
- **Tipo `big`** (reino completo): "Completaste o reino {nome}!" + item desbloqueado se nova conquista + "Continuar ➡️"

### Progresso Persistente

O `GameContext` guarda `currentKingdom`, `currentLevel`, `currentQuestion`. Se o jogador sair e voltar, retoma onde parou. Replay de reino completa reinicia do nível 1.

### Itens Mágicos

Cada nível completado concede um item mágico (até 16 itens, um por nível global 1-16). Itens são cumulativos.

---

## 8. Modo Livre (`/modos/livre`)

### Landing

- Escolha de operações: `+ − × ÷` (pelo menos 1 deve estar selecionada)
- Botão "Começar! 🚀"

**Seleção de operações:** Toggle — click adiciona ou remove. Não permite des-seleccionar se só restar 1.

**Persistência:** Última seleção guardada em `state.freeMode.lastSelectedOperations`.

### Jogo

- 10 perguntas fixas geradas ao iniciar com as operações escolhidas
- Barra de progresso: `X/10` + barra de preenchimento
- Feedback idêntico ao Modo História (verde/vermelho)
- Contador de corretas guardado

### Fim

Modal "🎉 Terminaste! 🎉":
- Score: `{correctCount}/10`
- Botão "Repetir 🔄" → novo jogo com as mesmas operações
- Botão "Voltar 📚" → volta ao landing do Modo Livre

---

## 9. Estado Global (GameContext)

### Estrutura

```js
{
  player: { name, avatar, title },       // criado em PlayerCreation
  storyMode: {
    unlockedKingdom: Number,             // maior reino desbloqueado (1-4)
    completedKingdoms: [Number],         // reino IDs completados
    currentKingdom: Number,              // reino atual (para resume)
    currentLevel: Number,                // nível atual (1-4)
    currentQuestion: Number,             // pergunta atual (1-5)
    highestLevelUnlocked: Number,        // nível mais alto alguma vez desbloqueado
    unlockedMagicItems: [{ id, count }], // itens mágicos desbloqueados
  },
  freeMode: {
    lastSelectedOperations: [String],   // última seleção de ops do jogador
  }
}
```

### Funções

| Função | Ação |
|--------|------|
| `updatePlayer(data)` | Atualiza nome/avatar/título |
| `updateStoryMode(data)` | Atualiza estado Story Mode |
| `addMagicItem(itemId)` | Adiciona ou incrementa contagem de item |
| `resetFreeMode()` | Limpa lastSelectedOperations |

---

## 10. Questão (Question Generator)

### `generateQuestion(kingdomId, level)`

Gera uma pergunta segundo o reino e nível:

| Reino | Nível | Operação | Parâmetros |
|-------|-------|---------|------------|
| 1 (Animal) | 1 | + | a,b 1-9 |
| 1 (Animal) | 2 | − | a,b 2-9, a>b |
| 2 (Aquático) | 3 | × | a,b 1-5 |
| 2 (Aquático) | 4 | ÷ | a,b,c 2-9, answer=a/b |
| 3 (Montanha) | 1-4 |混合物| varies |
| 4 (Estelar) | 1-4 |mistura| varies |

### `generateTouchculatorQuestion(operation)`

Gera pergunta conforme especificação na secção 4.

### `generateFreeQuestion(operations)`

Gera pergunta aleatória de uma das operações selecionadas. Ranges: a,b 1-9 para adição/subtração, 1-5 para multiplicação/divisão.

### `numberToPortuguese(n)`

Converte número 1-1000 para texto em português (ex: 1 → "um", 21 → "vinte e um").

---

*Documento criado: 2026-03-25*
*Este documento serve de fonte de verdade para todas as decisões de desenvolvimento e code review.*
