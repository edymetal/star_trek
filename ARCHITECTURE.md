# Arquitetura do jogo

Status: aceita para P0  
Versão: 1.0 — 20 de agosto de 2026

Este documento define como o produto será construído. Requisitos pertencem a [`docs/PRODUCT_SPEC.md`](docs/PRODUCT_SPEC.md), prioridade a [`docs/MVP.md`](docs/MVP.md), decisões justificadas a [`docs/DECISIONS.md`](docs/DECISIONS.md) e pesquisa/orçamentos detalhados a [`PLANEJAMENTO.md`](PLANEJAMENTO.md).

## 1. Direção arquitetural

Aplicação web estática, single-player e offline-first, composta por um núcleo de simulação TypeScript independente de renderização e adaptadores para PlayCanvas, interface HTML/CSS, entrada e persistência do navegador.

O PlayCanvas desenha e apresenta o mundo; não é a fonte única das regras. Energia, dano, escudos, armas, sensores, IA, missão e save devem ser testáveis sem criar canvas ou GPU. Essa separação reduz acoplamento, permite testes rápidos e evita que mudanças de asset alterem regras do jogo.

```text
Entrada ──> Aplicação ──> Domínio/simulação ──> Estado e eventos
   │              │              │                   │
   └── HUD <──────┴──── PlayCanvas/renderização <────┘
                               │
                      áudio, VFX e telemetria

Dados validados ──> definições de nave, arma, missão e setor
IndexedDB <───────> snapshots versionados da aplicação (P1)
```

## 2. Princípios

- **Simplicidade:** sem backend, framework de UI, física completa ou estado global adicional sem necessidade medida.
- **Determinismo útil:** regras críticas em passo fixo, relógio explícito e aleatoriedade com semente em testes.
- **Dados antes de subclasses:** diferenças entre naves, armas e missões vivem em definições validadas.
- **Apresentação derivada do estado:** HUD, áudio e VFX reagem ao mesmo estado/evento de domínio.
- **Orçamento de desempenho:** cada recurso gráfico precisa degradar de forma controlada pelos presets e preservar fluidez no perfil suportado, sem depender de um modelo específico de GPU.
- **Falha visível e recuperável:** compatibilidade, asset ou save inválido produz mensagem e rota segura.
- **Offline real:** nenhuma regra central depende de rede ou serviço de terceiros.

## 3. Tecnologias escolhidas

| Camada | Escolha | Por quê |
| --- | --- | --- |
| Linguagem | TypeScript em modo estrito | Regras e saves têm muitos estados; tipos e validação reduzem inconsistências |
| Runtime de desenvolvimento | Node.js LTS compatível | Ecossistema estável; não faz parte do runtime entregue ao jogador |
| Gerenciador | npm com lockfile | Já acompanha Node.js e evita adicionar ferramenta sem ganho necessário |
| Dev/build | Vite | Servidor rápido, build estático, suporte direto a TypeScript e assets |
| Motor 3D | PlayCanvas Engine standalone via npm | MIT, web-first, ECS/render PBR, áudio, partículas, WebGL 2 e rota WebGPU |
| Baseline gráfico | WebGL 2 | Maior previsibilidade no hardware e drivers alvo |
| Caminho opcional | WebGPU | Só será promovido depois de benchmark real; nunca requisito do P0 |
| HUD | HTML/CSS + TypeScript | Texto acessível, layout responsivo e nenhum framework necessário no P0 |
| Formato 3D | GLB/glTF 2.0 | Padrão interoperável e adequado à web |
| Otimização de assets | glTF Transform, meshopt e KTX2 quando validados | Reduz download, memória e custo de GPU em pipeline repetível |
| Testes unitários | Vitest | Integração simples com Vite e execução rápida do domínio |
| Testes de navegador | Playwright | Valida carga, entrada, persistência e compatibilidade em navegador real |
| Persistência P1 | IndexedDB com repositório próprio e schema versionado | Local, assíncrono e suficiente sem banco remoto |
| Arte | Blender e Krita | Gratuitos, abertos e adequados ao pipeline glTF/texturas |

As versões exatas serão as estáveis compatíveis no dia do scaffold e ficarão fixadas no `package-lock.json`. A tabela de versões pesquisadas em 20/08/2026 está em `PLANEJAMENTO.md`; nenhuma versão beta/alpha deve ser adotada por padrão.

### Tecnologias deliberadamente ausentes

