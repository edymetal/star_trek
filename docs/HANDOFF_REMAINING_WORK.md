# Handoff para finalizar o projeto

Atualizado em: 31 de agosto de 2026  
Branch esperada: `main`  
Baseline anterior ao P1-A: commit `f9750ee` (`feat: adicionar campanha tutorial de tres missoes`)  
Marco atual: P1-C concluída; consulte o último relatório em `docs/PROGRESS.md`

## 1. Finalidade deste documento

Este arquivo orienta outra IA ou pessoa desenvolvedora a continuar o projeto sem refazer sistemas concluídos, romper decisões aceitas ou confundir o MVP com a expansão futura do jogo.

Existem dois alvos diferentes:

1. **Finalizar o MVP P1:** entregar uma versão pequena, demonstrável, gratuita, local, estável e completa em qualidade básica. Este é o trabalho obrigatório e imediato.
2. **Expandir o jogo depois do MVP:** adicionar mais sistemas, bases, naves, missões e progressão. Esse conteúdo pertence ao P2/P3 e não deve bloquear o fechamento do P1.

Ao receber uma solicitação genérica como “continue” ou “finalize o jogo”, conclua primeiro todo o P1 descrito nas seções 5 a 13. Não inicie P2/P3 enquanto houver item P1 obrigatório, teste quebrado ou problema CRITICAL/HIGH.

## 2. Instrução curta para a próxima IA

Use este texto como prompt inicial:

> Continue o projeto a partir de `docs/HANDOFF_REMAINING_WORK.md`. Leia integralmente `AGENTS.md` e todas as fontes canônicas na ordem indicada antes de alterar código. Trabalhe uma fatia vertical por vez, preserve as decisões aceitas, não refaça o P0 nem as fatias P1-A/P1-B/P1-C concluídas e não adicione conteúdo de Star Trek. Implemente primeiro o P1-D e depois os itens P1 obrigatórios na ordem do handoff. Para cada fatia, crie testes sem GPU para regras, E2E em Chrome/Edge para fluxos visuais, execute `npm run verify` e os testes E2E relevantes, atualize a documentação e faça commit/push somente quando o gate estiver verde. Não publique nem faça deploy sem autorização explícita.

## 3. Fontes de verdade e ordem de leitura

Antes de implementar qualquer item, leia completamente:

1. `AGENTS.md`;
2. `docs/PROGRESS.md`;
3. `docs/MVP.md`;
4. `docs/PRODUCT_SPEC.md`;
5. `ARCHITECTURE.md`;
6. `docs/DECISIONS.md`;
7. `docs/ASSUMPTIONS.md`;
8. `docs/ROADMAP.md`;
9. `PLANEJAMENTO.md`;
10. este handoff.

Em conflito, a solicitação explícita mais recente do usuário vence. Atualize os documentos canônicos afetados e registre em `docs/DECISIONS.md` qualquer alteração arquitetural relevante.

## 4. Estado que já está concluído — não refazer

O P0 está aprovado e não deve ser reimplementado:

- TypeScript estrito, Vite e PlayCanvas Engine standalone;
- execução estática no navegador, sem backend, conta ou serviço pago;
- WebGL 2 como baseline e WebGPU apenas experimental;
- diagnóstico de GPU/renderizador e presets baixo, médio e alto;
- voo cinemático com passo fixo, câmera externa, pausa, foco, ponteiro e tela cheia;
- arena 3D com starfield, asteroides, estrela, planeta, lua, base e naves procedurais;
- energia distribuída entre motores, escudos, armas e auxiliares;
- sensores, seleção de contato, memória sensorial e scan;
- feixe, torpedos e raio trator;
- escudos direcionais, casco, subsistemas e dano visual por seção;
- IA hostil, perfis passivos, vitória, derrota e reinício;
- HUD tático nas bordas com centro livre e drawers de energia/diagnóstico;
- VFX com pools e limites, LOD, instancing e cenário de benchmark;
- execução pelo `ABRIR_JOGO.bat` e benchmark pelo `EXECUTAR_BENCHMARK.bat`;
- save IndexedDB v2 com checksum, snapshots transacionais, migração v1 → v2, limite de três registros, recuperação explícita e checkpoints seguros;
- campanha tutorial persistente com três missões:
  - `Levantamento de Nereida`: seleção e scan, sem armas;
  - `Socorro no Anel de Íris`: sensores, aproximação e raio trator;
  - `Defesa do Corredor Aurora`: energia, escudos, feixe e torpedos;
