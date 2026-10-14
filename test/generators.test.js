import test from 'node:test';
import assert from 'node:assert/strict';
import { generate, password } from '../src/generators.js';
import { server } from '../server.js';

// Independent validators use the published weighted-sum algorithms.
function validCPF(value) {
  if (/^(.)\1+$/.test(value)) return false;
  for (let length = 9; length <= 10; length++) {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += Number(value[i]) * (length + 1 - i);
    const digit = (sum * 10 % 11) % 10;
    if (digit !== Number(value[length])) return false;
  }
  return true;
}
function validCNPJ(value) {
  for (let length = 12; length <= 13; length++) {
    let sum = 0, weight = 2;
    for (let i = length - 1; i >= 0; i--) { sum += (value.charCodeAt(i) - 48) * weight; weight = weight === 9 ? 2 : weight + 1; }
    const rest = sum % 11;
    if (Number(value[length]) !== (rest < 2 ? 0 : 11 - rest)) return false;
  }
  return true;
}
test('CPF and both CNPJ formats have valid check digits across batches', () => {
  assert.ok(generate('cpf',{formatted:false},100).every(value => /^\d{11}$/.test(value) && validCPF(value)));
  for (const alpha of [false,true]) assert.ok(generate('cnpj',{formatted:false,alpha},100).every(value => /^[A-Z0-9]{12}\d{2}$/.test(value) && validCNPJ(value)));
  assert.ok(validCNPJ('12ABC34501DE35')); // Receita Federal reference vector.
  assert.match(generate('cpf')[0], /^\d{3}\.\d{3}\.\d{3}-\d{2}$/);
  assert.match(generate('cnpj')[0], /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/);
});
test('passwords include every selected class and respect disabled classes', () => {
  for (let i=0;i<100;i++) { const value = password({length:20}); assert.equal(value.length,20); for (const regex of [/[A-Z]/,/[a-z]/,/\d/,/[!@#$%&*+\-=?_]/]) assert.match(value, regex); }
  assert.match(password({length:40,upper:false,lower:false,symbols:false}), /^\d{40}$/);
  assert.throws(() => password({upper:false,lower:false,numbers:false,symbols:false}));
});
test('limits, unknown types and invalid options are rejected', () => {
  for (const count of [0,101,1.5,'2']) assert.throws(() => generate('uuid',{},count));
  assert.throws(() => generate('missing'));
  assert.throws(() => generate('uuid',null));
  assert.throws(() => generate('senha',{length:129}));
  assert.throws(() => generate('cartao',{brand:'__proto__'}));
  assert.throws(() => generate('nickname',{style:'__proto__'}));
  assert.throws(() => generate('sorteador',{min:5,max:1}));
});
test('other tools produce the intended data', () => {
  assert.match(generate('uuid')[0],/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/);
  assert.match(generate('cep')[0],/^\d{5}-\d{3}$/);
  assert.equal(generate('cartao')[0].numero,'4242 4242 4242 4242');
  assert.equal(generate('cartao',{brand:'amex'})[0].cvc.length,4);
  assert.match(generate('pessoa')[0].email,/@example\.com$/);
  assert.ok(generate('nickname',{style:'fantasia',numbers:false},20).every(value => !/\d/.test(value)));
  assert.deepEqual(generate('sorteador',{min:3,max:3},3),[3,3,3]);
});
test('HTTP API serves the app, validates requests and prevents cross-origin generation', async () => {
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (body, extra={}) => fetch(base+'/api/generate',{method:'POST',headers:{'Content-Type':'application/json',...extra},body});
  try {
    const home = await fetch(base); assert.equal(home.status,200); assert.match(await home.text(),/Gerador Lab/); assert.ok(home.headers.get('content-security-policy'));
    assert.equal((await fetch(base+'/api/health')).status,200);
    assert.equal((await fetch(base+'/not-found')).status,404);
    assert.equal((await fetch(base+'/api/generate')).status,405);
    const response = await post(JSON.stringify({type:'cpf',count:4})); assert.equal(response.status,200); assert.equal((await response.json()).results.length,4);
    assert.equal((await post('{')).status,400);
    assert.equal((await post('null')).status,400);
    assert.equal((await post(JSON.stringify({type:'uuid',count:101}))).status,400);
    const qr = await post(JSON.stringify({type:'qrcode',options:{text:'https://example.com'}}));
    assert.equal(qr.status,200); assert.match((await qr.json()).results[0].imagem,/^data:image\/png;base64,iVBOR/);
    assert.equal((await post(JSON.stringify({type:'qrcode',options:{text:''}}))).status,400);
    assert.equal((await post(JSON.stringify({type:'qrcode',count:11,options:{text:'teste'}}))).status,400);
    assert.equal((await post('{}',{'Content-Type':'text/plain'})).status,415);
    assert.equal((await post('{}',{Origin:'https://example.com'})).status,403);
    assert.equal((await post(JSON.stringify({data:'x'.repeat(17000)}))).status,413);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