- backend, banco remoto, autenticação e API própria;
- React/Vue/Svelte para o HUD inicial;
- outra ECS ou biblioteca de estado sobre o PlayCanvas;
- biblioteca de áudio separada;
- motor de física no P0;
- IA generativa, analytics e serviços pagos.

Rapier só será avaliado se colisões/constraints medidas superarem claramente a solução cinemática simples. Babylon.js é o fallback técnico apenas se o spike do PlayCanvas falhar num critério objetivo.

## 4. Runtime e fluxos

### Inicialização

1. Carregar shell HTML/CSS mínimo.
2. Ler preferências locais não sensíveis.
3. Verificar WebGL 2, aceleração/renderizador e capacidades relevantes.
4. Escolher preset conservador; o usuário pode alterá-lo.
5. Carregar o manifesto e os assets essenciais da arena/setor.
6. Aquecer shaders críticos e iniciar a simulação somente quando o estado estiver íntegro.
7. Mostrar erro acionável e opção segura se uma etapa falhar.

### Ciclo de quadro

- entrada é amostrada e convertida em comandos;
- um acumulador executa zero ou mais passos fixos de simulação;
- IA e sensores usam frequências inferiores e relógio da simulação;
- eventos de domínio são publicados depois de cada passo consistente;
- o adaptador gráfico interpola transformações e apresenta o estado;
- HUD, áudio e VFX consomem estado/eventos sem reexecutar a regra;
- telemetria de desenvolvimento registra custo e contadores.

Frequências iniciais, a validar:

| Processo | Frequência |
| --- | --- |
| Renderização | variável, meta de 60 FPS |
| Movimento/combate | passo fixo de 60 Hz ou 30 Hz após benchmark |
| IA tática | 5–10 Hz |
| Sensores/tráfego local distante | 1–5 Hz |
| Estado fora do setor | por evento/intervalo longo |

A escolha 60 Hz versus 30 Hz é um resultado do P0, não uma preferência estética.

## 5. Componentes principais

### `domain`

Regras puras ou com dependências explícitas:

- tempo, IDs, vetores/unidades do domínio e aleatoriedade;
- nave, base, reator e rede de energia;
- voo cinemático e navegação;
- sensores e contatos;
- feixes, torpedos e raio trator;
- escudos, casco, subsistemas e dano;
- IA em máquina de estados/utility simples;
- missões, progressão e regras de save.

O domínio não importa PlayCanvas, DOM, IndexedDB nem relógio global.

### `application`

Coordena casos de uso e sessão:

- inicialização e mudança de estados do jogo;
- conversão de intenção do usuário em comandos;
- criação/descarte de setor e encontro;
- execução do loop e roteamento de eventos;
- repositório abstrato de save/configuração;
- recuperação de falhas e transições de missão.

### `engine`

Adaptação ao PlayCanvas:

- criação e sincronização de entidades visuais;
- câmeras, materiais, iluminação, partículas e áudio;
- carregamento/descarga de assets e pools;
- LOD, instancing, origem flutuante e perfis gráficos;
- raycasts/volumes simples quando necessários à apresentação/colisão.

Scripts do motor referenciam IDs/estado da aplicação; lógica de dano não fica em callbacks de material ou partícula.

### `ui`

- menu, HUD, energia, sensores, pausa e configurações;
- componentes DOM pequenos e sem framework no P0;
- estado de interface separado do estado persistente do jogo;
- eventos sem HTML injetado a partir de dados.

### `platform`

- entrada de teclado/mouse e futuramente gamepad;
- IndexedDB e preferências locais;
- compatibilidade gráfica e tela cheia;
- observabilidade de desenvolvimento e tratamento global de erro.

### `content`

- dados validados de naves, armas, missões, facções e setores;
- catálogo/manifesto de assets;
- créditos, fontes e licenças.

Conteúdo inválido falha durante validação/teste ou carregamento controlado, nunca produz comportamento silenciosamente indefinido.

## 6. Estrutura de diretórios proposta

Essa estrutura ainda não existe; o Agente 2 deve criá-la gradualmente no P0.1.