- teste integral das três missões e retomada do checkpoint final.
- Sistema Hélios com base, três setores de missão, dois pontos de interesse e rotas validadas;
- mapa acessível, apresentação de viagem e estados distintos de base/mapa/trânsito/encontro;
- base segura e raízes gráficas fixas, sem IA, projéteis ou VFX fora da bolha tática;
- contatos e posições próprios por missão, com checkpoints transitórios ainda retornando ao briefing.

Gate atual verificado após o P1-C:

- testes: 173/173 em 30 arquivos;
- Playwright: 62/62 casos em Chrome e Edge no gate P1-C;
- benchmark físico aprovado na UHD 620/médio, 1600×900, WebGL 2: 60,012 FPS médios e p99 de 19,1 ms;
- nenhum achado CRITICAL/HIGH conhecido;
- chunk do engine em aproximadamente 510,69 kB gzip.

Os totais de testes podem crescer. Eles são uma referência, não um motivo para remover ou esconder novos testes.

## 5. Ordem obrigatória do trabalho restante do P1

Execute na ordem abaixo, salvo nova prioridade explícita do usuário:

1. [x] coerência do estado de base, mapa do sistema e apresentação da viagem;
2. [x] tela inicial e fluxo base/preparação/seleção de missão;
3. [x] configurações persistentes e controles essenciais;
4. acessibilidade prioritária;
5. diário de objetivos e descobertas;
6. áudio e feedback final;
7. carregamento, manifesto e recuperação de falha de assets;
8. inventário de licenças e créditos;
9. decisão medida sobre PWA/cache offline;
10. balanceamento, benchmark de regressão, matriz E2E e revisão formal do MVP;
11. preparação para publicação, somente após autorização explícita.

Cada item deve ser entregue como uma fatia vertical pequena, testada e documentada. Não criar diretórios vazios ou infraestrutura de fases futuras.

## 6. Fatia P1-A — base coerente, mapa e viagem — concluída

### Situação resolvida

A campanha possuía fases lógicas de partida e retorno, mas a viagem era apenas uma transição temporal curta e não existia mapa navegável. O P1-A adicionou o Sistema Hélios, destinos e contatos próprios, mapa por teclado, apresentação de viagem e separação gráfica entre base e bolha tática. A base agora mantém encontro pausado, controles de combate indisponíveis e zero projétil/VFX ativo.

### Criar

- modelo de domínio para um único sistema estelar artístico:
  - IDs estáveis para base, local da missão e pelo menos dois pontos de interesse;
  - nós e rotas lógicas, distância/duração configurável e destino atual;
  - estado de base, mapa, viagem e bolha tática sem usar coordenadas astronômicas reais;
- conteúdo validado em `src/content`, separado do estado mutável;
- painel ou tela de mapa acessível por teclado, com rota atual, destino e objetivo;
- apresentação visual leve da viagem/dobra/carregamento;
- integração das fases `outbound` e `returning` da campanha com a rota escolhida;
- estado de base realmente seguro:
  - sem IA hostil, projéteis ou dano;
  - controles de combate indisponíveis quando não há encontro;
  - nave reparada, energia restaurada e torpedos reabastecidos somente ao concluir o retorno;
- transição de arena/setor que não mantenha entidades ou VFX antigos vivos;
- mensagens acionáveis se o destino ou conteúdo da rota for inválido.

