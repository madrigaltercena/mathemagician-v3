import { randInt, getDifficulty } from './gameData';

export function generateQuestion(kingdomId, level) {
  const diff = getDifficulty(kingdomId, level);
  const opSymbol = diff.ops[randInt(0, diff.ops.length - 1)];

  let a, b, answer;

  switch (opSymbol) {
    case '+':
      a = randInt(diff.a[0], diff.a[1]);
      b = randInt(diff.b[0], diff.b[1]);
      answer = a + b;
      break;
    case '-':
      a = randInt(diff.a[0], diff.a[1]);
      b = randInt(diff.b[0], Math.min(diff.b[1], a));
      answer = a - b;
      break;
    case '×':
      a = randInt(Math.max(2, diff.a[0]), Math.min(9, diff.a[1]));
      b = randInt(Math.max(2, diff.b[0]), Math.min(9, diff.b[1]));
      answer = a * b;
      break;
    case '÷':
      b = randInt(Math.max(2, diff.b[0]), Math.min(9, diff.b[1]));
      answer = randInt(1, 10);
      a = b * answer;
      break;
    default:
      a = randInt(1, 5);
      b = randInt(1, 5);
      answer = a + b;
  }

  return { a, b, op: opSymbol, answer, text: `${a} ${opSymbol} ${b} = ?` };
}

export function generateFreeQuestion(operations) {
  const opSymbol = operations[randInt(0, operations.length - 1)];
  let a, b, answer;

  switch (opSymbol) {
    case '+':
      a = randInt(1, 50);
      b = randInt(1, 50);
      answer = a + b;
      break;
    case '-':
      a = randInt(5, 100);
      b = randInt(1, a);
      answer = a - b;
      break;
    case '×':
      a = randInt(2, 9);
      b = randInt(2, 9);
      answer = a * b;
      break;
    case '÷':
      b = randInt(2, 9);
      answer = randInt(1, 10);
      a = b * answer;
      break;
    default:
      a = randInt(1, 20);
      b = randInt(1, 20);
      answer = a + b;
  }

  return { a, b, op: opSymbol, answer, text: `${a} ${opSymbol} ${b} = ?` };
}

export function generateTouchculatorQuestion(operation) {
  let a, b, answer;

  switch (operation) {
    case 'addition':
      a = randInt(1, 12);
      b = randInt(1, 9);
      answer = a + b;
      break;
    case 'subtraction':
      a = randInt(6, 18);
      b = randInt(1, Math.min(9, a - 1));
      answer = a - b;
      break;
    case 'multiplication':
      a = randInt(2, 5);
      b = randInt(2, 5);
      answer = a * b;
      break;
    case 'division':
      b = randInt(2, 5);
      answer = randInt(2, 9);        // divisor × quociente = dividendo (todo ≤ 45)
      a = b * answer;                 // garantido: a = b × answer, nunca quebra
      break;
    default:
      a = randInt(1, 10);
      b = randInt(1, 10);
      answer = a + b;
  }

  return { a, b, answer, operation };
}

export function getOperationSymbol(op) {
  switch (op) {
    case 'addition': return '+';
    case 'subtraction': return '-';
    case 'multiplication': return '×';
    case 'division': return '÷';
    default: return op;
  }
}

export function getOperationLabel(op) {
  switch (op) {
    case 'addition': return 'Adição';
    case 'subtraction': return 'Subtração';
    case 'multiplication': return 'Multiplicação';
    case 'division': return 'Divisão';
    default: return op;
  }
}
