import { randomInt, randomUUID } from 'node:crypto';

const choose = items => items[randomInt(items.length)];
const chars = (alphabet, length) => Array.from({ length }, () => choose(alphabet)).join('');
const digits = length => chars('0123456789', length);
const mod11 = (value, weights) => {
  const remainder = [...value].reduce((sum, char, i) => sum + (char.charCodeAt(0) - 48) * weights[i], 0) % 11;
  return remainder < 2 ? '0' : String(11 - remainder);
};
export function cpf(formatted = true) {
  let value;
  do {
    value = digits(9);
    value += mod11(value, [10,9,8,7,6,5,4,3,2]);
    value += mod11(value, [11,10,9,8,7,6,5,4,3,2]);
  } while (/^(.)\1+$/.test(value));
  return formatted ? value.replace(/(.{3})(.{3})(.{3})(.{2})/, '$1.$2.$3-$4') : value;
}
export function cnpj(formatted = true, alpha = false) {
  let value = chars(alpha ? '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ' : '0123456789', 8) + '0001';
  value += mod11(value, [5,4,3,2,9,8,7,6,5,4,3,2]);
  value += mod11(value, [6,5,4,3,2,9,8,7,6,5,4,3,2]);
  return formatted ? value.replace(/(.{2})(.{3})(.{3})(.{4})(.{2})/, '$1.$2.$3/$4-$5') : value;
}
export function password(options = {}) {
  const length = integer(options.length ?? 16, 4, 128, 'Tamanho');
  const groups = [['upper','ABCDEFGHIJKLMNOPQRSTUVWXYZ'], ['lower','abcdefghijklmnopqrstuvwxyz'], ['numbers','0123456789'], ['symbols','!@#$%&*+-=?_']]
    .filter(([key]) => options[key] !== false).map(([, value]) => value);
  if (!groups.length) throw new Error('Selecione pelo menos um tipo de caractere.');
  const result = groups.map(choose);
  while (result.length < length) result.push(choose(groups.join('')));
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result.join('');
}
function integer(value, min, max, label) {
  if (!Number.isSafeInteger(value) || value < min || value > max) throw new Error(`${label} deve ser um inteiro entre ${min} e ${max}.`);
  return value;
}
const nickWords = {
  gamer: [['Shadow','Pixel','Neon','Turbo','Ghost','Cyber'], ['Fox','Ninja','Wolf','Storm','Byte','Quest']],
  fantasia: [['Luna','Astra','Eldor','Lyra','Thorin','Aurora'], ['Vale','Rune','Mist','Oak','Flame','Star']],
  divertido: [['Pudim','Batata','Gato','Pinguim','Caju','Panda'], ['Cosmico','Voador','Ninja','Eletrico','Supremo','Zen']]
};
const cards = {
  visa: '4242 4242 4242 4242',
  mastercard: '5555 5555 5555 4444',
  amex: '3782 822463 10005'
};
export const types = ['senha','cpf','cnpj','cep','cartao','nickname','pessoa','uuid','sorteador','qrcode'];
export function generate(type, options = {}, count = 1) {
  integer(count, 1, 100, 'Quantidade');
  if (!types.includes(type)) throw new Error('Gerador não encontrado.');
  if (!options || typeof options !== 'object' || Array.isArray(options)) throw new Error('Opções inválidas.');
  return Array.from({ length: count }, () => {
    const formatted = options.formatted !== false;
    switch (type) {
      case 'qrcode': {
        if (count > 10) throw new Error('Gere no máximo 10 QR Codes por vez.');
        if (typeof options.text !== 'string' || !options.text.trim() || options.text.length > 1000) throw new Error('Informe um texto ou link com até 1.000 caracteres.');
        return { texto: options.text };
      }
      case 'senha': return password(options);
      case 'cpf': return cpf(formatted);
      case 'cnpj': return cnpj(formatted, options.alpha === true);
      case 'cep': { const value = digits(8); return formatted ? value.slice(0,5) + '-' + value.slice(5) : value; }
      case 'cartao': {
        const brand = options.brand ?? 'visa';
        if (!Object.hasOwn(cards, brand)) throw new Error('Bandeira inválida.');
        return { bandeira: brand, numero: cards[brand], validade: `12/${new Date().getUTCFullYear() + 2}`, cvc: brand === 'amex' ? '1234' : '123', ambiente: 'Sandbox Stripe' };
      }
      case 'nickname': {
        const style = options.style ?? 'gamer';
        if (!Object.hasOwn(nickWords, style)) throw new Error('Estilo inválido.');
        return nickWords[style].map(choose).join('') + (options.numbers === false ? '' : randomInt(10,100));
      }
      case 'pessoa': {
        const nome = choose(['Ana','Bruno','Clara','Diego','Elisa','Felipe','Lia','Rafael']) + ' ' + choose(['Silva','Souza','Lima','Costa','Almeida','Santos']);
        return { nome, idade: randomInt(18,81), email: `teste.${randomUUID().slice(0,8)}@example.com`, cpf: cpf(), origem: 'Dados sintéticos para testes' };
      }
      case 'uuid': return randomUUID();
      case 'sorteador': {
        const min = integer(options.min ?? 1, -1000000000, 1000000000, 'Mínimo');
        const max = integer(options.max ?? 100, -1000000000, 1000000000, 'Máximo');
        if (min > max) throw new Error('Mínimo não pode ser maior que máximo.');
        return randomInt(min, max + 1);
      }
    }
  });
}
