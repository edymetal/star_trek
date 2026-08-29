# Progresso do projeto

Atualizado em: 29 de agosto de 2026  
Etapa atual: P1 — Primeira fatia vertical  
Estado do código: P0.5 aprovado; primeira missão e persistência local do progresso concluídas  
Próximo responsável: Senior Developer / mapa de sistema e apresentação da viagem

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

- [x] Primeira missão ponta a ponta em uma sessão
- [~] Base funcional e viagem — partida, retorno, reparo/reabastecimento e transição implementados; mapa ainda pendente
- [x] Save IndexedDB versionado
- [ ] Missões de assistência e combate
- [ ] Tutorial, áudio e acessibilidade prioritária
- [ ] Inventário de licenças
- [ ] E2E, benchmark e revisão final do MVP

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

## Último relatório — persistência local P1

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
