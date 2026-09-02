# Progresso do projeto

Atualizado em: 2 de setembro de 2026  
Etapa atual: P1 — Vertical slice/MVP  
Estado do código: gate técnico P1-H concluído; MVP aguarda playtest humano de primeira experiência e revisão formal  
Próximo responsável: usuário/testador iniciante, seguido de Product Architect / aprovação final P1

Handoff detalhado para continuação: `docs/HANDOFF_REMAINING_WORK.md`

Legenda:

- [ ] Não iniciado
- [~] Em desenvolvimento
- [x] Concluído
- [!] Problema

## Etapa 0 — Pré-produção

- [x] Ler requisitos, solicitação anexada e `PLANEJAMENTO.md`
- [x] Consolidar visão e requisitos em `docs/PRODUCT_SPEC.md`
- [x] Priorizar P0–P3 em `docs/MVP.md`
- [x] Definir arquitetura em `ARCHITECTURE.md`
- [x] Registrar premissas em `docs/ASSUMPTIONS.md`
- [x] Registrar decisões em `docs/DECISIONS.md`
- [x] Criar roadmap objetivo em `docs/ROADMAP.md`
- [x] Criar manual permanente `AGENTS.md`
- [x] Reconciliar documentos canônicos com `PLANEJAMENTO.md`
- [x] Executar revisão formal da pré-produção
- [x] Autorizar início do P0.1

## P0 — Protótipo técnico

### P0.1 Fundação verificável

- [x] Scaffold TypeScript/Vite/PlayCanvas
- [x] Dependências estáveis fixadas e licenças verificadas
- [x] Estrutura mínima e fronteiras arquiteturais
- [x] Lint, typecheck, testes e build
- [x] Diagnóstico WebGL 2/renderizador e erro controlado
- [x] Smoke test em Chrome e Edge
- [x] Revisão do Product Architect

### P0.2 Arena e voo

- [x] Nave e câmera
- [x] Movimento cinemático/passo fixo
- [x] Pausa, foco, ponteiro e tela cheia
- [x] Arena/corpos provisórios/instancing
- [x] Telemetria básica e primeiro LOD
- [x] Testes e revisão do Product Architect

### P0.3 Energia e HUD

- [x] Domínio de energia com quatro consumidores
- [x] Presets e efeitos nos sistemas
- [x] HUD provisório acessível
- [x] Testes de invariantes
- [x] Revisão do Product Architect

### P0.4 Sensores, armas e IA

- [x] Seleção e escaneamento
- [x] Feixe, torpedo e raio trator
- [x] Escudos, casco e subsistemas
- [x] IA básica e condições de encontro
- [x] Correções do ciclo 2 integradas; fluxo crítico e matriz E2E estáveis em Chrome/Edge
- [x] Revisão formal e gate completo

### UI-1 Apresentação tática prioritária

- [x] Tema sci-fi naval original e tokens acessíveis
- [x] HUD distribuído nas bordas e centro livre
- [x] EnergyDrawer e DiagnosticsDrawer recolhíveis
- [x] Câmera externa, starfield instanciado, retículo e marcador seguro
- [x] Layout sem scroll/overlap em 1280×720 e 1600×900
- [x] E2E focado em Chrome/Edge e inspeção visual
- [x] Revisão incorporada ao gate formal P0.4

### UI-GFX Polimento gráfico de apresentação

- [x] Materiais e iluminação naval sci-fi originais sem assets externos
- [x] Silhuetas legíveis, três estados visuais de dano e starfield instanciado
- [x] Feixe, torpedo, trator, impactos e escudo em pool fixo
- [x] Dois efeitos de combate simultâneos no adaptador, sem alterar o domínio
- [x] Inspeção real e capturas em 1280×720 e 1600×900
- [x] Revisão gráfica incorporada ao gate formal P0.4; não equivale ao gate/benchmark P0.5

### P0.5 Dano visual e benchmark

- [x] Estados de dano por seção e efeitos limitados
- [x] Cenário determinístico
- [x] Perfis baixo/médio/alto
- [x] Benchmark escalável e WebGL 2/WebGPU — UHD 620 física concluída; segunda GPU opcional
- [x] Gate formal do P0

## P1 — Vertical slice/MVP

- [x] Três missões tutoriais ponta a ponta: sensores, assistência e combate
- [x] Base segura, mapa navegável e viagem — partida, retorno, reparo/reabastecimento e transição visual implementados
- [x] Save IndexedDB versionado
- [x] Tutorial contextual e progressão segura entre missões
- [x] Menu inicial, continuar, diagnóstico, créditos e comando da base
- [x] Configurações persistentes, escala do HUD, redução de efeitos e remapeamento essencial
- [x] Acessibilidade prioritária, teclado completo, semântica e anúncios controlados
- [x] Diário mínimo de objetivos e descobertas
- [x] Áudio e feedback final
- [x] Inventário de licenças
- [x] Instalação limpa, E2E e benchmark final do MVP
- [ ] Playtest humano iniciante e revisão formal do MVP

## P2/P3

- [ ] P2 — alpha de conteúdo
- [ ] P3 — ideias futuras
- [ ] Preparação para publicação

## Revisão formal da pré-produção

**Resultado:** APROVADO PARA P0.1.

Verificações realizadas:

- [x] objetivo, público, ciclo e fora de escopo estão explícitos;
- [x] P0 é pequeno o suficiente para ser testado, mas prova todas as mecânicas centrais;
- [x] P1 fecha o ciclo de missão e persistência sem contaminar P0;
- [x] arquitetura não exige backend, autenticação, banco remoto ou serviço pago;
- [x] WebGL 2 é baseline e WebGPU depende de evidência;
- [x] domínio e renderização têm fonte de verdade clara;
- [x] hardware e metas têm gate mensurável;
- [x] risco de propriedade intelectual possui padrão seguro;
- [x] acessibilidade, erro, privacidade, deploy e manutenção foram cobertos;
- [x] questões desconhecidas têm premissa e momento de validação.

### Inconsistências encontradas e reconciliadas

1. O texto original pede um jogo “baseado em Star Trek”, enquanto publicação com a franquia não está licenciada. A documentação autoriza inspiração mecânica, mas exige conteúdo original por padrão.
2. O planejamento anterior menciona versões pesquisadas de ferramentas. A arquitetura esclarece que versões reais serão estáveis, compatíveis e fixadas somente no scaffold.
3. “Offline” não significa abrir por `file://`; o requisito é não depender de backend/rede depois dos arquivos disponíveis, usando servidor local gratuito ou hospedagem estática.
4. “Ótima qualidade” foi convertido em qualidade escalável com metas objetivas, LOD e dano preparado, não destruição procedural ilimitada.
5. A lista original de decisões pendentes poderia bloquear o início. Cada uma recebeu padrão provisório seguro; apenas publicação exige decisão final de PI.