### Não criar

- universo contínuo 1:1;
- física orbital;
- planetas em escala real;
- pouso, interiores caminháveis ou multiplayer;
- motor de física novo sem necessidade medida;
- múltiplos sistemas antes de o primeiro mapa passar nos gates.

### Arquivos prováveis

- novo domínio pequeno em `src/domain/navigation/` ou equivalente;
- definições em `src/content/system-content.ts`;
- orquestração em `src/application/bootstrap.ts` ou sessão própria extraída quando a responsabilidade justificar;
- UI em `src/ui/app-shell.ts` e `src/styles/global.css`;
- apresentação em `src/engine/create-arena-scene.ts`, preferindo extrair um módulo somente se reduzir responsabilidade real;
- testes unitários próximos do domínio e E2E em `tests/e2e/`.

### Critérios de aceitação

- o jogador parte da base, abre/consulta o mapa, viaja, entra no encontro, resolve o objetivo, retorna e vê a base segura;
- o estado lógico da rota é testado sem GPU, DOM ou relógio global;
- reload durante viagem ou encontro retoma o último checkpoint seguro previsto, sem inventar checkpoint intermediário;
- nenhuma entidade/VFX cresce a cada ida e volta;
- HUD permanece sem scroll ou sobreposição em 1280×720 e 1600×900;
- Chrome e Edge passam o ciclo completo das três missões.

### Gate realizado

- domínio e conteúdo de navegação cobertos sem GPU, inclusive entradas e rotas inválidas;
- ciclo base → mapa → viagem → encontro → retorno aprovado nos dois navegadores;
- reload em viagem e encontro volta ao briefing seguro;
- matriz completa 52/52, `npm run verify` 158/158 e benchmark UHD 620/médio aprovado;
- capturas 1280×720 e 1600×900 inspecionadas sem scroll ou sobreposição;
- decisão arquitetural registrada em `DECISION-031`.

## 7. Fatia P1-B — tela inicial e base funcional — concluída

### Situação resolvida

O aplicativo agora abre em menu modal próprio antes de liberar a sessão. Continuar respeita o checkpoint válido, novo treinamento exige confirmação quando há progresso, e a Base Aurora apresenta serviços, recursos, sequência das três missões e partida sem expor controles táticos.

### Criar

- tela inicial com ações nativas e navegáveis por teclado:
  - iniciar novo treinamento;
  - continuar save válido;
  - abrir configurações;
  - abrir diagnóstico;
  - abrir créditos/licenças;
- confirmação antes de substituir progresso válido ao iniciar novamente;
- tela/painel de base com:
  - integridade da nave;
  - energia, munição e reparo/reabastecimento concluídos;
  - objetivo seguinte e estado das três missões;
  - preparação ou confirmação de partida;
- distinção visual e semântica entre base, mapa, viagem e encontro;
- estados de carregamento, save indisponível e recuperação sem tela preta;
- foco inicial correto, retorno com `Esc` quando apropriado e sem landmarks ARIA duplicados.

### Critérios de aceitação

- toda ação funciona com teclado e mouse;
- continuar carrega o checkpoint correto;
- novo treinamento não apaga save sem confirmação explícita;
- menus não permitem que comandos de voo/combate vazem para a sessão;
- fluxo é coberto por E2E em Chrome e Edge.

### Gate realizado

- máquina de estado do menu coberta sem DOM, incluindo abertura, fechamento, detalhes e retorno por `Esc`;
- novo treinamento reinicia campanha e encontro, mas só substitui progresso existente após confirmação explícita;
- base apresenta integridade, energia, munição, serviços concluídos, objetivo seguinte e estado das três missões;
- menu torna base/mapa/viagem/encontro inertes e libera foco/ponteiro, impedindo vazamento de voo ou combate;
- carregamento, save válido, save inválido e recuperação permanecem visíveis e acionáveis;
- inspeção 1280×720 e 1600×900 aprovada nas capturas `p1-main-menu-1280x720.png` e `p1-base-dashboard-1600x900.png`;
- decisão arquitetural registrada em `DECISION-032`.

