# Manual permanente para agentes

## Objetivo

Construir gradualmente um jogo 3D de navegador, gratuito, single-player e offline-first, com exploração espacial, combate tático, energia, sensores, escudos direcionais, armas, raio trator e dano visual. O hardware de referência é um Acer Aspire A515-51G com i7-8550U, MX130 2 GB, UHD 620 e Windows 11.

O projeto usa identidade original por padrão. Não adicione nomes, modelos, logos, interface, música, vozes ou sons de Star Trek sem licença/autorização verificável.

## Fontes de verdade

Leia antes de implementar:

1. `docs/PROGRESS.md` — etapa ativa e último gate;
2. `docs/MVP.md` — prioridade P0–P3 e critérios;
3. `docs/PRODUCT_SPEC.md` — comportamento e requisitos;
4. `ARCHITECTURE.md` — fronteiras e estratégia técnica;
5. `docs/DECISIONS.md` — decisões que não podem ser revertidas sem ADR;
6. `docs/ASSUMPTIONS.md` — hipóteses que precisam de validação;
7. `docs/ROADMAP.md` — ordem e gates;
8. `PLANEJAMENTO.md` — pesquisa, alternativas e orçamentos detalhados.

Em conflito, requisito mais recente e explícito do usuário vence. Atualize os documentos afetados, não deixe duas regras canônicas divergentes.

## Estado atual

P0.1 a P0.5 foram aprovados. A revisão P0.4 de 27/08/2026 foi exercida pelo coordenador sem convocar subagente Architect, conforme decisão explícita do usuário. O cenário determinístico e os presets estão em `DECISION-025`; dano visual por seção, impacto direcional e VFX limitados estão em `DECISION-026`. Em 29/08/2026, o usuário substituiu a medição obrigatória da MX130 por fluidez escalável sem personalização de GPU; `DECISION-027` aprovou o P0.5 com a medição física UHD 620/baixo de 60,010 FPS e p99 de 18,9 ms. O P1 está em desenvolvimento: `DECISION-028` implementou o primeiro ciclo de missão, `DECISION-029` adicionou save local versionado, `DECISION-030` expandiu o treinamento para três missões sequenciais, `DECISION-031` entregou mapa/viagem, `DECISION-032` separou menu inicial/base/sessão tática, `DECISION-033` entregou configurações persistentes separadas do save, `DECISION-034` concluiu a acessibilidade prioritária, `DECISION-035` entregou o diário derivado do checkpoint seguro, `DECISION-036` concluiu o áudio procedural e `DECISION-037` entregou manifesto, validação transacional, fallback de asset e inventário de licenças. O gate P1-G passa com 198/198 testes e 78/78 casos E2E Chrome/Edge; offline, balanceamento e revisão final P1-H são a próxima subfatia.

Versões fixadas no scaffold: Node.js 22.12 ou superior, TypeScript 6.0.3, Vite 8.2.2, PlayCanvas 2.21.4, Vitest 4.1.11, Playwright 1.62.1, ESLint 10.8.1 e Prettier 3.9.6. O motivo para manter TypeScript 6 no scaffold está em `DECISION-017`; não atualize isoladamente sem conferir a matriz do typescript-eslint.

## Arquitetura resumida

- TypeScript estrito, Vite, npm e PlayCanvas Engine standalone;
- WebGL 2 é baseline; WebGPU é opcional após benchmark;
- aplicação estática; sem backend, autenticação, banco remoto ou API em runtime;
- domínio não importa PlayCanvas, DOM, IndexedDB ou relógio global;
- PlayCanvas, HUD, entrada e persistência são adaptadores;
- simulação usa passo fixo; IA/sensores podem usar frequências menores;
- conteúdo é orientado a dados validados;
- P1 usa IndexedDB para progresso e `localStorage` para preferências, atrás de repositórios e schemas separados;
- voo é cinemático e usa volumes simples; não adicione física antes de necessidade medida.

## Estrutura planejada

```text
docs/                 documentação canônica e progresso
public/assets/        assets distribuídos/manifestos
src/application/      sessão, loop, comandos e casos de uso
src/content/          definições e validação de conteúdo
src/domain/           regras independentes do motor
src/engine/           PlayCanvas, cena, VFX, áudio, LOD e assets
src/platform/         browser, entrada, persistência e diagnóstico
src/ui/               HUD e menus HTML/CSS
src/styles/           estilos globais/tokens
tests/e2e/            fluxos no navegador
tests/fixtures/       dados determinísticos
tests/performance/    cenário e registro de benchmark
tools/                pipeline de asset, apenas quando necessário
```

Crie somente os diretórios exigidos pela fatia atual. Não gere esqueletos vazios para fases futuras.

## Convenções de código

- TypeScript estrito; não use `any` para contornar modelagem.
- Nomes de código em inglês; textos visíveis inicialmente em português brasileiro.
- Use unidades nos nomes quando houver ambiguidade (`durationMs`, `distanceMeters`).
- Definições imutáveis ficam separadas de estado de sessão mutável.
- IDs lógicos ligam domínio, conteúdo e engine; não espalhe caminhos de asset.
- Dependências do domínio entram por parâmetro/interface explícita.
- Não leia `Date.now`, `Math.random`, DOM ou armazenamento dentro do domínio.
- Comandos solicitam ações; eventos descrevem fatos já validados.
- Não duplique estado autoritativo no HUD ou em entidades PlayCanvas.
- Prefira funções pequenas e composição. Evite hierarquias por classe de nave/arma.
- Valide dados na fronteira e trate erro com contexto acionável.
- Comentários explicam motivo/restrição, não repetem a linha.