### Bloqueios reais

Nenhum bloqueio real para iniciar P0.1. Antes de publicar, será bloqueante confirmar identidade original/licença e auditar todos os assets. O antigo gate vinculado à MX130 foi renegociado e encerrado formalmente em `DECISION-027` antes do início do P1.

## Relatório anterior — UI-1

**ETAPA:** UI-1 — Apresentação tática prioritária  
**STATUS:** segundo ciclo de correções concluído; apresentação aceita pelo coordenador sem nova revisão do Product Architect, conforme prioridade do usuário

### Implementado

O HUD foi recomposto em cartões de objetivo, sessão, nave e alvo nas bordas, barra tática no centro inferior, feedback de combate, banner terminal e drawers recolhíveis de energia/diagnóstico. A paleta, tipografia, espaçamentos, foco e estados são originais, responsivos e compatíveis com redução de movimento. A publicação textual permanece limitada a 8 Hz e idempotente.

A câmera apresenta a nave no terço inferior com aproximadamente 23,8% da largura em 1280×720 e 24,4% em 1600×900. O starfield determinístico usa uma única chamada instanciada. O marcador recebe um DTO de apresentação e nunca consulta posição inimiga oculta: enquanto observado projeta o último snapshot público e, durante memória, congela sua última posição de tela com rótulo e traços próprios. A malha e o LOD da nave remota ficam ocultos sem observação atual, também sem consultar a posição autoritativa oculta.

### Problemas encontrados

Naquele ciclo, o P0.4 foi interrompido pela prioridade explícita UI-1 e permaneceu sem aprovação. A matriz E2E então mantinha duas falhas do mesmo fluxo terminal, uma por navegador. O teste permaneceu ativo, sem `skip`; a instabilidade foi resolvida posteriormente no relatório P0.4 mais recente. Permanecem os avisos conhecidos do Vite sobre o chunk lazy do PlayCanvas e workers internos não usados pela cena.

### Problemas corrigidos

O EnergyDrawer deixou de cobrir o objetivo em 1280×720 ao iniciar recolhido. O estado terminal recebeu região própria, os valores de condição usam faixas legíveis e os controles existentes preservaram atalhos, ARIA e seletores de automação. No segundo ciclo, subsistemas e os setores F/T/B/E foram consolidados no cartão do jogador; o alvo não identificado não expõe esses dados. A ordem DOM/Tab passou a objetivo → ações táticas → energia → sessão, sem landmarks duplicados. O estado de memória ganhou rótulo `MEMÓRIA · ÚLTIMA POSIÇÃO`, corners e linha tracejados; atualizações de estilo são idempotentes e cessam quando a projeção está congelada ou pausada.

### Testes

- `npm run verify`: aprovado;
- formatação, lint, TypeScript e build Vite: aprovados;
- Vitest: 111 testes aprovados em 17 arquivos;
- Playwright focado em UI-1: 18/18 aprovados em Chrome/Edge, cobrindo boot, hierarquia de dados, quatro setores de escudo, ordem semântica/landmarks, pausa/comandos, memória explícita e idempotente, ocultação perceptual da malha remota, layout nos dois viewports, foco, tela cheia e rejeições do navegador;
- Playwright completo naquele ciclo: 30/32 aprovados; resultado histórico substituído pela matriz 38/38 do relatório P0.4 mais recente;
- inspeção visual: zero scroll/overlap em 1280×720 e 1600×900, nave entre 22–30% da largura e centro tático livre;
- diagnóstico de cena no preset baixo: 15 draw calls e 96 asteroides instanciados; essa leitura não é benchmark;
- auditoria npm: zero vulnerabilidade conhecida.

### Pendências

A apresentação UI-1 foi validada pelo coordenador. Os achados sobre memória sensorial, integridade, LOS, terminal e pausa permaneceram cobertos pelos testes; a instabilidade integrada foi resolvida em `DECISION-024`. A revisão formal do P0.4 e a seleção física da MX130 ainda estão pendentes.

### Próxima etapa

UI-1 está encerrada como fatia de apresentação. O ciclo técnico P0.4 está verde e aguarda revisão formal; depois disso, a próxima implementação é o cenário determinístico e benchmark P0.5.

## Relatório anterior — UI-GFX

**ETAPA:** UI-GFX — Polimento gráfico de apresentação  
**STATUS:** implementação, inspeção gráfica do coordenador e gates focados concluídos

### Implementado

A cena recebeu materiais próprios em azul naval, prata, vinho hostil e emissivos ciano/laranja/violeta, iluminação direcional sem sombras e silhuetas por primitivas com casco, ponte e motores legíveis. Jogador e contato observado apresentam estados íntegro, avariado e crítico; sem observação atual, a malha remota e seu LOD permanecem ocultos conforme o DTO público.

Feixe do jogador/inimigo, torpedo, raio trator, impactos e escudo usam um pool fixo de 12 entidades. O adaptador de apresentação confirma o resultado do comando no passo seguinte por mudanças públicas de escudo/casco, munição ou trator, retém o efeito por 1,5 s e combina no máximo dois efeitos visuais sem modificar estado, IA ou regras do domínio. Reinício e estado terminal limpam a retenção.

### Evidência visual e desempenho diagnóstico

- `docs/screenshots/ui-gfx-final-1600x900.png`: composição completa sem overlap/scroll, nave direcional com motores emissivos e starfield enriquecido;
- `docs/screenshots/ui-gfx-final-combat-1280x720.png`: combate identificado com bracket, feixe fino, impacto/escudo e alvo contrastado;
- `docs/screenshots/ui-gfx-final-memory-1280x720.png`: memória sensorial explícita sem revelar a malha inimiga;
- preset baixo/WebGL 2: 18 draw calls em repouso, 22 com um efeito, 26 com dois efeitos simultâneos e teto automatizado de 28 durante projétil; 96 asteroides e 680 estrelas seguem instanciados;
- o drawer de energia aberto substitui visualmente o cartão de objetivo no mesmo trilho esquerdo e o restaura ao recolher, sem alterar a ordem DOM;
- um E2E dedicado valida limites completos e interseção zero para todos os painéis visíveis nos estados padrão, energia aberta, pausa, memória e terminal, em 1280×720 e 1600×900;
- as leituras são diagnóstico local, não benchmark da MX130/UHD 620.

### Testes

- `npm run verify`: aprovado no gate final desta fatia;
- Vitest: 121 testes aprovados em 18 arquivos;
- Playwright de apresentação UI pura: 20/20 em Chrome/Edge;
- adaptador de apresentação/VFX: 10/10 testes unitários aprovados;
- fluxo gráfico-combate de feixe, torpedo e trator: 0/2 na repetição daquele ciclo; o teste permaneceu ativo, sem `skip`, e passou após as correções registradas em `DECISION-024`;
- auditoria npm: zero vulnerabilidade conhecida;
- matriz P0.4 naquele ciclo: 30/32, sem `skip`; o resultado atual é 38/38 no relatório seguinte.

