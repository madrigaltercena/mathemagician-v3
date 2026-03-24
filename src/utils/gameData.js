// Game data: kingdoms, levels, magic items, avatars

export const AVATARS = ['🧙', '🧝', '🧛', '🧚', '🦸', '🦹', '🧜', '🧞', '🧟', '🐉'];

export const KINGDOMS = [
  {
    id: 1,
    name: 'Reino dos Números Mágicos',
    emoji: '🏰',
    description: 'O reino onde tudo começa!',
    operations: ['addition'],
    levels: [1, 2, 3, 4],
  },
  {
    id: 2,
    name: 'Floresta dos Cálculos',
    emoji: '🌲',
    description: 'Desafia a floresta encantada!',
    operations: ['addition', 'subtraction'],
    levels: [1, 2, 3, 4],
  },
  {
    id: 3,
    name: 'Montanha das Operações',
    emoji: '⛰️',
    description: 'Conquista as altas montanhas!',
    operations: ['addition', 'subtraction', 'multiplication'],
    levels: [1, 2, 3, 4],
  },
  {
    id: 4,
    name: 'Castelo das Divisões',
    emoji: '🏯',
    description: 'O desafio final espera por ti!',
    operations: ['addition', 'subtraction', 'multiplication', 'division'],
    levels: [1, 2, 3, 4],
  },
];

export const MAGIC_ITEMS = [
  { id: 1, name: 'Varinha Mágica', emoji: '🪄', level: 2 },
  { id: 2, name: 'Poção de Sabedoria', emoji: '🧪', level: 4 },
  { id: 3, name: 'Escudo Encantado', emoji: '🛡️', level: 6 },
  { id: 4, name: 'Elmo do Guerreiro', emoji: '⛑️', level: 8 },
  { id: 5, name: 'Espada Lendária', emoji: '⚔️', level: 10 },
  { id: 6, name: 'Amuleto Secreto', emoji: '🔮', level: 12 },
  { id: 7, name: 'Coroa do Mago', emoji: '👑', level: 14 },
  { id: 8, name: 'Orbe Supremo', emoji: '🔮', level: 16 },
];

// Difficulty rules per kingdom/level
// Returns { min, max } for operands and operation types
export function getDifficulty(kingdomId, level) {
  const globalLevel = (kingdomId - 1) * 4 + level;
  switch (globalLevel) {
    case 1: return { a: [1, 5], b: [1, 5], ops: ['+'] };
    case 2: return { a: [1, 10], b: [1, 10], ops: ['+'] };
    case 3: return { a: [1, 10], b: [1, 10], ops: ['+', '-'] };
    case 4: return { a: [1, 15], b: [1, 10], ops: ['+', '-'] };
    case 5: return { a: [1, 10], b: [1, 5], ops: ['+', '-', '×'] };
    case 6: return { a: [1, 10], b: [1, 9], ops: ['+', '-', '×'] };
    case 7: return { a: [1, 20], b: [1, 9], ops: ['+', '-', '×'] };
    case 8: return { a: [1, 50], b: [1, 9], ops: ['+', '-', '×'] };
    case 9: return { a: [2, 10], b: [1, 9], ops: ['+', '-', '×', '÷'] };
    case 10: return { a: [1, 20], b: [1, 9], ops: ['+', '-', '×', '÷'] };
    case 11: return { a: [2, 12], b: [1, 12], ops: ['+', '-', '×', '÷'] };
    case 12: return { a: [1, 50], b: [1, 10], ops: ['+', '-', '×', '÷'] };
    case 13: return { a: [2, 15], b: [1, 10], ops: ['+', '-', '×', '÷'] };
    case 14: return { a: [1, 100], b: [1, 12], ops: ['+', '-', '×', '÷'] };
    case 15: return { a: [2, 20], b: [1, 12], ops: ['+', '-', '×', '÷'] };
    case 16: return { a: [1, 100], b: [1, 12], ops: ['+', '-', '×', '÷'] };
    default: return { a: [1, 10], b: [1, 5], ops: ['+'] };
  }
}

export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