O formatter/linter escolhido no P0.1 definirá detalhes mecânicos. Não adicione ferramentas sobrepostas para estilo.

## Comandos disponíveis

| Ação | Comando esperado |
| --- | --- |
| Instalação reproduzível | `npm ci` |
| Desenvolvimento | `npm run dev` |
| Testes unitários/integrados | `npm test` |
| Testes em modo único/CI | `npm run test:run` |
| E2E de produção em Chrome/Edge | `npm run test:e2e` |
| Validar assets e licenças de runtime | `npm run assets:check` |
| Lint | `npm run lint` |
| Formatar | `npm run format` |
| Conferir formatação | `npm run format:check` |
| Typecheck | `npm run typecheck` |
| Build | `npm run build` |
| Preview de produção | `npm run preview` |
| Gate local sem E2E | `npm run verify` |

`npm run test:e2e` executa o build, inicia o preview e usa os canais `chrome` e `msedge` instalados no sistema. Não documente um comando como disponível antes de configurá-lo e executá-lo. Use a versão Node LTS compatível registrada no projeto; não dependa de instalação global além de Node/npm e ferramentas de arte explicitamente documentadas.

## Testes e critérios de entrega

Para cada fatia:

1. confirme requisito/critério no MVP e roadmap;
2. implemente a menor solução completa;
3. execute testes relevantes, lint, typecheck e build;
4. execute preview/E2E quando houver UI, engine, asset ou persistência;
5. faça revisão de lógica, arquitetura, UX, acessibilidade, segurança e performance;
6. corrija e reexecute verificações;
7. atualize `docs/PROGRESS.md` e decisões/premissas afetadas.

Regras centrais exigem teste sem GPU: energia, escudo, dano, armas, raio trator, IA, missão e migração de save. Efeitos visuais exigem inspeção e benchmark, não apenas snapshot.

Classifique achados como CRITICAL, HIGH, MEDIUM ou LOW segundo `docs/ROADMAP.md`. Máximo de cinco ciclos review → implement → test por grande etapa. Depois disso, registre itens restantes em `docs/KNOWN_ISSUES.md`; CRITICAL/HIGH ainda bloqueiam o gate.

## Desempenho

- meta gate: ≥30 FPS médios e p99 ≤50 ms no preset suportado pela GPU acelerada efetivamente escolhida pelo navegador;
- não altere preferências de GPU do sistema; uma segunda GPU pode ser medida como diagnóstico opcional;
- WebGPU nunca substitui o fallback WebGL 2 no MVP;
- prefira LOD, instancing, atlas, pools e carregamento por setor;
- não adicione transparência/pós-processamento/sombras pesadas sem comparar o benchmark;
- registre hardware, navegador, backend gráfico, resolução, preset e percentis de frametime;
- uma regressão de performance é defeito funcional quando rompe o gate.

## Segurança, privacidade e licenças

- nunca versione segredo, senha, token, chave ou `.env` real;
- se variáveis forem necessárias, documente nomes não secretos em `.env.example`;
- não execute código, mod, JSON ou save não confiável;
- insira texto de conteúdo como texto, não `innerHTML` não sanitizado;
- mantenha dependências mínimas, fixadas em lockfile e com licença compatível;
- não remova validação/teste para fazer build passar;
- não adicione analytics ou envio de dados sem requisito e consentimento;
- registre autor, URL/origem, licença e data de todo asset externo;
- “grátis para baixar” não significa “permitido para redistribuir”.

## Acessibilidade e UX

- HUD funciona desde 1280×720 e tem escala ajustável em P1;
- informação crítica não depende apenas de cor;
- menus são navegáveis por teclado;
- pausa/perda de foco libera ponteiro e não deixa comandos presos;
- ofereça redução de flashes/tremor/partículas conforme o MVP;
- erro não pode resultar apenas em tela preta ou mensagem no console.

## Git e colaboração

- preserve mudanças do usuário e de outros agentes; não reverta trabalho alheio.
- não use comandos destrutivos (`reset --hard`, limpeza ampla ou checkout de arquivos alheios).
- revise `git diff` e execute verificações antes de concluir.
- ao finalizar uma tarefa do projeto, faça commit e push conforme a instrução permanente do projeto.
- em trabalho multiagente, somente o coordenador executa o commit/push consolidado; subagentes entregam arquivos e parecer sem operações Git paralelas, salvo instrução explícita do coordenador.
- não publique deploy/PR/release sem autorização específica; push de código-fonte e publicação do jogo são ações distintas.

## Documentação e manutenção

- atualize `docs/PROGRESS.md` em toda etapa;
- registre decisão arquitetural importante em `docs/DECISIONS.md` antes de divergir;
- marque premissas validadas/rejeitadas em `docs/ASSUMPTIONS.md` com evidência;
- mantenha `docs/PRODUCT_SPEC.md` focado no “o quê”, `ARCHITECTURE.md` no “como” e `PLANEJAMENTO.md` em pesquisa/contexto;
- não copie a mesma explicação longa entre arquivos; use links;
- crie `docs/KNOWN_ISSUES.md` somente quando houver um problema real a registrar.

## Não alterar sem necessidade demonstrada

- PlayCanvas como motor antes do gate do spike;
- WebGL 2 como baseline;
- separação domínio/engine/UI;
- ausência de backend/auth/multiplayer;
- voo cinemático e colisões simples;
- escopo e ordem P0 → P1 → P2/P3;
- identidade original e inventário de licenças;
- metas mínimas do hardware, exceto por decisão baseada em benchmark.

Mudanças nesses itens exigem atualização de decisão, impacto no MVP/roadmap e revisão do Product Architect.