### Limites e próxima etapa

UI-GFX não contém asset final, partículas complexas, sombras, pós-processamento ou benchmark físico. As capturas e a apresentação pura foram aprovadas pelo coordenador; o fluxo integrado foi estabilizado depois em `DECISION-024`. P0.5 ainda depende da revisão formal do P0.4 e continua responsável pelos assets e pelo benchmark físico.

## Relatório anterior — P0.4 ciclo 2

**ETAPA:** P0.4 — Sensores, armas e IA  
**STATUS:** correções técnicas concluídas; revisão formal do Product Architect pendente

### Implementado

O torpedo deixou de interpolar apenas a distância inicial e passou a manter posição física própria. Enquanto o contato está observado, ele atualiza a solução; durante memória, segue inercialmente a última solução pública. O dano só é aplicado se o segmento percorrido interceptar o raio físico da nave inimiga. Perda da solução ou alcance encerrado produz falha sem dano, e a posição oculta do alvo não orienta nem é publicada pelo projétil.

Os fluxos E2E agora devolvem foco ao canvas antes de comandos de pilotagem posteriores a cliques em botões. Isso preserva a regra acessível que impede atalhos de voo sobre controles interativos e elimina o falso alinhamento em que A/D era ignorado. A cadência do feixe inimigo recebeu multiplicador provisório 3×, oferecendo seis segundos testados para selecionar, escanear e executar a primeira decisão sem impedir derrota posterior.

### Evidência e testes

- `npm run verify`: aprovado;
- Vitest: 123/123 testes aprovados em 18 arquivos;
- regressão nova: torpedo continua inercial durante memória e só acerta por interseção física;
- balanceamento: casco e sensores permanecem íntegros durante a janela inicial de seis segundos;
- fluxo crítico feixe/torpedo/trator mais vitória/reinício: 12/12 em três repetições sequenciais por navegador;
- Playwright completo: 38/38 em Chrome/Edge, um worker, nenhum `skip`;
- inspeção no navegador real: boot, seleção, scan e identificação funcionais com o HUD aprovado;
- auditoria npm: zero vulnerabilidade conhecida;
- avisos Vite/PlayCanvas sobre workers não usados e chunk lazy permanecem conhecidos e não bloqueantes.

### Próxima etapa

O bloqueio técnico do ciclo 2 foi removido. Falta a revisão formal do P0.4; após esse gate, o próximo trabalho é P0.5: cenário determinístico, perfis baixo/médio/alto, efeitos de dano limitados e benchmark físico na MX130/UHD 620. P1 continua bloqueado até o gate formal de desempenho.

## Revisão formal — P0.4

**ETAPA:** P0.4 — Sensores, armas e IA  
**STATUS:** APROVADO em 27 de agosto de 2026

A função de reviewer foi exercida pelo coordenador sem convocar o subagente Architect, respeitando a decisão explícita do usuário. A revisão conferiu requisitos, lógica, fronteiras arquiteturais, UX/acessibilidade, segurança, desempenho diagnóstico e a matriz real de navegadores.

Evidência repetida no commit então versionado:

- `npm run verify`: aprovado com 123/123 testes em 18 arquivos;
- Playwright completo: 38/38 em Chrome/Edge, um worker e nenhum `skip`;
- domínio sem imports de PlayCanvas, DOM, UI ou plataforma;
- nenhum `any`, `innerHTML`, segredo, código remoto ou achado CRITICAL/HIGH;
- percepção, memória sensorial, torpedo, IA, pausa, reinício e equipamentos permanecem cobertos;
- avisos do chunk lazy do PlayCanvas e workers não usados continuam não bloqueantes e pertencem à otimização P0.5.

Resultado: o gate funcional P0.4 foi encerrado e o P0.5 autorizado. P1 continua bloqueado até o benchmark físico e o gate formal de saída do P0.

## Relatório anterior — P0.5 benchmark, fatia 1

**ETAPA:** P0.5 — Dano visual e benchmark  
**STATUS:** infraestrutura determinística concluída; medições físicas e dano por seção pendentes

### Implementado

- presets baixo, médio e alto agora controlam escala de resolução, antialiasing, distância de LOD, estrelas, asteroides, naves de carga e quantidade de danos simultâneos;
- modo explícito `?benchmark=1` com aquecimento e janela de medição configuráveis;
- carga determinística de 4/6/8 naves, 96/144/192 asteroides e 680/900/1.200 estrelas conforme o preset;
- dois efeitos táticos e um projétil permanecem ativos usando o pool existente, sem alterar o estado autoritativo do encontro;
- profiler com capacidade fixa de 7.200 amostras e relatório de FPS médio, p50, p95, p99 e pior frametime;
- painel visível de andamento/resultado e atributos estáveis para automação;
- `EXECUTAR_BENCHMARK.bat` e procedimento em `docs/BENCHMARK_P0_5.md`.

### Verificação desta fatia

- Vitest parcial: 132/132 em 20 arquivos após os testes novos;
- E2E focado do benchmark: 2/2 em Chrome/Edge;
- inspeção real em 1600×900: zero scroll, todos os painéis dentro do viewport e nenhum erro/aviso no console;
- diagnóstico curto no navegador integrado identificou UHD 620, preset médio, aproximadamente 60 FPS e p95 de 19 ms; esse número não substitui a medição física formal de 30 segundos.

### Próxima etapa

Executar e registrar MX130 1600×900/médio e UHD 620 1280×720/baixo em Chrome ou Edge. Em paralelo de implementação, concluir dano por seção, partículas/decalques/emissivos limitados e efeito de subsistema desativado. Comparar WebGPU somente depois de registrar o baseline WebGL 2.

## Relatório anterior — P0.5 dano visual e benchmark UHD 620

**ETAPA:** P0.5 — Dano visual e benchmark  
**STATUS:** implementação da fatia concluída; medição MX130 e gate formal pendentes

### Dano visual concluído

- proa, popa, bombordo e estibordo possuem estados visuais independentes derivados do dano lógico;
- quatro decalques preparados e três sparks geométricos por nave impedem crescimento de entidades por acerto;
- o preset limita a quantidade de seções com sparks simultâneos a 1/2/3;
- motor, escudo, armas e sensores perdem emissividade quando o respectivo subsistema é desativado;
- feixe e impacto usam o setor direcional real do alvo;
- memória sensorial oculta seções e subsistemas remotos, sem consultar estado autoritativo escondido;
- o teto E2E do combate no preset baixo foi ajustado de 28 para 36 draw calls para os recursos preparados.

### Benchmark físico UHD 620

As medições foram realizadas em janela física do Chrome 151.0.7922.34, com renderizador acelerado `ANGLE (Intel UHD Graphics 620, D3D11)`, 1280×720, preset baixo, 5 s de aquecimento e 30 s de coleta:

| Backend | FPS médio | p50 | p95 | p99 | Draw calls | VFX ativos |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| WebGL 2 | 60,010 | 16,7 ms | 17,9 ms | 18,9 ms | 69 | 17 |
| WebGPU | 60,011 | 16,7 ms | 17,6 ms | 19,9 ms | 69 | 17 |

O perfil baixo da UHD 620 fica validado com limiar prático de 30 FPS. WebGPU não mostrou ganho material e permanece somente experimental; WebGL 2 continua baseline e padrão do MVP.

### Estado do gate

Naquele momento, o Chrome não possuía preferência de GPU do usuário registrada no Windows e selecionou a UHD 620. O estado foi substituído em 29/08/2026: o usuário removeu o vínculo obrigatório à MX130 e `DECISION-027` aprovou o gate escalável sem alterar configurações do sistema.

### Verificação consolidada

- `npm run verify`: aprovado com 132/132 testes em 20 arquivos, lint, typecheck e build;
- Playwright completo: 40/40 casos em Chrome/Edge, um worker e nenhum `skip`;
- testes focados após reposicionar a captura de dano: 2/2 Chrome/Edge;
- benchmark físico: 1/1 WebGL 2 e 1/1 WebGPU, ambos com 30 s de coleta;
- inspeção das capturas 1280×720 e 1600×900: HUD íntegro, memória sensorial legível e dano crítico/impacto visíveis;
- nenhum achado CRITICAL/HIGH nesta fatia; os avisos conhecidos de chunk lazy e workers PlayCanvas não usados continuam não bloqueantes.

## Relatório anterior — gate P0.5 e primeira missão P1

**ETAPA:** P0.5 encerrado; P1 primeira subfatia  
**STATUS:** P0 aprovado; missão de exploração completa em uma sessão

### Gate de desempenho reconciliado

O requisito explícito de 29/08/2026 substituiu a personalização e medição obrigatória da MX130 por uma experiência leve e sem travamentos. `DECISION-027` preserva os presets, o benchmark permanente, WebGL 2, LOD, instancing e pools, mas mede a GPU acelerada que o navegador realmente escolheu. O limiar passa a ser ≥30 FPS médios e p99 ≤50 ms no preset suportado. A medição física UHD 620/baixo de 60,010 FPS e p99 18,9 ms aprovou o P0.5 com ampla margem. A revisão do coordenador não encontrou achado CRITICAL/HIGH; o passo fixo de 60 Hz e WebGL 2 foram confirmados.

### Primeira missão P1

- `Levantamento de Nereida` usa identidade original e conteúdo separado das regras;
- o domínio determinístico controla briefing, partida, levantamento, retorno e conclusão sem DOM, PlayCanvas, relógio global ou GPU;
- o scan existente identifica o contato-alvo e libera o retorno, sem duplicar a autoridade dos sensores;
- partida e retorno bloqueiam os controles de voo de modo explícito;
- a conclusão retorna à base, reinicia casco, energia e munição e permite repetir a missão;
- a HUD apresenta fase, objetivo e única ação contextual, com atributos estáveis para teste.

### Pendências da Etapa 6

- IndexedDB atrás de repositório e envelope versionado;
- autosave somente em estado seguro, retomada após reload e migração;
- recuperação visível de corrupção/quota;
- mapa setorial e apresentação gráfica da viagem.

### Verificação

- regras de missão cobertas por testes unitários, inclusive comandos fora de fase e entradas inválidas;
- ciclo integrado coberto em navegador real da partida à conclusão;
- nenhuma biblioteca ou carga gráfica foi adicionada;
- `npm run verify`: aprovado com 136/136 testes em 21 arquivos, lint, typecheck e build;
- Playwright completo: 42/42 casos em Chrome/Edge, um worker e nenhum `skip`;
- o teste de layout permanece verde em 1280×720 e 1600×900;
- capturas oficiais atualizadas e inspecionadas: ação da missão legível, centro tático livre e sem sobreposição nova;
- nenhum achado CRITICAL/HIGH; o aviso conhecido de chunk lazy do PlayCanvas continua não bloqueante.

## Relatório anterior — persistência local P1

**ETAPA:** P1 — segunda subfatia da Etapa 6  
**STATUS:** save da primeira missão, retomada e recuperação concluídos

### Implementado

- envelope v2 com timestamp ISO UTC, checksum, payload validado e migração sequencial da fixture v1;
- `SaveRepository` independente e adaptador IndexedDB com stores separados para snapshots e metadados;
- novo snapshot e ponteiro ativo gravados na mesma transação, preservando o anterior em falha e limitando o histórico a três registros;
- checkpoints seguros somente no briefing e após conclusão/reparo; reload durante a missão retorna ao briefing;
- save inválido ou incompatível é preservado, abre sessão segura e bloqueia autosave até recuperação explícita;
- mensagens de criação, retomada, migração, falha e recuperação ficam visíveis e acessíveis no HUD;
- o benchmark não abre nem altera o banco de progresso.

### Revisão e correções

O domínio da missão recebeu somente o checkpoint inicial e continua sem DOM, IndexedDB, PlayCanvas ou relógio global. A aplicação injeta o relógio e coordena os pontos seguros; a plataforma concentra o banco. A inicialização assíncrona revelou um teste antigo que enviava seleção antes do estado pronto; o teste passou a aguardar o contrato público do boot e voltou a passar nos dois navegadores. Nenhuma biblioteca ou carga gráfica foi adicionada e nenhum achado CRITICAL/HIGH permaneceu.

### Verificação

- `npm run verify`: 148/148 testes em 23 arquivos, lint, typecheck e build aprovados;
- testes sem GPU cobrem checksum, estrutura, versão futura, migração v1 → v2, conteúdo incompatível, leitura indisponível, corrupção e falha simulada de quota;
- Playwright completo: 46/46 casos em Chrome/Edge, um worker e nenhum `skip`;
- navegador real cobre criação, conclusão, reload, checkpoint seguro, corrupção do registro, preservação do original e recuperação explícita;
- o código principal cresceu aproximadamente 2,5 kB comprimidos; o chunk do engine permaneceu em 510,32 kB gzip;
- avisos conhecidos do chunk PlayCanvas e workers não usados permanecem não bloqueantes.

### Pendências da Etapa 6

- mapa de um sistema e apresentação gráfica da transição de viagem;
- configurações persistentes em registro/repositório separado do progresso;
- completar a recuperação de falha de asset no ciclo P1 antes do gate da etapa.

## Último relatório — campanha tutorial de três missões P1

**ETAPA:** P1 — variedade mínima de missões e tutorial contextual  
**STATUS:** três missões iniciais concluíveis, reiniciáveis e persistentes

### Implementado