## 8. Fatia P1-C — configurações persistentes — concluída

### Criar

- repositório de configurações separado do progresso da campanha;
- schema versionado e validação de fronteira;
- persistência de, no mínimo:
  - preset gráfico;
  - escala do HUD;
  - volume geral, efeitos e música/ambiente;
  - redução de flashes;
  - redução de tremor de câmera;
  - redução ou limite de partículas;
  - sensibilidade do mouse;
  - inversão vertical, se exposta;
  - remapeamento dos comandos essenciais definido no MVP;
- ação para restaurar padrões;
- recuperação visível de configuração inválida sem afetar o save;
- aplicação imediata quando for seguro e indicação clara quando recarregar for necessário.

### Restrições

- não colocar configurações dentro do envelope de progresso;
- não ler IndexedDB, DOM ou relógio no domínio;
- não remover o fallback WebGL 2;
- não alterar preferências de GPU do Windows;
- não adicionar framework de estado/UI sem ADR e benefício medido.

### Critérios de aceitação

- configurações sobrevivem a reload e não alteram o checkpoint da campanha;
- valores desconhecidos ou fora da faixa usam recuperação segura;
- mudança de escala não cria scroll/overlap nos dois viewports obrigatórios;
- redução de efeitos realmente afeta apresentação, não apenas o texto da opção;
- testes cobrem defaults, round-trip, versão inválida e recuperação.

### Gate realizado

- envelope v1 e `localStorage` exclusivos, com defaults, round-trip, versão futura, faixas/opções inválidas e falhas cobertos sem GPU;
- preset, HUD, volumes, reduções, mouse e teclas sobrevivem ao reload sem alterar o checkpoint IndexedDB;
- configuração inválida permanece preservada até ação explícita, com padrões seguros e mensagem visível;
- HUD 110% permanece contido e sem interseções em 1280×720/1600×900; remapeamento funciona no encontro real;
- redução de flashes/tremor/partículas altera entidades e câmera da cena; Chrome/Edge validam VFX limitado;
- benchmark UHD 620/médio permanece acima do gate e a decisão arquitetural está em `DECISION-033`.

## 9. Fatia P1-D — acessibilidade prioritária

### Criar ou concluir

- escala do HUD com limites seguros;
- redução de flashes, tremor e partículas conectada aos efeitos reais;
- alternativa textual/geométrica para informação crítica que hoje use cor;
- foco visível e ordem de tabulação consistente em todos os menus/drawers;
- nomes acessíveis para mapa, objetivos, contatos, energia e botões de combate;
- anúncio controlado de mudança de objetivo, erro e conclusão, sem inundar leitores de tela;
- atalhos essenciais remapeáveis sem conflito ou tecla presa;
- pausa e liberação de ponteiro ao perder foco preservadas;
- revisão de contraste e legibilidade em baixo/médio/alto.

### Critérios de aceitação

- todas as telas e ações obrigatórias são concluíveis apenas por teclado;
- nenhum estado crítico depende somente de vermelho/verde;
- HUD em 1280×720 continua inteiramente dentro do viewport na maior escala suportada ou oferece estratégia documentada sem cobrir o centro tático;
- testes automatizam semântica e layout possível; inspeção manual cobre movimento, flashes e leitura visual.

## 10. Fatia P1-E — diário de objetivo e descobertas

### Criar

- diário simples, local e orientado a dados;
- objetivo atual, missões concluídas e descobertas mínimas das três missões;
- entradas idempotentes: repetir ou recarregar uma missão não pode duplicar registros;
- texto original em português brasileiro;
- integração com save somente se o payload realmente precisar mudar.

### Decisão de save

