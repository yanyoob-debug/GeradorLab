const $ = selector => document.querySelector(selector);
const tools = {
  qrcode: { title:'Gerador de QR Code', short:'QR Code', icon:'▧', action:'Gerar QR Code', description:'QR Code de texto ou link, com download em PNG.', tipTitle:'Texto e download', tip:'Cole um link completo ou um texto de até 1.000 caracteres. Baixe a imagem PNG e teste a leitura antes de imprimir.', reference:'https://github.com/soldair/node-qrcode' },
  senha: { title:'Gerador de senha', short:'Senhas', icon:'✳', action:'Gerar senha', description:'Configure o tamanho e os tipos de caracteres.', tipTitle:'Composição da senha', tip:'Prefira senhas longas e exclusivas para cada conta. Todos os tipos de caracteres selecionados aparecem no resultado.', reference:'https://nodejs.org/api/crypto.html#cryptorandomintmin-max-callback' },
  cpf: { title:'Gerador de CPF', short:'CPF', icon:'▤', action:'Gerar CPF', description:'Dados sintéticos para seus formulários.', tipTitle:'Dígitos verificadores', tip:'Os dígitos verificadores são calculados corretamente. Isso não indica emissão oficial e não garante que o número não pertença a alguém.', reference:'https://www.gov.br/receitafederal/pt-br/assuntos/meu-cpf' },
  cnpj: { title:'Gerador de CNPJ', short:'CNPJ', icon:'▦', action:'Gerar CNPJ', description:'Formatos numérico e alfanumérico para testes.', tipTitle:'Formatos de CNPJ', tip:'Escolha o formato tradicional ou alfanumérico. Ambos têm dígitos verificadores calculados; não comprovam cadastro na Receita Federal.', reference:'https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/documentos-tecnicos/cnpj' },
  cep: { title:'Gerador de CEP', short:'CEP', icon:'⌖', action:'Gerar CEP', description:'Códigos aleatórios no formato de CEP.', tipTitle:'CEP sem consulta de endereço', tip:'Os códigos são aleatórios e não são consultados nos Correios. Não representam um endereço confirmado.', reference:'https://buscacepinter.correios.com.br/app/endereco/index.php' },
  cartao: { title:'Cartões de teste', short:'Cartão', icon:'▱', action:'Obter cartão de teste', description:'Fixtures oficiais para o sandbox da Stripe.', tipTitle:'Sandbox Stripe', tip:'Use apenas no modo de teste da Stripe. Os números são fixos e documentados por bandeira; não são cartões de pagamento reais.', reference:'https://docs.stripe.com/testing' },
  nickname: { title:'Gerador de nickname', short:'Nickname', icon:'♧', action:'Gerar nickname', description:'Escolha o estilo e a inclusão de números.', tipTitle:'Estilos e disponibilidade', tip:'Os nicknames combinam palavras do estilo selecionado. A disponibilidade do nome nas plataformas não é verificada.', reference:'https://nodejs.org/api/crypto.html' },
  pessoa: { title:'Pessoa fictícia', short:'Pessoa fictícia', icon:'♙', action:'Gerar pessoa', description:'Um cadastro sintético para seus testes.', tipTitle:'Dados fictícios', tip:'Nomes são combinados aleatoriamente e os e-mails usam example.com. Qualquer semelhança com pessoas reais é coincidência.', reference:'https://www.iana.org/help/example-domains' },
  uuid: { title:'Gerador de UUID', short:'UUID', icon:'⌘', action:'Gerar UUID', description:'Identificadores aleatórios no padrão UUID v4.', tipTitle:'UUID versão 4', tip:'UUIDs são úteis para identificar registros e recursos. Cada geração usa a função criptográfica randomUUID do Node.js.', reference:'https://nodejs.org/api/crypto.html#cryptorandomuuidoptions' },
  sorteador: { title:'Sorteador de números', short:'Sorteador', icon:'⚄', action:'Sortear números', description:'Sorteie números inteiros no intervalo informado.', tipTitle:'Intervalo e repetição', tip:'Os limites mínimo e máximo estão incluídos. Cada resultado é um sorteio independente, então números podem se repetir.', reference:'https://nodejs.org/api/crypto.html#cryptorandomintmin-max-callback' }
};
let current = 'senha', results = [], busy = false, noticeTimer;
const fields = {
  qrcode: '<label class="field">Texto ou link<textarea name="text" maxlength="1000" rows="4" placeholder="https://seusite.com.br" required></textarea></label>',
  senha: '<label class="field"><span class="range-line">Tamanho da senha <input name="length" type="number" value="16" min="4" max="128" required></span></label><div class="checks"><label><input type="checkbox" name="upper" checked> Maiúsculas (A–Z)</label><label><input type="checkbox" name="lower" checked> Minúsculas (a–z)</label><label><input type="checkbox" name="numbers" checked> Números (0–9)</label><label><input type="checkbox" name="symbols" checked> Símbolos (!@#)</label></div>',
  cpf: '<div class="checks"><label><input name="formatted" type="checkbox" checked> Com pontuação</label></div>',
  cnpj: '<label class="field">Formato<select name="alpha"><option value="false">Numérico tradicional</option><option value="true">Alfanumérico</option></select></label><div class="checks"><label><input name="formatted" type="checkbox" checked> Com pontuação</label></div>',
  cep: '<div class="checks"><label><input name="formatted" type="checkbox" checked> Com hífen</label></div>',
  cartao: '<label class="field">Bandeira<select name="brand"><option value="visa">Visa</option><option value="mastercard">Mastercard</option><option value="amex">American Express</option></select></label>',
  nickname: '<label class="field">Estilo<select name="style"><option value="gamer">Gamer</option><option value="fantasia">Fantasia</option><option value="divertido">Divertido</option></select></label><div class="checks"><label><input name="numbers" type="checkbox" checked> Incluir números</label></div>',
  pessoa: '<p class="field">Nome, idade, e-mail de exemplo e CPF em um só resultado.</p>',
  uuid: '<p class="field">UUID versão 4, pronto para copiar e usar.</p>',
  sorteador: '<label class="field">Mínimo<input name="min" type="text" inputmode="numeric" pattern="[0-9]+" data-integer autocomplete="off" value="1" required></label><label class="field">Máximo<input name="max" type="text" inputmode="numeric" pattern="[0-9]+" data-integer autocomplete="off" value="100" required></label>'
};
function notify(message) { $('#notification').textContent = message; $('#notification').classList.add('visible'); clearTimeout(noticeTimer); noticeTimer = setTimeout(() => $('#notification').classList.remove('visible'), 3500); }
function renderNav() {
  const search = $('#search').value.toLocaleLowerCase('pt-BR');
  $('#navigation').replaceChildren();
  for (const [key, tool] of Object.entries(tools)) {
    if (!tool.title.toLocaleLowerCase('pt-BR').includes(search)) continue;
    const button = document.createElement('button');
    button.className = 'nav-button' + (key === current ? ' active' : '');
    button.setAttribute('aria-pressed', String(key === current));
    const icon = document.createElement('span'); icon.textContent = tool.icon; icon.setAttribute('aria-hidden','true');
    button.append(icon, document.createTextNode(tool.short));
    button.disabled = busy;
    button.addEventListener('click', () => selectTool(key));
    $('#navigation').append(button);
  }
  if (!$('#navigation').children.length) $('#navigation').textContent = 'Nenhuma ferramenta encontrada.';
}
function selectTool(key) {
  current = key; const tool = tools[key];
  $('#tool-title').textContent = tool.title; $('#tool-icon').textContent = tool.icon;
  $('#tool-description').textContent = tool.description; $('#tip-title').textContent = tool.tipTitle; $('#tip').textContent = tool.tip;
  $('#reference').href = tool.reference; $('#options').innerHTML = fields[key];
  $('#generate').replaceChildren(document.createTextNode(tool.action + ' ↗'));
  results = []; renderResults(); renderNav();
}
const asText = value => typeof value === 'object' ? Object.entries(value).filter(([key]) => key !== 'imagem').map(([key, val]) => `${key}: ${val}`).join('\n') : String(value);
async function copy(text) { try { await navigator.clipboard.writeText(text); notify('Copiado para a área de transferência.'); } catch { notify('Não foi possível copiar. Selecione o resultado para copiar manualmente.'); } }
function renderResults() {
  $('#results').replaceChildren(); $('#result-count').textContent = results.length;
  for (const id of ['clear','copy-all','download']) $('#' + id).disabled = !results.length;
  if (!results.length) { $('#results').innerHTML = '<div class="empty"><p>Nenhum resultado gerado.</p><small>Configure as opções e clique em gerar.</small></div>'; return; }
  for (const [index, result] of results.entries()) {
    const row = document.createElement('div'); row.className = 'result-row';
    const content = document.createElement('pre'); content.textContent = asText(result);
    if (result?.imagem) {
      const image = document.createElement('img'); image.src = result.imagem; image.alt = `QR Code para ${result.texto}`; image.width = 160; image.height = 160;
      const download = document.createElement('a'); download.href = result.imagem; download.download = `qrcode-${index + 1}.png`; download.className = 'secondary'; download.textContent = 'Baixar PNG';
      const preview = document.createElement('div'); preview.className = 'qr-preview'; preview.append(image, download); row.append(preview);
    }
    const button = document.createElement('button'); button.className = 'quiet'; button.textContent = 'Copiar'; button.setAttribute('aria-label', `Copiar resultado ${index + 1}`); button.addEventListener('click', () => copy(asText(result)));
    row.append(content, button); $('#results').append(row);
  }
}
// Text inputs avoid native number-field editing issues and show a numeric keyboard on mobile.
$('#options').addEventListener('input', event => {
  const input = event.target;
  if (!input.matches('[data-integer]')) return;
  const caret = input.selectionStart ?? input.value.length;
  const beforeCaret = input.value.slice(0, caret).replace(/[^0-9]/g, '').length;
  const digits = input.value.replace(/[^0-9]/g, '');
  if (input.value !== digits) {
    input.value = digits;
    input.setSelectionRange(beforeCaret, beforeCaret);
  }
  input.setCustomValidity(Number(digits) > 1000000000 ? 'Informe um número de 0 a 1.000.000.000.' : '');
});
$('#generator-form').addEventListener('submit', async event => {
  event.preventDefault(); if (busy) return;
  const options = {};
  for (const input of $('#options').querySelectorAll('[name]')) options[input.name] = input.type === 'checkbox' ? input.checked : input.type === 'number' || input.hasAttribute('data-integer') ? Number(input.value) : input.name === 'alpha' ? input.value === 'true' : input.value;
  busy = true; $('#generate').disabled = true; $('#generate').textContent = 'Gerando…'; renderNav();
  try {
    const response = await fetch('/api/generate', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({type:current, options, count:Number($('#count').value)}), signal:AbortSignal.timeout(10000) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Não foi possível gerar.');
    results = data.results; renderResults(); notify(`${results.length} resultado(s) gerado(s).`);
  } catch (error) { notify(error.name === 'TimeoutError' ? 'O servidor demorou para responder. Tente novamente.' : error.message); }
  finally { busy = false; $('#generate').disabled = false; $('#generate').textContent = tools[current].action + ' ↗'; renderNav(); }
});
$('#search').addEventListener('input', renderNav);
$('#clear').addEventListener('click', () => { results = []; renderResults(); });
$('#copy-all').addEventListener('click', () => copy(results.map(asText).join('\n\n')));
$('#download').addEventListener('click', () => {
  const format = $('#export-format').value;
  const quote = value => '"' + String(value).replaceAll('"','""') + '"';
  let content;
  if (format === 'json') content = JSON.stringify(results,null,2);
  else if (format === 'csv') {
    const rows = results.map(value => typeof value === 'object' ? value : { resultado:value }); const keys = Object.keys(rows[0]);
    content = '\uFEFF' + [keys.map(quote).join(','), ...rows.map(row => keys.map(key => quote(row[key])).join(','))].join('\r\n');
  } else content = results.map(asText).join('\n\n');
  const url = URL.createObjectURL(new Blob([content], { type:format === 'json' ? 'application/json' : format === 'csv' ? 'text/csv;charset=utf-8' : 'text/plain;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = `${current}.${format}`; link.click(); setTimeout(() => URL.revokeObjectURL(url),1000);
});
try { document.body.classList.toggle('dark', localStorage.getItem('theme') === 'dark'); } catch {}
$('#theme').addEventListener('click', () => { const dark = document.body.classList.toggle('dark'); try { localStorage.setItem('theme',dark ? 'dark' : 'light'); } catch {} });
selectTool(current);
