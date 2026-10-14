# Gerador Lab

Aplicação local com front-end em HTML/CSS/JavaScript e API em Node.js. Requer Node.js 22 ou superior.

## Executar

```sh
npm install
npm start
```

Abra http://localhost:3000. Para reiniciar o servidor automaticamente ao editar arquivos, use `npm run dev`. A variável `PORT` permite trocar a porta. O servidor atende somente na interface local.

## Ferramentas

- Senhas de 4 a 128 caracteres, usando `node:crypto` e incluindo todas as classes selecionadas.
- CPF com dígitos verificadores e formatação opcional.
- CNPJ numérico ou alfanumérico com dígitos verificadores. Filial gerada: 0001.
- CEP aleatório com ou sem hífen, sem consulta a endereços existentes.
- Cartões fixos de sandbox Stripe: Visa, Mastercard e Amex.
- Nicknames por estilo, com números opcionais.
- Pessoas fictícias, com e-mail em example.com.
- UUID v4.
- Sorteio de números inteiros, com limites inclusivos e possibilidade de repetição.
- QR Code de texto ou link, com download em PNG.

Interface responsiva, tema persistido no navegador, busca, cópia individual ou em lote e exportação TXT/CSV/JSON. Até 100 resultados por chamada; QR Code limitado a 10. Resultados e senhas não são armazenados. Apenas a preferência de tema é salva no navegador.

## Estrutura

```text
public/           Interface e estilos
src/generators.js Regras de geração e validação das opções
server.js         Servidor HTTP, arquivos estáticos e API
test/             Testes dos algoritmos e da API
```

## API

`GET /api/health`: saúde do servidor.

`GET /api/tools`: lista de tipos aceitos.

`POST /api/generate`, com `Content-Type: application/json`:

```json
{"type":"senha","count":2,"options":{"length":20,"upper":true,"lower":true,"numbers":true,"symbols":true}}
```

Retorna `{"results":[...]}`. Tipos: `senha`, `cpf`, `cnpj`, `cep`, `cartao`, `nickname`, `pessoa`, `uuid`, `sorteador`, `qrcode`.

Opções: `formatted` para CPF/CNPJ/CEP; `alpha` para CNPJ; `brand` (`visa`, `mastercard`, `amex`) para cartão; `style` (`gamer`, `fantasia`, `divertido`) e `numbers` para nickname; `min`/`max` para sorteio; `text` para QR Code (até 1.000 caracteres). Os tamanhos, limites e quantidades devem ser números inteiros. Erros retornam JSON com o campo `error`.

## Verificação

```sh
npm test
```

Testes verificam dígitos de CPF/CNPJ, classes de senha, limites, resultados e os contratos HTTP, incluindo QR Code.

## Escopo dos dados

CPF e CNPJ gerados passam na validação matemática, mas podem coincidir com inscrições reais. Use somente em testes. CEPs não têm existência confirmada. Cartões são fixtures públicas exclusivas do sandbox Stripe. Não há consulta a bancos de dados pessoais nem integração com pagamentos.

O projeto está preparado para uso local. Publicação na internet exige configurar HTTPS, limites de requisição e operação do servidor conforme o ambiente escolhido.

Referências: [CNPJ — Receita Federal](https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/documentos-tecnicos/cnpj), [cartões de teste — Stripe](https://docs.stripe.com/testing), [node-qrcode](https://github.com/soldair/node-qrcode).