Se o formato do payload mudar, criar schema v3, migração sequencial v2 → v3 e testes. Não modificar silenciosamente o significado de v2. Preservar saves v1 e v2 suportados. Não salvar resolução de dano ou estado transitório como checkpoint.

### Critérios de aceitação

- o diário mostra claramente progresso `0/3` a `3/3` e a descoberta associada a cada missão;
- reload mantém as entradas sem duplicação;
- conteúdo desconhecido produz mensagem segura;
- domínio e migrações são testados sem GPU.

## 11. Fatia P1-F — áudio e feedback

### Criar

- arquitetura de áudio como adaptador, sem estado autoritativo de gameplay;
- gesto explícito do usuário antes de iniciar Web Audio, respeitando políticas do navegador;
- sons distintos para:
  - seleção/scan concluído;
  - feixe;
  - lançamento e impacto de torpedo;
  - raio trator;
  - impacto no escudo e no casco;
  - aviso de energia/recarga;
  - objetivo concluído, vitória e derrota;
  - partida, viagem e retorno à base;
- ambiente ou música original discreta, se couber no orçamento;
- volumes separados, mute e persistência;
- limite de vozes simultâneas e descarte correto ao trocar de estado;
- alternativa visual/textual para todo aviso importante.

### Licença e identidade

Não copiar trilha, efeitos, vozes, alertas ou diálogos de Star Trek. Usar áudio próprio, procedural ou com licença redistribuível registrada. “Grátis para baixar” não é licença suficiente.

### Critérios de aceitação

- o jogo continua totalmente jogável sem áudio;
- áudio não começa antes da interação permitida pelo navegador;
- pausar/perder foco trata áudio de modo previsível;
- não há crescimento de fontes/vozes;
- falha ao carregar áudio não impede o jogo e oferece feedback acionável.

## 12. Fatia P1-G — assets, falhas, licenças e créditos

### Estado atual

Os visuais são principalmente primitivas e materiais procedurais. Ainda não existe `public/assets/`, manifesto final nem pipeline necessário para assets reais. Não criar essas estruturas até existir um asset distribuído de fato.

### Criar quando houver assets reais

- catálogo/manifesto com ID lógico, caminho, tipo, tamanho, hash, dependências, autor, origem, licença e data;
- carregamento transacional dos assets essenciais;
- fallback visível para asset ausente, inválido ou incompatível;
- opção de tentar novamente ou continuar com substituto seguro quando possível;
- descarregamento de recursos do setor anterior;
- validação de glTF/GLB e orçamento antes de incluir no build;
- créditos acessíveis dentro do jogo;
- inventário humano legível, por exemplo `docs/ASSET_LICENSES.md`.

### Inventariar mesmo sem novos assets

- PlayCanvas e demais dependências distribuídas;
- materiais, modelos procedurais e imagens produzidos no próprio projeto;
- sons, fontes, ícones ou texturas que venham a ser adicionados;
- licença do próprio projeto antes da publicação — atualmente `UNLICENSED` e `private`.

### Critérios de aceitação

- nenhum asset sem origem/licença registrada entra no build;
- erro de asset é visível, recuperável e coberto por E2E;
- URLs funcionam sob caminho base/subdiretório;
- build inicial permanece abaixo do orçamento de 60 MB compactados;
- memória, draw calls e tempo de carga não rompem o benchmark.

## 13. Fatia P1-H — offline, balanceamento e gate final

### Decisão sobre offline/PWA

O jogo já funciona sem serviço externo depois de servido localmente, mas não existe PWA/service worker. Antes de adicionar cache:

1. medir tamanho e estratégia de atualização;
2. definir como novas versões invalidam assets sem prender o usuário em build antigo;
3. garantir que o cache não apague nem substitua IndexedDB;
4. testar primeiro carregamento, atualização e execução offline;
5. registrar a decisão em `docs/DECISIONS.md`.

