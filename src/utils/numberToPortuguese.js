// Convert numbers to Portuguese text (1 to 1000)

const units = [
  '', 'um', 'dois', 'três', 'quatro', 'cinco',
  'seis', 'sete', 'oito', 'nove', 'dez',
  'onze', 'doze', 'treze', 'catorze', 'quinze',
  'dezasseis', 'dezassete', 'dezoito', 'dezanove'
];

const tens = [
  '', '', 'vinte', 'trinta', 'quarenta', 'cinquenta',
  'sessenta', 'setenta', 'oitenta', 'noventa'
];

const hundreds = [
  '', 'cem', 'duzentos', 'trezentos', 'quatrocentos',
  'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'
];

export function numberToPortuguese(n) {
  if (n < 0 || n > 1000) return String(n);
  if (n === 0) return 'zero';
  if (n === 1000) return 'mil';

  if (n < 20) return units[n];

  if (n < 100) {
    const t = Math.floor(n / 10);
    const u = n % 10;
    return u === 0 ? tens[t] : `${tens[t]} e ${units[u]}`;
  }

  if (n < 1000) {
    const h = Math.floor(n / 100);
    const r = n % 100;
    const hundredText = h === 1 ? 'cento' : hundreds[h];
    if (r === 0) return hundredText;
    return `${hundredText} e ${numberToPortuguese(r)}`;
  }

  return String(n);
}