- `Levantamento de Nereida` ensina seleção e scan com armas bloqueadas;
- `Socorro no Anel de Íris` ensina aproximação, energia auxiliar e raio trator, com contato passivo e armas ofensivas bloqueadas;
- `Defesa do Corredor Aurora` ensina gerenciamento de energia, escudos, feixe e torpedos contra contato hostil;
- uma campanha determinística orientada a dados controla ordem, objetivos, partida, retorno e conclusão sem depender de DOM, PlayCanvas, IndexedDB ou GPU;
- contatos passivos não perseguem nem atacam e usam material verde-azulado distinto do casco hostil;
- HUD exibe missão atual, posição `1/3` a `3/3`, instrução contextual, equipamentos permitidos e conclusão do treinamento;
- checkpoints `briefing` e `completed` continuam seguros; o schema v2 já comportava qualquer ID de missão e não exigiu migração artificial.

### Revisão e correções

As missões reutilizam sensores, raio trator, combate, energia, dano e reparo existentes sem duplicar suas regras. Eventos de objetivo só são aceitos para o contato configurado, na fase correta e uma única vez. O encontro recebeu perfis explícitos `passive` e `hostile`; atalhos de teclado também são rejeitados pelo domínio da aplicação quando o equipamento está bloqueado. O cenário E2E integral precisou de limite próprio de 60 s porque executa as três missões e um reload real; ambos os navegadores completaram o fluxo em menos de 40 s. Nenhuma dependência, asset externo, transparência, sombra ou entidade foi adicionada.

### Verificação

- testes focados: 22/22 para campanha, conteúdo, encontro e save;
- cenário E2E completo das três missões: 2/2 em Chrome/Edge;
- `npm run verify`: 151/151 testes em 24 arquivos, formatação, lint, typecheck e build aprovados;
- Playwright completo: 48/48 casos em Chrome/Edge, um worker e nenhum `skip`;
- capturas oficiais 1280×720 e 1600×900 atualizadas e inspecionadas sem sobreposição ou regressão de hierarquia;
- nenhum achado CRITICAL/HIGH identificado.

### Pendências do P1

- mapa de um sistema e apresentação gráfica da transição de viagem;
- configurações persistentes, escala do HUD e redução de flashes/tremor;
- áudio, diário de objetivo/descoberta mais completo, inventário de licenças e recuperação de falha de asset;
- benchmark de regressão e revisão formal final do MVP.

## Último relatório — base coerente, mapa e viagem P1-A

**ETAPA:** P1 — quarta subfatia da Etapa 6  
**STATUS:** base segura, mapa do Sistema Hélios e viagem setorial concluídos

### Implementado

- domínio determinístico de navegação com estados `base`, `map`, `travel` e `encounter`, rotas bidirecionais, falhas estruturadas e validação de conteúdo;
- Sistema Hélios com Base Aurora, três destinos próprios de missão e dois pontos de interesse, todos com IDs estáveis;
- mapa DOM navegável por teclado, foco restaurado ao fechar, objetivo destacado sem depender somente de cor e mensagem acionável para destino incorreto;
- viagem visual leve com origem, destino, distância, duração e progresso, integrada às fases `outbound` e `returning` da campanha;
- base realmente segura: encontro tático, IA, projéteis e VFX ficam indisponíveis; reparo, energia e munição são restaurados somente após o retorno;
- raízes gráficas fixas para base e bolha tática, alternadas sem alocar entidades por transição;
- contato e posição próprios para cada uma das três missões, sem alterar o schema v2 do save;
- reload em viagem ou encontro continua retornando ao checkpoint seguro de briefing.

### Revisão e correções

O mapa e a viagem preservam a autoridade do domínio e não introduzem coordenadas astronômicas, física, dependências ou assets externos. A inspeção visual em 1280×720 e 1600×900 confirmou mapa e transição contidos, legíveis e sem sobreposição. O ciclo completo revelou e corrigiu o posicionamento do diagnóstico depois da nova ação de mapa; um teste integrado também passou a reiniciar explicitamente o encontro após trocar seu perfil, conforme o contrato já usado pela aplicação. Nenhum achado CRITICAL/HIGH permaneceu.

### Verificação

- `npm run verify`: 158/158 testes em 26 arquivos, formatação, lint, typecheck e build aprovados;
- Playwright completo: 52/52 casos em Chrome/Edge, um worker e nenhum `skip`;
- navegador real cobre base → mapa → viagem → encontro → retorno, as três missões e reload nos estados transitórios;
- benchmark físico Chrome 151, WebGL 2, UHD 620, 1600×900/médio: 60,01 FPS médios, p95 de 17,4 ms e p99 de 18,0 ms;
- cena determinística permaneceu em 88 draw calls e 21 VFX ativos no pior caso medido; base/viagem registram zero VFX de combate;
- chunks principais: aplicação 28,48 kB gzip e engine 510,52 kB gzip;
- capturas `p1-system-map-1600x900.png` e `p1-travel-1280x720.png` geradas e inspecionadas.

### Pendências do P1

- P1-B: tela inicial e preparação/seleção na base;
- P1-C/P1-D: configurações persistentes, escala do HUD, redução de flashes/tremor/partículas e remapeamento essencial;
- P1-E a P1-G: diário, áudio, fallback de asset, inventário de licenças e créditos;
- P1-H: decisão offline/PWA, balanceamento, instalação limpa, benchmark e revisão formal final do MVP.

## Relatório anterior — menu inicial e comando da base P1-B

**ETAPA:** P1 — quinta subfatia da Etapa 6  
**STATUS:** menu inicial, proteção de progresso e preparação na base concluídos

### Implementado

- menu inicial modal com `Novo treinamento`, `Continuar`, `Configurações`, `Diagnóstico` e `Créditos e licenças`, usando controles HTML nativos;
- foco inicial e retorno por `Esc`, sem landmarks duplicados, com base/mapa/viagem/encontro inertes enquanto o menu está aberto;
- confirmação por `dialog` antes de substituir progresso existente; save novo não é regravado desnecessariamente;
- reinício determinístico da campanha, encontro, voo e VFX no primeiro briefing após confirmação;
- comando da Base Aurora com integridade, energia, torpedos, reparo/reabastecimento, próximo objetivo e estado das três missões;
- continuar preserva checkpoint carregado e save inválido permanece protegido até recuperação explícita;
- configurações e créditos possuem suas entradas próprias, deixando claro o que será concluído nas fatias P1-C e P1-G.

### Revisão e correções

O estado efêmero do menu foi extraído para a aplicação, sem mover campanha, save ou nave para a UI. O shell deriva telemetria e usa `textContent`; não há HTML não confiável, dependência ou asset externo novo. O gate completo encontrou uma regressão em que iniciar o primeiro treinamento regravava o save recém-criado; a recuperação passou a ocorrer somente quando existe progresso ou registro inválido a substituir. A inspeção visual confirmou hierarquia, foco e contenção nos dois viewports obrigatórios. Nenhum achado CRITICAL/HIGH permaneceu.