Se o benefício não justificar o risco no MVP, documentar a decisão de permanecer com execução local via `ABRIR_JOGO.bat`. Não adicionar service worker apenas para marcar uma caixa.

### Balanceamento e polimento

- realizar playtest das três missões com alguém que não conheça os controles;
- ajustar textos, alcance, tempos de scan, raio trator, energia, dano e cadência sem esconder as regras;
- impedir softlocks: falta de munição, alvo destruído antes do evento, nave longe demais, controles presos ou objetivo impossível;
- revisar o estado inicial de base e os estados após reload;
- conferir conclusão e reinício da campanha diversas vezes;
- registrar problemas reais LOW/MEDIUM em `docs/KNOWN_ISSUES.md`; CRITICAL/HIGH bloqueiam o gate.

### Gate técnico obrigatório

Executar:

```powershell
npm ci
npm run verify
npm run test:e2e -- --workers=1
npm run test:benchmark
```

Também verificar:

- instalação limpa com Node.js 22.12 ou superior;
- Chrome e Edge estáveis;
- WebGL 2 em todos os fluxos; WebGPU não pode ser o único caminho;
- 1280×720/baixo e 1600×900/médio;
- pelo menos 30 FPS médios e p99 de até 50 ms no preset suportado pela GPU escolhida pelo navegador;
- ausência de crescimento ilimitado de entidades, projéteis, áudio, listeners, VFX ou recursos entre missões;
- save v1 → v2 e futuras migrações;
- corrupção, quota, asset ausente, WebGL indisponível e renderizador não confirmado;
- nenhuma exceção, rejection ou erro de console inesperado;
- nenhuma propriedade intelectual ou asset sem licença compatível.

Avisos conhecidos que não devem ser ocultados artificialmente:

- chunk lazy do PlayCanvas acima de 500 kB;
- imports `node:worker_threads` de funcionalidades PlayCanvas não usadas externalizados pelo Vite.

Eles são atualmente não bloqueantes. Qualquer regressão real de carregamento ou desempenho deve ser corrigida, não silenciada.

### Gate funcional do MVP

O P1 só está concluído quando:

- ciclo base → mapa → viagem → objetivo → resolução → retorno funciona nas três missões;
- treinamento contextual é suficiente para uma pessoa aprender sem documentação externa;
- configurações e acessibilidade prioritária estão persistentes e funcionais;
- diário mínimo registra objetivos/descobertas;
- áudio e falhas têm fallback visual;
- save sobrevive a fechamento/reabertura e migra versões suportadas;
- Chrome e Edge passam os fluxos críticos;
- benchmark permanece dentro do orçamento;
- inventário de licenças está completo;
- zero CRITICAL/HIGH conhecido;
- documentação canônica reflete exatamente o código;
- revisão formal aprova o MVP.

## 14. Preparação para publicação — requer autorização

Não publicar, criar release, fazer deploy ou transformar o repositório em público sem autorização específica do usuário.

Quando autorizado:

- decidir nome e identidade final originais;
- concluir auditoria de propriedade intelectual e licenças;
- escolher hospedagem estática gratuita;
- validar caminhos relativos/base path;
- definir headers e cache;
- decidir source maps públicos;
- criar créditos, instruções e política simples informando ausência de analytics/coleta;
- testar build de produção hospedado no hardware alvo;
- documentar rollback e compatibilidade de saves;
- manter o jogo utilizável gratuitamente e sem conta/backend.

## 15. Expansão P2 depois do MVP

Esses itens ajudam a aproximar o protótipo do jogo maior imaginado, mas não fazem parte do fechamento imediato do P1:

- três sistemas estelares exploráveis;
- duas bases com funções distintas;
- três a cinco classes de nave com composição de dados, sem subclasses rígidas;
- oito a doze missões com variações e eventos;
- mais contatos neutros, hostis e anomalias;
- planetas e luas observáveis/escaneáveis, sem pouso;
- progressão de sistemas da nave;
- reputação e duas facções originais;
- diário de bordo e catálogo de descobertas completos;
- gamepad;
- exportação/importação manual do save;
- localização em inglês;
- opções de acessibilidade ampliadas;
- ferramentas de validação/otimização de conteúdo e assets.