```text
/
├─ docs/                    # produto, MVP, roadmap, premissas, decisões e progresso
├─ public/
│  └─ assets/               # arquivos distribuídos e manifestos gerados
├─ src/
│  ├─ application/          # sessão, casos de uso, loop e transições
│  ├─ content/              # definições e validadores de conteúdo
│  ├─ domain/               # regras sem PlayCanvas/DOM
│  │  ├─ combat/
│  │  ├─ energy/
│  │  ├─ flight/
│  │  ├─ missions/
│  │  ├─ sensors/
│  │  └─ ships/
│  ├─ engine/               # adaptadores PlayCanvas, cena, VFX, áudio e assets
│  ├─ platform/             # navegador, entrada, persistência e diagnóstico
│  ├─ ui/                   # HUD e menus DOM
│  ├─ styles/
│  └─ main.ts               # composition root mínimo
├─ tests/
│  ├─ e2e/
│  ├─ fixtures/
│  └─ performance/
├─ tools/                   # validação/otimização de assets quando necessário
├─ AGENTS.md
├─ ARCHITECTURE.md
└─ package.json
```

Testes unitários podem ficar próximos do módulo ou em `tests`; a primeira configuração deve escolher uma convenção e aplicá-la consistentemente. Assets-fonte pesados do Blender não devem entrar automaticamente no build web; sua estratégia de armazenamento será decidida quando existirem arquivos reais.

## 7. Modelo de dados conceitual

### Definição versus estado

- **Definition:** conteúdo imutável e versionável, como massa, capacidade base e montagem de armas.
- **State:** valores da sessão, como posição, energia, integridade, calor e cooldown.
- **View:** representação derivada para HUD/engine, sem autoridade para alterar regra.

### Agregados e relações

```text
GameSession
├─ SectorState
│  ├─ CelestialBody*
│  ├─ ShipState*
│  └─ StarbaseState*
├─ MissionProgress
└─ PlayerProgress

ShipState / StarbaseState
├─ EnergyGrid
├─ ShieldState[4 setores]
├─ HullSection*
│  └─ SubsystemState*
├─ WeaponState*
└─ SensorState / ContactState*
```

Identificadores são estáveis e serializáveis. Valores têm unidade explícita na nomenclatura/documentação. Definições referenciam assets por ID lógico, nunca por caminho espalhado no código.

### Eventos de domínio

Conjunto inicial:

- `EnergyAllocationChanged`;
- `ContactDetected` / `ContactScanCompleted`;
- `WeaponFired` / `WeaponRejected`;
- `ShieldHit` / `ShieldSectorCollapsed`;
- `HullDamaged` / `SubsystemDisabled`;
- `TractorLockStarted` / `TractorLockBroken`;
- `ShipDestroyed`;
- `MissionUpdated`.

Eventos representam fatos já validados. Comandos podem ser rejeitados com motivo estruturado. Filas têm limite e ciclo de vida para não reter objetos indefinidamente.

## 8. Organização espacial

Três escalas evitam precisão ruim e simulação desnecessária:

1. **Mapa setorial:** nós, rotas e estado lógico; sem corpos 3D simultâneos.
2. **Sistema estelar:** composição artística de estrela, planetas, luas, bases e pontos de interesse.
3. **Bolha tática:** jogador, contatos próximos, projéteis e efeitos em simulação completa.

O adaptador gráfico aplica origem flutuante/recenteamento sem mudar coordenadas lógicas de missão de forma observável. Planetas usam escala artística, não distâncias astronômicas no espaço local. Colisões usam volumes simples, nunca a malha visual detalhada.

## 9. Persistência

P0 persiste apenas preferências essenciais se isso for necessário ao teste. P1 adiciona:

- IndexedDB atrás de `SaveRepository`, sem acesso espalhado pelo domínio;
- envelope com versão, data, checksum/validação estrutural e payload;
- migrações sequenciais testadas;
- gravação transacional em novo registro/slot antes de substituir referência válida;
- autosave somente fora de combate ou em ponto seguro;
- configurações em repositório/registro separado do progresso;
- limite de slots e tamanho, com erro de quota tratado.

Save do cliente não é proteção antitrapaça e não precisa ser criptografado. Ele não conterá segredo nem dado pessoal.

## 10. Estratégia de assets

- GLB/glTF validado, com LODs, pivôs, sockets e volumes documentados;
- atlas e materiais compartilhados para reduzir draw calls;
- KTX2/Basis apenas após validar qualidade e suporte no baseline;
- asteroides instanciados e efeitos reutilizados por pools limitados;
- carregamento por arena/setor e descarte explícito de recursos;
- manifesto registra tamanho, hash, tipo, dependências e licença;
- shaders críticos são aquecidos no carregamento quando isso reduzir stutter mensurável.

Estados de dano combinam máscaras/variantes preparadas, decalques limitados, emissivos, partículas e poucas peças destacáveis. Corte arbitrário de malha não faz parte da arquitetura.

## 11. Desempenho e qualidade gráfica

