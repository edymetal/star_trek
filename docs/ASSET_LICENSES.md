# Inventário de assets e licenças

Atualizado em: 2 de setembro de 2026  
Escopo: build local P1-G do Comando Estelar

Este é o inventário humano legível dos recursos distribuídos. O catálogo verificável em runtime fica em `public/assets/asset-manifest.json`; `npm run assets:check` impede tamanho, hash, tipo, caminho ou atribuição divergentes e também rejeita arquivos não registrados em `public/assets/`.

## Asset distribuído

| ID lógico | Arquivo | Autoria e origem | Licença/termo | Tamanho | SHA-256 |
| --- | --- | --- | --- | ---: | --- |
| `ui.brand-mark` | `public/assets/stellar-command-mark.svg` | Projeto Comando Estelar; criação original no repositório em 02/09/2026 | `LicenseRef-Project-Authored` | 1.107 bytes | `0abcba8da0cfb4d91507d943eba83aa943e0ba1f0c952f1a2e965fa428971dbf` |

`LicenseRef-Project-Authored` significa que o recurso é uma criação original, sem material de terceiros, autorizada no build deste projeto. Não é uma licença aberta autônoma. O titular ainda precisa escolher os termos públicos do projeto antes de qualquer publicação.

O manifesto JSON é metadado de integridade do próprio build e não se registra recursivamente. Ele é validado por schema v1 e copiado junto ao SVG na saída do Vite.

## Recursos próprios gerados em runtime

Esses elementos não possuem arquivo binário separado no build:

- modelos de naves, base, corpos celestes, asteroides e starfield compostos com primitivas do PlayCanvas;
- materiais, iluminação, estados de dano, decalques geométricos e VFX programáticos;
- interface, ícones geométricos CSS, textos e conteúdo original das três missões;
- efeitos e ambientes tonais sintetizados pela Web Audio API, sem amostras, voz ou música externa;
- símbolo textual `CE`, usado como fallback quando o emblema não passa na validação.

Autoria: Projeto Comando Estelar. Termo atual: `LicenseRef-Project-Authored`, dentro de um repositório `private` e `UNLICENSED`.

## Dependência distribuída no JavaScript

| Pacote | Versão | Licença | Origem | Distribuído no build |
| --- | ---: | --- | --- | --- |
| PlayCanvas Engine | 2.21.4 | MIT | `https://github.com/playcanvas/engine` / npm `playcanvas` | Sim, no chunk lazy do motor |

Não há outra dependência de runtime. O jogo não carrega CDN, API, fonte web, analytics ou serviço externo.

## Ferramentas de desenvolvimento não distribuídas

| Ferramenta/pacote direto | Versão | Licença |
| --- | ---: | --- |
| `@eslint/js` | 10.0.1 | MIT |
| `@playwright/test` | 1.62.1 | Apache-2.0 |
| `@types/node` | 22.20.1 | MIT |
| `@types/webxr` | 0.5.24 | MIT |
| `eslint` | 10.8.1 | MIT |
| `eslint-config-prettier` | 10.1.8 | MIT |
| `prettier` | 3.9.6 | MIT |
| `typescript` | 6.0.3 | Apache-2.0 |
| `typescript-eslint` | 8.67.0 | MIT |
| `vite` | 8.2.2 | MIT |
| `vitest` | 4.1.11 | MIT |

Dependências transitivas são travadas por `package-lock.json`; não integram o runtime salvo quando incorporadas pelas ferramentas ao resultado de build. Uma auditoria completa do lockfile deve ser repetida antes de publicação ou atualização deliberada.

## Arquivos fora do build jogável

- `docs/screenshots/*.png`: capturas locais produzidas pelos testes/inspeções do próprio projeto; evidência documental, não copiadas para `dist/`;
- documentação e arquivos `.bat`: autoria do projeto; não são assets carregados pela sessão 3D;
- fontes tipográficas: apenas famílias já disponíveis no sistema do usuário; nenhum arquivo de fonte é distribuído.

## Propriedade intelectual e publicação

Nenhum nome, modelo, logo, personagem, interface, música, voz ou som de Star Trek integra o build. A referência à franquia existe apenas na documentação de risco e na declaração negativa de créditos.

O pacote continua `private: true` e `license: UNLICENSED`. Este inventário aprova a composição do build privado do MVP; não autoriza deploy, release, repositório público nem uso de marca de terceiros. Antes de publicar, o titular deve escolher a licença/termos do próprio projeto, confirmar a identidade final e repetir a auditoria.