Cada novo sistema/setor precisa de orçamento próprio, streaming/descarte e benchmark. Conteúdo deve ser orientado a dados e reutilizar voo, energia, sensores, combate, dano, IA e missão existentes.

## 16. Itens P3 opcionais — não presumir autorização

- campanha longa;
- conteúdo procedural limitado por regras;
- comércio e salvamento mais profundo;
- tripulação e eventos narrativos;
- novas armas e contramedidas;
- suporte a mais navegadores/dispositivos;
- pouso;
- interiores caminháveis;
- multiplayer cooperativo.

Pouso, interiores e multiplayer são projetos grandes e exigem nova especificação, arquitetura, orçamento e autorização. Não são “últimos detalhes” do jogo atual.

## 17. Regras técnicas que não podem ser quebradas

- preservar TypeScript estrito; não usar `any` como atalho;
- o domínio não importa PlayCanvas, DOM, IndexedDB ou relógio global;
- PlayCanvas, UI, entrada, persistência e áudio são adaptadores;
- WebGL 2 permanece baseline;
- aplicação continua estática, single-player e sem backend/auth;
- voo permanece cinemático e colisões simples até necessidade medida;
- conteúdo e definições imutáveis ficam separados do estado de sessão;
- UI e entidades PlayCanvas não duplicam estado autoritativo;
- comandos pedem ações; eventos descrevem fatos validados;
- IDs lógicos conectam domínio, conteúdo, engine e assets;
- toda entrada persistida ou conteúdo carregado é validado na fronteira;
- não usar `innerHTML` com texto de conteúdo;
- não adicionar analytics, segredo, chave ou envio remoto;
- não adicionar dependência sem justificar licença, tamanho, manutenção e benefício;
- não retirar teste/validação para fazer o build passar;
- preservar alterações do usuário e evitar comandos Git destrutivos;
- ao finalizar cada tarefa, revisar diff, executar gates, atualizar `docs/PROGRESS.md`, fazer commit e push conforme `AGENTS.md`.

## 18. Estratégia recomendada de implementação

Para cada fatia:

1. confirmar o requisito e critério no MVP/roadmap;
2. registrar decisão antes de mudar arquitetura ou schema;
3. escrever/ajustar teste de domínio para a regra;
4. implementar a menor solução completa;
5. integrar aplicação, UI e engine sem duplicar autoridade;
6. executar testes focados;
7. executar `npm run verify`;
8. executar E2E de produção em Chrome/Edge quando houver UI, engine, asset ou persistência;
9. inspecionar visualmente viewports e estados afetados;
10. executar benchmark quando houver mudança gráfica, áudio concorrente, assets ou carga de cena;
11. revisar lógica, arquitetura, UX, acessibilidade, segurança, licença e performance;
12. atualizar documentação;
13. executar `git diff --check`, commit e push.

Não misturar mapa, configurações, áudio e assets finais em um único commit grande. Uma sequência sugerida de commits é:

1. `feat: adicionar mapa logico do sistema`;
2. `feat: apresentar viagem e estado seguro da base`;
3. `feat: adicionar menu e configuracoes persistentes`;
4. `feat: concluir acessibilidade prioritaria`;
5. `feat: adicionar diario de objetivos`;
6. `feat: adicionar audio original e fallback`;
7. `feat: validar assets e exibir creditos`;
8. `test: fechar gate de regressao do mvp`;
9. `docs: aprovar gate final do mvp`.

Os nomes são sugestões; o conteúdo e os gates importam mais que a quantidade exata de commits.

## 19. Mapa rápido do código existente