### Verificação

- `npm run verify`: 162/162 testes em 27 arquivos, formatação, lint, typecheck e build aprovados;
- testes novos cobrem transições do menu e reinício da campanha sem DOM/GPU;
- Playwright completo: 56/56 casos em Chrome/Edge, um worker e nenhum `skip`;
- navegador real cobre mouse, teclado, foco, `Esc`, bloqueio de comandos, continuar, confirmação, reinício e recuperação de save corrompido;
- benchmark físico Chrome 151, WebGL 2, UHD 620, 1600×900/médio: 60,011 FPS médios, p95 de 17,4 ms e p99 de 18,1 ms, com 88 draw calls e 21 VFX;
- aplicação principal: 30,79 kB gzip; engine permanece em 510,52 kB gzip;
- capturas `p1-main-menu-1280x720.png` e `p1-base-dashboard-1600x900.png` inspecionadas sem scroll ou sobreposição.

### Pendências do P1

- P1-C: configurações persistentes separadas do save, escala do HUD, volumes, redução de efeitos e controles essenciais;
- P1-D: acessibilidade prioritária e validação completa por teclado;
- P1-E a P1-G: diário, áudio, fallback de asset e inventário formal de licenças/créditos;
- P1-H: decisão offline/PWA, playtest, balanceamento, instalação limpa, benchmark e revisão formal final do MVP.

## Relatório anterior — configurações persistentes P1-C

**ETAPA:** P1 — sexta subfatia da Etapa 6  
**STATUS:** configurações persistentes, recuperação segura e aplicação real concluídas

### Implementado

- schema v1 validado e repositório `localStorage` exclusivo para preferências, sem incluir configuração no save IndexedDB da campanha;
- preset gráfico, escala do HUD, volumes geral/efeitos/ambiente, redução de flashes, tremor e partículas, sensibilidade, inversão vertical e cinco teclas táticas essenciais persistentes;
- preset escolhido aplicado no próximo carregamento com aviso explícito; HUD, entrada e reduções visuais aplicados imediatamente;
- restauração de padrões e recuperação visível de JSON, versão ou valores inválidos, preservando o registro até uma ação explícita;
- teclas remapeáveis limitadas a uma lista segura, sem colisões entre comandos e sem conflito com voo, pausa, tela cheia ou reinício;
- benchmark continua sem abrir ou alterar configurações e save do jogador.

### Revisão e correções

A configuração permanece na aplicação/plataforma: o domínio não lê DOM, armazenamento ou relógio. O adaptador PlayCanvas reduz entidades de brilho, efeitos simultâneos, partículas de dano e tremor de câmera; a opção não é apenas textual. A escala ampliada revelou colisões entre o painel central e os trilhos laterais em 1280×720; larguras condicionais mantêm base e barras táticas dentro da faixa central em 110%. Uma referência obsoleta do menu também foi removida após o primeiro boot E2E bloqueado. Nenhum asset, dependência, serviço, analytics ou conteúdo externo foi adicionado, e nenhum achado CRITICAL/HIGH permaneceu.

### Verificação

- `npm run test:run`: 173/173 testes em 30 arquivos;
- testes sem GPU cobrem defaults, round-trip v1, versão futura, opções/faixas desconhecidas, teclas conflitantes, JSON malformado, falha de armazenamento, restauração e sensibilidade/inversão;
- Playwright completo: 62/62 casos em Chrome/Edge; a cobertura nova valida persistência após reload, independência do checkpoint, recuperação inválida, remapeamento real, VFX reduzido e HUD 110% em 1280×720/1600×900;
- benchmark físico Chrome 151, WebGL 2, UHD 620, 1600×900/médio: 60,012 FPS médios, p50 de 16,6 ms, p95 de 17,8 ms e p99 de 19,1 ms, com 88 draw calls e 21 VFX;
- aplicação principal: 33,13 kB gzip; engine: 510,69 kB gzip; captura `p1-settings-1280x720.png` inspecionada com foco, valores e aviso de reload visíveis.

### Pendências do P1

- P1-D: revisão de acessibilidade prioritária, teclado completo, semântica, anúncios, contraste e movimento;
- P1-E a P1-G: diário, áudio, fallback de asset e inventário formal de licenças/créditos;
- P1-H: decisão offline/PWA, playtest, balanceamento, instalação limpa, matriz/benchmark final e revisão formal do MVP.

## Relatório anterior — acessibilidade prioritária P1-D

**ETAPA:** P1 — sétima subfatia da Etapa 6  
**STATUS:** teclado, foco, semântica, anúncios, contraste e layout acessível concluídos

### Implementado

- menu e mapa mantêm foco dentro da superfície modal e tornam o restante do jogo inerte;
- foco segue explicitamente base → mapa → viagem → canvas e retorna ao controle de origem ao fechar;
- canvas recebe nome, ajuda de teclado e foco visível; mapa, missão, contato e energia possuem landmarks/nome acessível;
- escudos direcionais, subsistemas e canais de energia publicam nomes completos, percentuais e condição textual, preservando informação sem vermelho/verde;
- regiões `aria-live` separadas anunciam objetivo, feedback novo, erro e resultado terminal por chaves deduplicadas, sem mutação durante telemetria estável;
- teclas persistidas atualizam imediatamente botões, `aria-keyshortcuts`, feedback de chegada e instruções das três missões;
- suporte a `prefers-reduced-motion` foi preservado e `forced-colors` recebeu foco, contorno e estados selecionados explícitos;
- em HUD 110%, a barra tática usa duas linhas somente quando necessário para manter rótulos e atalhos visíveis.

### Revisão e correções

A auditoria encontrou dois problemas funcionais: atalhos remapeados funcionavam, mas a interface e o tutorial ainda exibiam as teclas padrão; após confirmar viagem, o foco podia permanecer em um botão oculto do mapa e fazer o controlador ignorar teclas por tratá-lo como alvo interativo. Tokens simbólicos no conteúdo e a transferência de foco corrigem os dois sem levar DOM ou configuração ao domínio. A primeira captura 1280×720/110% revelou truncamento LOW nos botões táticos; a barra ampliada foi reorganizada em duas linhas e reinspecionada. Um conflito inicial entre a região urgente e o seletor do alerta real de WebGL também foi corrigido mantendo `aria-live="assertive"` sem criar um segundo `role="alert"`. Nenhum achado CRITICAL/HIGH permanece.

### Verificação