O cenário de benchmark do P0 é uma funcionalidade permanente. Ele deve medir FPS/frametime, draw calls, triângulos, efeitos ativos, tempo de carga e tamanho de assets. Orçamentos de referência:

- preset suportado pela GPU acelerada: mínimo de 30 FPS médios e p99 de até 50 ms no pior encontro;
- referência física aprovada: 1280×720/baixo na UHD 620 com 60,010 FPS e p99 de 18,9 ms;
- 200–300 draw calls no pico como teto inicial;
- conteúdo ativo idealmente abaixo de 1,2–1,4 GB de VRAM estimada;
- 40–60 MB compactados até primeira interação;
- escala de resolução de 70–100% quando necessário.

Perfis controlam ao menos resolução, sombras, partículas, decalques, pós-processamento e distância/LOD. WebGPU será comparado ao WebGL 2 no mesmo cenário e conteúdo. Detalhes de geometria/texturas ficam em `PLANEJAMENTO.md`.

## 12. Estratégia de testes

### Unitários

- conservação e limites de energia;
- setor de escudo pelo vetor de impacto;
- transbordo para casco e efeitos de subsistema;
- custos, cooldown, calor, alcance e alvo de cada arma;
- força/quebra do raio trator;
- transições de IA e missão;
- serialização, validação e migração de saves.

### Integração

- aplicação executa passos e produz eventos na ordem esperada;
- adaptador sincroniza entidade visual sem duplicar autoridade;
- carregamento/descarte não deixa listener, entidade ou efeito órfão;
- entrada, pausa e perda de foco são idempotentes.

### Navegador/E2E

- boot e diagnóstico em Chrome/Edge;
- fluxo crítico de P0 e, depois, ciclo do P1;
- erro de asset/save mostra recuperação;
- persistência sobrevive a reload/novo contexto.

### Desempenho

- cenário determinístico e versão do preset/hardware registrados;
- comparação por percentis de frametime, não apenas média de FPS;
- regressão relevante bloqueia o gate ou exige decisão documentada.

Testes visuais devem validar estados importantes, mas não substituir teste de regra. Não se busca cobertura percentual artificial.

## 13. Segurança e privacidade

- sem segredo no cliente/repositório e sem `.env` real versionado;
- dependências mínimas, fixadas e auditadas antes da publicação;
- CSP e headers de hospedagem restritivos quando a plataforma permitir;
- dados JSON validados em fronteiras; texto inserido como texto, não HTML;
- nenhuma execução de script, mod ou save não confiável;
- licença e origem obrigatórias para assets;
- sem telemetria remota no MVP; métricas de desempenho permanecem locais/exportáveis manualmente.

Como não há autenticação nem backend, controles de sessão, autorização e proteção de API não se aplicam. Se isso mudar, uma nova análise é obrigatória antes de implementar.

## 14. Estratégia de deploy

- `vite build` gera conteúdo estático versionável;
- prévia local valida exatamente o conteúdo de produção;
- publicação futura em GitHub Pages ou Cloudflare Pages gratuito;
- URLs de asset funcionam sob subdiretório/base configurável;
- source maps públicos e cache/PWA serão decisões deliberadas;
- publicação só ocorre após decisão de propriedade intelectual, inventário de licenças, testes de produção e autorização do usuário.

O jogo deve funcionar servido por HTTP(S). Abrir `index.html` diretamente via `file://` não é requisito; o modo local usa servidor de desenvolvimento/prévia gratuito.

## 15. Evolução e limites

- multiplayer exige arquitetura de autoridade, rede, segurança e backend totalmente nova;
- pouso/interiores exigem nova escala de mundo, conteúdo e controles;
- suporte móvel exige novo orçamento, UX e matriz de dispositivos;
- mods exigem sandbox, formato público e modelo de segurança;
- qualquer um desses itens precisa de nova especificação e ADR antes de entrar no roadmap ativo.

## 16. Gates arquiteturais do P0

1. **Boot:** PlayCanvas/Vite/TypeScript carregam com WebGL 2 e erro controlado.
2. **Domínio:** energia e dano rodam em testes sem PlayCanvas.
3. **Integração:** estado lógico dirige HUD e visual sem duas fontes de verdade.
4. **Conteúdo:** arena e nave são orientadas a dados validados.
5. **Desempenho:** benchmark mede o notebook alvo e decide frequência/presets/WebGPU.

Nenhuma decisão de produto em aberto impede esses gates. O Agente 2 está autorizado a iniciar o P0.1, sujeito à revisão incremental descrita no roadmap.
