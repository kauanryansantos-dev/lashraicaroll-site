# Raissa Carolina Lash Design · site

Site do estúdio de extensão de cílios da Raissa Carolina, em Curitiba (PR).
No ar em **https://lashraicaroll.kauanryansantos.workers.dev**

## O que o site faz
- Apresenta as técnicas com preço, duração e manutenção, com fotos reais de cada uma.
- Simulador "Escolha o seu estilo" com troca suave entre as fotos.
- Agendamento em passos (técnica, dia, período, nome) que monta a mensagem e abre o WhatsApp da Raissa; uma conversa simulada mostra a mensagem sendo escrita.
- Depoimentos reais de clientes, certificados, regras do atendimento, como chegar e política de privacidade (LGPD + CDC).
- Feito para celular primeiro (~80% do público).

## Como é feito
- HTML, CSS e JavaScript puros, sem framework e sem etapa de build.
- Rolagem suave com [Lenis](https://github.com/darkroomengineering/lenis) apenas para mouse.
- Hospedagem estática no Cloudflare Workers (só arquivos da pasta `site/`, configurado em `wrangler.jsonc`).

## Segurança
- Content Security Policy rígida: `script-src 'self'`, nenhum script inline, nenhum `on*` no HTML.
- `X-Frame-Options: DENY` e `frame-ancestors 'none'` (não abre dentro de outro site), `Cross-Origin-Resource-Policy: same-origin` (fotos não podem ser usadas por outro site), HSTS, `nosniff`, `Referrer-Policy` e `Permissions-Policy` fechadas. Ver `site/_headers`.
- O site não guarda nem envia dados: o nome digitado só vai na mensagem do WhatsApp.
- Pentest antes de publicar: XSS pela URL e pelos campos, troca do número do WhatsApp, clickjacking e cópia da página.

## Direitos
Todos os direitos reservados (ver `LICENSE`). Fotos, textos e marca pertencem à Raissa Carolina Lash Design.
Código de Kauan Ryan Santos.