- `npm run verify`: aprovado com 174/174 testes em 30 arquivos, formatação, lint, TypeScript e build;
- teste sem GPU novo cobre formatação de instruções a partir dos bindings validados;
- Playwright completo: 70/70 casos em Chrome/Edge, um worker e nenhum `skip`;
- E2E novo cobre menu/configurações/créditos/diagnóstico, base, mapa, viagem, encontro, energia e pausa somente por teclado; foco modal; nomes; atalhos dinâmicos; anúncio de objetivo/feedback sem mutações em repouso; e contraste textual WCAG AA nos presets baixo/médio/alto;
- perda de foco, liberação de ponteiro, reduções reais de flash/tremor/partículas e HUD 110% continuam cobertos pela matriz;
- inspeção de `docs/screenshots/p1-accessibility-hud-1280x720.png`: rótulos completos, foco de 3 px, centro tático livre, zero scroll/interseção;
- benchmark físico Chrome 151, UHD 620, WebGL 2, 1600×900/médio: 60,011 FPS médios, p50 16,7 ms, p95 18,2 ms e p99 20,8 ms, com 88 draw calls e 21 VFX;
- aplicação principal: 34,16 kB gzip; engine permanece em 510,69 kB gzip; avisos conhecidos de chunk/workers continuam não bloqueantes.

### Pendências do P1

- P1-E: diário mínimo de objetivo e descobertas, idempotente e persistente;
- P1-F: áudio original/licenciado, volumes, descarte e fallback visual;
- P1-G: fallback de asset, manifesto, inventário formal de licenças e créditos;
- P1-H: decisão offline/PWA, playtest, balanceamento, instalação limpa e revisão formal final do MVP.

## Relatório anterior — diário de objetivos e descobertas P1-E

**ETAPA:** P1 — oitava subfatia da Etapa 6  
**STATUS:** diário mínimo local, idempotente, acessível e persistente por checkpoint concluído

### Implementado

- projeção pura `mission-journal.ts` valida conteúdo e produz objetivo atual, progresso e uma entrada única por missão;
- cada uma das três missões recebeu uma descoberta original em português brasileiro, liberada somente após conclusão;
- estados concluído, atual e bloqueado usam texto explícito e não dependem apenas da cor da borda;
- menu principal oferece `Diário de missão`; a Base Aurora abre diretamente a mesma visão por teclado ou mouse;
- progresso e `progress` acessível mostram de `0/3` a `3/3`, com objetivo atual formatado pelos bindings ativos;
- o shell usa `textContent` e chave estrutural para não reconstruir a lista durante publicações idênticas a 8 Hz;
- ID desconhecido, definição duplicada ou snapshot incompatível retorna mensagem segura e não expõe/inventa registro.

### Decisão de persistência

O schema permanece v2. A campanha linear já persiste `missionId` e `checkpoint`; missões anteriores ao checkpoint, e a missão atual quando concluída, formam exatamente o conjunto de descobertas registradas. Não existe array paralelo para duplicar, divergir ou migrar. A migração v1 → v2 continua intacta e uma futura campanha ramificada exigirá decisão/modelo novos antes de alterar o payload.

### Revisão e evidência visual

A revisão não encontrou problema CRITICAL/HIGH. A captura `docs/screenshots/p1-journal-1280x720.png` confirma três cartões legíveis, objetivo, barra `3/3`, botão de retorno e ausência de corte/overlap. `p1-main-menu-1280x720.png` e `p1-base-dashboard-1600x900.png` confirmam os dois acessos sem regressão de hierarquia ou centro tático.

### Verificação

- `npm run verify`: aprovado com 177/177 testes em 31 arquivos, formatação, lint, TypeScript e build;
- testes sem GPU cobrem progresso parcial, `3/3`, idempotência, IDs únicos, conteúdo desconhecido, duplicado e snapshot inconsistente;
- Playwright completo: 72/72 casos em Chrome/Edge, um worker e nenhum `skip`;
- E2E novo cobre `0/3`, `3/3`, associação das três descobertas, reload sem duplicação, abertura pelo menu/base e foco;
- benchmark físico Chrome 151, UHD 620, WebGL 2, 1600×900/médio: 60,012 FPS médios, p50 16,6 ms, p95 19,0 ms e p99 20,3 ms, com 88 draw calls e 21 VFX;
- aplicação principal: 35,18 kB gzip; engine permanece em 510,69 kB gzip; avisos conhecidos de chunk/workers continuam não bloqueantes.

### Pendências do P1

- P1-F: áudio original/licenciado, volumes, descarte e fallback visual;
- P1-G: fallback de asset, manifesto, inventário formal de licenças e créditos;
- P1-H: decisão offline/PWA, playtest, balanceamento, instalação limpa e revisão formal final do MVP.

## Relatório anterior — áudio e feedback P1-F

**ETAPA:** P1 — nona subfatia da Etapa 6  
**STATUS:** áudio procedural original, limitado, persistente e recuperável concluído

### Implementado

- roteador puro observa apenas snapshots públicos e emite sinais idempotentes para seleção, scan concluído, feixe, lançamento/impacto de torpedo, trator, escudo/casco, energia/recarga, objetivo, vitória/derrota, partida, viagem e retorno;
- backend Web Audio preguiçoso cria o contexto somente em gesto explícito e sintetiza sequências próprias com osciladores, sem arquivo, voz, música, biblioteca ou conteúdo de Star Trek;
- ambientes discretos de base, viagem e encontro são substituídos sem sobreposição; efeitos têm teto rígido de dez vozes lógicas;
- mute, pausa, perda de foco, mudança de estado e descarte encerram fontes e removem referências; falha ou API ausente mantém o jogo ativo e mostra orientação;
- volumes geral/efeitos/ambiente alimentam ganhos separados; `audioMuted` persistente elevou preferências ao schema v2 com migração automática e segura do v1;
- reserva baixa ganhou aviso textual explícito; feedback, HUD, transição, objetivo e resultado continuam alternativas visuais para os sinais importantes.

### Revisão e correções

O áudio permanece adaptador: não altera dano, missão, energia, navegação ou save. O primeiro gate completo revelou somente que o cenário E2E de vitória, já próximo do limite global quando executado em paralelo, terminava as asserções após 30 s nos dois navegadores; a página já havia vencido e reiniciado. O caso longo recebeu limite explícito de 60 s, sem afrouxar nenhuma asserção, e passou novamente. A inspeção da tela de configurações em 1280×720 confirmou controles e status legíveis, sem sobreposição. Nenhum achado CRITICAL/HIGH permanece.

### Verificação

- `npm run verify`: aprovado com 188/188 testes em 33 arquivos, formatação, lint, TypeScript e build;
- testes sem GPU cobrem transições/deduplicação, limites de energia, teto e descarte de vozes, mute, pausa, backend ausente/falho, schema v2 e migração v1 → v2;
- Playwright completo: 76/76 casos em Chrome/Edge, sem `skip`; criação zero antes do gesto, ativação, mute/reload, ausência de Web Audio, pausa e jogo completo permanecem cobertos;
- benchmark físico Chrome 151, UHD 620, WebGL 2, 1600×900/médio: 60,013 FPS médios, p50 16,7 ms, p95 18,8 ms e p99 20,1 ms, com 88 draw calls e 21 VFX;
- aplicação principal: 38,54 kB gzip; engine permanece em 510,69 kB gzip; nenhum asset externo ou dependência foi adicionado.

