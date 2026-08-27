# Progresso do projeto

Atualizado em: 27 de agosto de 2026  
Etapa atual: P0.4 — Estabilização do encontro tático  
Estado do código: correções do ciclo 2 concluídas e matriz técnica verde; revisão formal do P0.4 pendente  
Próximo responsável: Product Architect / Reviewer

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
- [~] Revisão do Product Architect e gate completo

### UI-1 Apresentação tática prioritária

- [x] Tema sci-fi naval original e tokens acessíveis
- [x] HUD distribuído nas bordas e centro livre
- [x] EnergyDrawer e DiagnosticsDrawer recolhíveis
- [x] Câmera externa, starfield instanciado, retículo e marcador seguro
- [x] Layout sem scroll/overlap em 1280×720 e 1600×900
- [x] E2E focado em Chrome/Edge e inspeção visual
- [~] Revisão do Product Architect pendente

### UI-GFX Polimento gráfico de apresentação

- [x] Materiais e iluminação naval sci-fi originais sem assets externos
- [x] Silhuetas legíveis, três estados visuais de dano e starfield instanciado
- [x] Feixe, torpedo, trator, impactos e escudo em pool fixo
- [x] Dois efeitos de combate simultâneos no adaptador, sem alterar o domínio
- [x] Inspeção real e capturas em 1280×720 e 1600×900
- [~] Revisão gráfica pendente; não equivale ao gate/benchmark P0.5

### P0.5 Dano visual e benchmark

- [ ] Estados de dano e efeitos limitados
- [ ] Cenário determinístico
- [ ] Perfis baixo/médio/alto
- [ ] Benchmark MX130/UHD 620 e WebGL 2/WebGPU
- [ ] Gate formal do P0

## P1 — Vertical slice/MVP

- [ ] Primeira missão ponta a ponta
- [ ] Base funcional e viagem
- [ ] Save IndexedDB versionado
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

Nenhum bloqueio real para iniciar P0.1. Antes de publicar, será bloqueante confirmar identidade original/licença e auditar todos os assets. Antes de avançar ao P1, será bloqueante cumprir ou renegociar formalmente o gate de desempenho da MX130.

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

## Último relatório — P0.4 ciclo 2

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