- `src/application/bootstrap.ts`: composição atual, campanha, save, loop e publicação de telemetria; já está grande, portanto novas responsabilidades duradouras podem justificar sessões/casos de uso próprios;
- `src/application/session-menu.ts`: estado efêmero do menu inicial, detalhes, retorno e fronteira de entrada da sessão;
- `src/application/flight-session.ts`: coordena voo, energia e encontro;
- `src/application/encounter-session.ts`: sensores, equipamento, IA, dano e perfis passivo/hostil;
- `src/application/game-save.ts`: envelope e migração do save;
- `src/application/save-controller.ts`: inicialização, gravação e recuperação;
- `src/application/game-settings.ts`: envelope v1 e validação estrita das preferências;
- `src/application/settings-controller.ts`: defaults, carga, gravação e restauração de configuração;
- `src/content/mission-content.ts`: as três missões e textos tutoriais;
- `src/domain/missions/tutorial-campaign.ts`: ordem e fases da campanha;
- `src/domain/flight/`, `energy/` e `combat/`: regras puras já testadas;
- `src/engine/create-arena-scene.ts`: cena PlayCanvas, materiais, corpos, naves, dano, VFX, LOD e benchmark;
- `src/platform/indexeddb-save-repository.ts`: persistência do progresso;
- `src/platform/local-storage-settings-repository.ts`: persistência separada das preferências;
- `src/platform/flight-input.ts`: teclado, mouse, foco e tela cheia;
- `src/ui/app-shell.ts`: DOM/HUD e contratos de telemetria;
- `src/styles/global.css`: layout e tema;
- `tests/e2e/boot.spec.ts`: matriz funcional e visual Chrome/Edge;
- `tests/performance/benchmark.spec.ts`: medição física configurável;
- `docs/BENCHMARK_P0_5.md`: baseline de desempenho;
- `ABRIR_JOGO.bat`: execução local para o usuário.

## 20. Checklist final para declarar “jogo finalizado”

### MVP P1

- [x] mapa de um sistema implementado;
- [x] base, mapa, viagem e encontro têm estados coerentes e distintos;
- [x] apresentação visual da viagem implementada e leve;
- [x] menu inicial/continuar/acesso a configurações/créditos implementado;
- [x] configurações persistentes separadas do save;
- [x] escala do HUD e redução de flashes/tremor/partículas funcionais;
- [x] remapeamento essencial funcional;
- [ ] diário mínimo de objetivos/descobertas implementado;
- [ ] áudio original/licenciado com volumes, mute e fallback;
- [ ] falha de asset recuperável;
- [ ] manifesto/inventário de licenças completo;
- [ ] decisão PWA/offline registrada e, se aprovada, testada;
- [ ] playtest e balanceamento das três missões concluídos;
- [ ] instalação limpa aprovada;
- [ ] `npm run verify` aprovado;
- [ ] E2E completo Chrome/Edge aprovado;
- [ ] benchmark físico aprovado;
- [ ] inspeção visual 1280×720 e 1600×900 aprovada;
- [ ] zero CRITICAL/HIGH;
- [ ] revisão formal do MVP aprovada;
- [ ] documentação sincronizada;
- [ ] commit e push realizados.

### Jogo expandido P2

- [ ] decidir com o usuário se P2 faz parte da definição desejada de “finalizado”;
- [ ] adicionar sistemas, bases, classes de nave e missões somente após essa decisão;
- [ ] passar novamente licenças, compatibilidade, desempenho e testes por setor.

### Publicação

- [ ] receber autorização explícita do usuário;
- [ ] concluir decisão de nome/propriedade intelectual;
- [ ] auditar assets e dependências;
- [ ] escolher hospedagem gratuita;
- [ ] testar build hospedado e rollback;
- [ ] publicar sem backend, conta, analytics ou custo obrigatório.

Até que todos os itens obrigatórios do bloco **MVP P1** estejam marcados, descreva o produto como **protótipo jogável/MVP em desenvolvimento**, não como jogo completamente finalizado.