### Pendências do P1

- P1-G: manifesto, carregamento/fallback de asset e inventário formal de licenças/créditos;
- P1-H: decisão offline/PWA, playtest, balanceamento, instalação limpa, matriz/benchmark final e revisão formal do MVP.

## Relatório anterior — assets, falhas, licenças e créditos P1-G

**ETAPA:** P1 — décima subfatia da Etapa 6  
**STATUS:** manifesto, carregamento resiliente, inventário e créditos concluídos

### Implementado

- `public/assets/asset-manifest.json` registra o primeiro asset real do build, um emblema SVG original do Comando Estelar, com ID lógico, caminho relativo, tipo, tamanho, SHA-256, dependências, autoria, origem, licença e data;
- schema TypeScript estrito valida campos exatos, versão, IDs, caminhos seguros, tipos permitidos, tamanho, hash, datas, dependências existentes/sem ciclo e orçamento total de 60 MB;
- carregador atômico resolve manifesto e arquivos por `document.baseURI`, valida HTTP, MIME, bytes e SHA-256 antes de publicar URLs de objeto, deduplica cargas concorrentes e revoga recursos no descarte;
- falha de manifesto/asset não bloqueia cena, save ou menus: o emblema usa substituto CSS, o status explica a falha e a interface oferece nova tentativa sem recarregar a página;
- `npm run assets:check`, integrado ao build, reprova asset ausente, extra, adulterado, incompatível ou sem atribuição e verifica licença compatível da dependência direta de runtime;
- créditos acessíveis e `docs/ASSET_LICENSES.md` inventariam o SVG próprio, recursos procedurais, PlayCanvas e dependências diretas, deixando explícito que o projeto continua `private` e `UNLICENSED` e não contém conteúdo de Star Trek.

### Revisão e correções

O manifesto permanece uma fronteira de conteúdo e o carregador, um adaptador de engine; domínio e save não ganharam dependência de DOM, rede ou PlayCanvas. A carga é transacional: nenhuma URL parcial fica disponível quando um item falha. Caminhos absolutos, travessia, tipo divergente, tamanho/hash adulterados e ciclos são rejeitados. A inspeção real do menu em 1280×720 confirmou emblema, fallback textual, status e créditos legíveis, sem sobreposição. Os nove screenshots E2E foram regenerados com o build aprovado. Nenhum achado CRITICAL/HIGH permanece; os avisos conhecidos de workers externalizados e chunk do engine continuam não bloqueantes.

### Verificação

- `npm run verify`: aprovado com 198/198 testes em 35 arquivos, formatação, lint, TypeScript, validação de assets e build;
- testes focados: 10/10 cobrem schema, dependências, adulteração, lote atômico, deduplicação, descarte, retry e resolução sob caminho base;
- Playwright completo: 78/78 casos em Chrome/Edge, sem `skip`; o novo fluxo simula manifesto indisponível, confirma jogo operacional/fallback e recupera o asset sem reload;
- benchmark físico Chrome 151, UHD Graphics 620, WebGL 2, 1600×900/médio: 60,011 FPS médios, p50 16,6 ms, p95 18,3 ms e p99 20,4 ms, com 88 draw calls e 21 VFX;
- build distribuído: 1 asset de 1.107 bytes verificado; total descompactado de 2.187.154 bytes; aplicação principal 41,46 kB gzip e engine 510,69 kB gzip.

### Pendências do P1

- P1-H: registrar decisão offline/PWA, executar playtest e balanceamento, validar instalação limpa, repetir matriz/benchmark final e realizar a revisão formal do MVP.

## Último relatório — gate técnico final P1-H

**ETAPA:** P1 — décima primeira subfatia da Etapa 6  
**STATUS:** gate técnico aprovado; playtest humano e revisão formal pendentes

### Implementado e decidido

- `DECISION-038` mantém o MVP sem PWA/service worker: o jogo é servido localmente por `ABRIR_JOGO.bat`, não depende da internet em runtime e evita cache obsoleto antes de existir estratégia pública de hospedagem/atualização;
- `npm run offline:check`, integrado ao build, valida limite de 60 MB, referências locais existentes e ausência de registro de service worker;
- `postinstall` grava o hash do lockfile usado por `ABRIR_JOGO.bat`, de modo que uma instalação válida possa iniciar offline sem reinstalação;
- E2E novo corta a rede após a carga, conclui a primeira missão, grava IndexedDB, reativa a conexão e confirma reload do save sem requisição externa ou erro de console;
- teste de encontro prova vitória usando apenas o feixe e preservando os seis torpedos, garantindo alternativa quando o jogador não quiser ou não puder usar munição;
- roteiro humano e critérios de aprovação foram registrados em `docs/PLAYTEST_P1.md`.

### Revisão e correções

A primeira matriz completa encontrou um caso no Chrome em que `Esc` não liberou o ponteiro: o foco permanecia no botão de captura e a entrada descartava a tecla por vir de um elemento interativo, dependendo da ação nativa do navegador. O manipulador agora prioriza `Esc` quando o canvas possui pointer lock. A correção passou três repetições no Chrome e três no Edge e depois integrou a matriz final 80/80. A revisão de softlocks confirmou feixe sem munição, reinício após derrota/vitória, retorno seguro, reload transitório, campanha reiniciável e liberação de controles. Nenhum achado CRITICAL/HIGH permanece.

### Verificação técnica

- instalação limpa: `npm ci` com Node 22.23.2, 138 pacotes instalados a partir do lockfile;
- `npm run verify`: 199/199 testes em 35 arquivos, formatação, lint, TypeScript, assets, build e validação offline aprovados;
- `npm audit --offline --audit-level=high`: zero vulnerabilidades encontradas;
- Playwright final: 80/80 casos, Chrome 40/40 e Edge 40/40, um worker e nenhum `skip`;
- inspeção visual: menu 1280×720 e base/HUD 1600×900 legíveis, contidos e sem sobreposição;
- benchmark físico Chrome 151, UHD Graphics 620, WebGL 2, 1600×900/médio: 60,019 FPS médios, p50 16,7 ms, p95 20,8 ms e p99 24,3 ms, com 88 draw calls e 21 VFX;
- build: seis arquivos, 2.187.173 bytes descompactados, aplicação 41,46 kB gzip e engine 510,69 kB gzip; dois avisos PlayCanvas/Vite conhecidos continuam não bloqueantes.

### Pendência para aprovar o MVP

- executar `docs/PLAYTEST_P1.md` com uma pessoa que não conheça os controles, registrar a evidência e submeter o resultado à revisão formal. Automação não substitui esse critério de compreensão.
