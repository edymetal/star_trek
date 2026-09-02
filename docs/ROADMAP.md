# Roadmap de desenvolvimento

Atualizado em: 2 de setembro de 2026

O roadmap usa gates objetivos, não datas rígidas. Uma etapa só fecha com evidência de teste e revisão. Cada etapa funcional admite no máximo cinco ciclos `review → implement → test`; problemas remanescentes vão para `docs/KNOWN_ISSUES.md`, mas CRITICAL/HIGH impedem avanço.

## Etapa 0 — Pré-produção

**Prioridade:** fundação documental  
**Status:** concluída

Entregas:

- especificação do produto e casos de uso;
- escopo P0–P3;
- arquitetura, premissas e decisões;
- roadmap, controle de progresso e manual de agentes;
- reconciliação com a pesquisa de `PLANEJAMENTO.md`;
- revisão formal e autorização do P0.

Critério de conclusão:

- documentos não se contradizem em tecnologia, escopo, baseline, PI e ordem de trabalho;
- questões em aberto têm padrão seguro e gate;
- Agente 2 sabe qual é a primeira entrega e como verificá-la.

## Etapa 1 — Fundação executável (P0.1)

**Objetivo:** produzir o menor build verificável, sem mecânica prematura.

Entregas:

- scaffold TypeScript/Vite/PlayCanvas e lockfile;
- estrutura modular mínima e regras de importação;
- lint, typecheck, Vitest, Playwright e build;
- shell de carregamento/erro e diagnóstico de WebGL 2/renderizador;
- cena vazia controlada e preset gráfico inicial;
- documentação de instalação/execução atualizada.

Critério de conclusão:

- instalação limpa reproduzível;
- dev, lint, typecheck, testes e build passam;
- preview de produção abre em Chrome e Edge;
- ausência de WebGL 2 apresenta erro acionável;
- Product Architect revisa dependências e separação das camadas.

## Etapa 2 — Arena, nave e voo (P0.2)

**Objetivo:** provar controle e representação espacial antes dos sistemas de combate.

Entregas:

- nave provisória do jogador com definição/estado separados;
- movimento cinemático, assistência, impulso e câmera externa;
- pausa, foco, tela cheia e captura/liberação de ponteiro;
- arena com limites, corpos visuais provisórios e asteroides instanciados;
- primeiro LOD e telemetria básica de frametime/draw calls;
- teste para passo fixo e entrada crítica.

Critério de conclusão:

- controle permanece estável em FPS variável;
- nenhum input fica preso após pausa/perda de foco;
- arena roda no notebook com margem para combate;
- decisão de 30/60 Hz pode permanecer parametrizada até o benchmark final.

## Etapa 3 — Energia e HUD (P0.3)

**Objetivo:** tornar a primeira escolha tática funcional e observável.

Entregas:

- domínio de reator, reserva, quatro consumidores e eficiência/dano;
- presets e comandos de ajuste;
- efeito em voo, regeneração/recarga e auxiliares provisórios;
- HUD de velocidade, casco, escudo, alvo e energia;
- testes de conservação, limites, valores inválidos e presets.

Critério de conclusão:

- invariantes passam em testes independentes do motor;
- HUD e comportamento leem a mesma fonte de estado;
- playtest distingue claramente equilibrado, ataque, defesa e fuga;
- interface é legível em 1280×720.

## Etapa 4 — Sensores, armas e IA (P0.4)

**Objetivo:** fechar um encontro tático completo.

Entregas:

- seleção de contato e escaneamento;
- feixe, torpedo e raio trator;
- quatro setores de escudo, casco por seções e subsistemas;
- nave inimiga com percepção e estados básicos;
- vitória, derrota e reinício;
- eventos de domínio e feedback provisório;
- testes de alcance, energia, recarga, dano, alvo e transições de IA.

Critério de conclusão:

- todos os equipamentos têm papel e condição de uso distintos;
- dano atinge setor/seção corretos e pode desativar subsistema;
- IA não conhece alvo fora de sua percepção e consegue recuar;
- encontro é concluível e reiniciável sem recarregar a página.

## Prioridade intermediária — Apresentação tática UI-1

**Objetivo:** atender à prioridade visual explícita do usuário sem antecipar VFX, arte final ou benchmark do P0.5.

Entregas:

- tema sci-fi naval original e acessível;
- objetivo e sessão no topo, nave e alvo nos cantos inferiores e ações no centro inferior;
- energia e diagnóstico recolhíveis;
- câmera externa com nave entre 22–30% da largura, starfield instanciado, retículo e marcador seguro;
- layout sem scroll/overlap em 1280×720 e 1600×900;
- orçamento baixo de até 18 draw calls e 96 asteroides.

Critério de conclusão:

- E2E focado passa em Chrome/Edge;
- inspeção visual confirma centro livre, foco visível, contraste e redução de movimento;
- fluxo semântico segue objetivo → ações táticas → energia → sessão, com os dados da nave e quatro setores de escudo no cartão do jogador;
- memória do marcador é explicitamente rotulada e tracejada; marcador e malha remota não consultam nem acompanham posição oculta;
- os bloqueios de fluxo foram resolvidos posteriormente em `DECISION-024`; UI-1, isoladamente, não autoriza iniciar P0.5 antes da revisão formal do P0.4.

## Prioridade intermediária — Polimento gráfico UI-GFX

**Objetivo:** tornar nave, alvo, combate e dano imediatamente legíveis sobre a UI-1, sem alterar domínio/IA/combate nem declarar o gate P0.5 concluído.

Entregas:

- materiais, iluminação e silhuetas navais sci-fi originais por primitivas;
- três estados visuais de casco e motores para jogador e contato atualmente observado;
- feixe, torpedo, raio trator, impactos e escudo em pool fixo;
- até dois efeitos simultâneos confirmados pelo adaptador por resultados públicos;
- inspeção real e capturas em 1280×720 e 1600×900;
- diagnóstico baixo com até 18 draw calls em repouso e até 28 durante VFX combinados, mantendo 96 asteroides instanciados.

Critério de conclusão:

- `verify`, auditoria, apresentação UI pura 20/20 e adaptador VFX 10/10 passam; após `DECISION-024`, o fluxo gráfico-combate também passa repetidamente em Chrome/Edge;
- Chrome e Edge validam efeitos, projétil, impacto, ocultação perceptual e layout;
- nenhum VFX cria entidade por disparo ou consulta posição/dano remoto oculto;
- medições são rotuladas como diagnóstico, não benchmark físico;
- a matriz P0.4 passa em 38/38 casos Chrome/Edge; sua revisão formal ainda precede P0.5, que continua reservado ao gate completo de dano/asset/performance.

## Etapa 5 — Dano visual e benchmark (P0.5)

**Status:** concluída e aprovada; `DECISION-027` substituiu o vínculo obrigatório à MX130 por um gate escalável de fluidez

**Objetivo:** comprovar qualidade visual leve e escalável no navegador, sem exigir configuração manual de uma GPU específica.

Entregas:

- câmera externa recomposta, com nave do jogador grande/legível e alvo à frente;
- starfield denso, brackets, linha e retículo de alvo no espaço;
- HUD tático integrado às bordas: objetivo à esquerda, nave/escudos/sistemas embaixo à esquerda e alvo embaixo à direita;
- feixe, torpedo, raio trator, impactos e dano visíveis na cena durante o combate;
- impacto de escudo e três estados de dano por seção selecionada;
- decalques, partículas, emissivos e pools com limites por preset;
- base, planeta, lua, estrela e asteroides no cenário de medição;
- cenário determinístico com carga de combate representativa;
- presets baixo/médio/alto e comparação WebGL 2/WebGPU quando disponível;
- relatório de hardware, navegador, resolução, FPS/frametime e contadores.

Critério de conclusão:

- o preset suportado mantém ≥30 FPS médios, p99 ≤50 ms e não apresenta crescimento ilimitado de carga;
- a GPU e o preset efetivamente usados ficam registrados, sem alteração obrigatória das preferências do sistema;
- efeitos não crescem indefinidamente e assets são descarregáveis;
- dano visual corresponde ao estado lógico;
- hierarquia tática permanece legível em 1280×720 e usa identidade original, sem copiar layout, nomes, logos ou assets da referência;
- gate formal do P0 aprovado, sem CRITICAL/HIGH.

## Etapa 6 — Primeira fatia vertical P1

**Status:** em desenvolvimento; campanha, persistência, base/mapa/viagem, menu inicial, configurações, acessibilidade prioritária, diário e áudio concluídos; recuperação de asset ainda pendente

**Objetivo:** implementar uma missão ponta a ponta antes de multiplicar conteúdo.

Entregas:

- base funcional simples;
- mapa de um sistema e uma transição de viagem;
- missão de exploração/escaneamento;
- retorno, reparo/reabastecimento e resultado;
- save IndexedDB versionado e configurações persistentes;
- recuperação de falha de save/asset.

Primeira subfatia concluída:

- missão original `Levantamento de Nereida` com briefing, partida, levantamento, retorno e conclusão;
- scan/identificação existente completa o objetivo sem duplicar estado do contato;
- retorno reinicia casco, energia e munição na base;
- transições e comandos inválidos são testados sem GPU; ciclo integrado é coberto em Chrome/Edge.

Segunda subfatia concluída:

- IndexedDB isolado atrás de `SaveRepository`, com schema v2 e migração v1 → v2;
- snapshots e ponteiro ativo são gravados na mesma transação, com limite de três registros;
- somente briefing e missão concluída são checkpoints seguros;
- reload retoma o progresso; corrupção preserva o original e exige recuperação explícita;
- falhas simuladas de leitura/quota mantêm uma sessão segura e o último save válido;
- benchmark não abre nem altera a persistência do jogador.

Terceira subfatia concluída por prioridade explícita do usuário:

- campanha orientada a dados com três missões sequenciais: sensores, assistência e combate;
- contatos passivos nas duas primeiras lições e contato hostil na última;
- equipamentos são liberados gradualmente e objetivos usam os sistemas autoritativos existentes;
- progresso entre as três missões usa os checkpoints seguros do schema v2 sem alterar seu formato;
- fluxo integral e retomada final são cobertos em Chrome/Edge.

Quarta subfatia concluída:

- domínio de navegação validado para base, mapa, viagem e encontro no Sistema Hélios;
- três setores de missão, dois pontos de interesse e rotas configuráveis com IDs estáveis;
- mapa acessível por teclado e viagem visual integrados às fases de partida e retorno;
- base sem IA, projéteis, dano ou controles de combate; reparo e reabastecimento ocorrem ao concluir o retorno;
- raízes gráficas fixas alternam base e bolha tática sem crescimento por transição;
- reload em viagem/encontro volta ao checkpoint seguro e a matriz integral passa em Chrome/Edge.

Quinta subfatia concluída:

- menu inicial acessível com novo treinamento, continuar, configurações, diagnóstico e créditos;
- confirmação explícita protege progresso existente e campanha reiniciável volta ao primeiro briefing;
- comando da base apresenta recursos, serviços, próximo objetivo e estado das três missões;
- menu modal bloqueia entrada tática e mantém foco/retorno por teclado previsíveis;
- estados de carregamento, save indisponível e recuperação continuam visíveis, sem tela vazia.

Sexta subfatia concluída:

- configurações usam repositório próprio separado do save da campanha; o schema v1 desta entrega migra para v2 no P1-F;
- preset gráfico, HUD, volumes, reduções visuais, mouse e teclas essenciais sobrevivem ao reload;
- HUD, entrada e VFX seguros mudam imediatamente; preset informa e respeita o próximo carregamento;
- configuração inválida preserva o registro, ativa padrões seguros e exige restauração/alteração explícita;
- escala de 110% e reduções reais foram verificadas nos dois viewports e navegadores obrigatórios.

Sétima subfatia concluída:

- menu e mapa funcionam como fronteiras modais com foco contido e superfícies de fundo inertes;
- base, mapa, viagem, canvas, ações táticas, energia e pausa são percorridos somente por teclado;
- objetivos, contatos, escudos, subsistemas, energia e ações possuem nomes e estados textuais, sem depender apenas de cor;
- regiões `aria-live` anunciam mudanças de objetivo, feedback e conclusão por chaves deduplicadas, sem republicar telemetria estável;
- atalhos remapeados atualizam botões, `aria-keyshortcuts` e instruções tutoriais imediatamente;
- contraste textual AA foi automatizado nos presets baixo/médio/alto e HUD 110% foi reinspecionado em 1280×720.

Oitava subfatia concluída:

- diário orientado a dados apresenta objetivo atual, progresso `0/3` a `3/3` e uma descoberta original por missão;
- projeção pura deriva uma entrada por ID do checkpoint sequencial, sem array persistido ou alteração do schema v2;
- reload, repetição e publicação a 8 Hz não duplicam registros; conteúdo desconhecido ou inconsistente retorna mensagem segura;
- menu e Base Aurora oferecem acesso por teclado, com estados concluído/atual/bloqueado escritos além das bordas coloridas;
- inspeção 1280×720, 177/177 testes, 72/72 E2E Chrome/Edge e benchmark UHD 620/médio aprovam o gate.

Nona subfatia concluída:

- roteador puro transforma somente transições públicas em sinais de seleção, scan, armas, impacto, energia, objetivo, resultado e viagem;
- Web Audio é criado apenas por gesto e sintetiza efeitos/ambientes originais sem arquivos externos ou biblioteca adicional;
- dez vozes lógicas formam o teto; mute, pausa, perda de foco, troca de setor e descarte encerram fontes de modo previsível;
- preferências v2 persistem mute e migram v1 sem alterar o save IndexedDB;
- jogo sem Web Audio, mensagens acionáveis e alternativas visuais/textuais passam em Chrome/Edge; benchmark UHD 620/médio permanece aprovado.

Critério de conclusão:

- ciclo completo funciona após reload;
- autosave só ocorre em estado seguro;
- migração e falha simulada têm testes;
- desempenho continua dentro do orçamento P0.

## Etapa 7 — Vertical slice/MVP P1

**Status:** em desenvolvimento; ciclo base–mapa–viagem–missões, variedade de contatos, tutorial, menu inicial, configurações, acessibilidade, diário e áudio concluídos

**Objetivo:** completar variedade mínima e qualidade de demonstração.

Entregas:

- [x] missão de assistência com raio trator e missão de combate;
- [x] duas variações de contato/IA;
- [x] tutorial contextual e diário mínimo de objetivo/descoberta concluídos;
- [x] áudio e feedback refinados;
- [x] configurações persistentes e controles essenciais;
- [x] acessibilidade prioritária;
- inventário final de licenças do build;
- testes E2E do ciclo e benchmark de regressão.

Critério de conclusão:

- três missões e ciclo base–retorno completos;
- save, erro e retomada verificados em Chrome/Edge;
- zero CRITICAL/HIGH;
- testes, lint, typecheck e build passam;
- Product Architect aprova o MVP segundo `docs/MVP.md`.

## Etapa 8 — Alpha de conteúdo P2

**Objetivo:** expandir sem duplicar sistemas.

Entregas potenciais:

- mais sistemas, bases, naves, missões e anomalias;
- progressão, reputação e facções originais;
- gamepad, exportação de save, localização e acessibilidade ampliada;
- pipeline automático de validação/otimização de assets.

Critério de conclusão:

- cada conteúdo reutiliza sistemas orientados a dados;
- orçamento por setor e licenças passam automaticamente;
- nenhuma regressão nos gates do MVP.

## Etapa 9 — Preparação para publicação

**Objetivo:** distribuir de forma gratuita, segura e reproduzível.

Entregas:

- decisão final de nome/PI e auditoria de assets/licenças;
- escolha de hospedagem estática gratuita;
- headers, cache, caminhos de base e build de produção;
- compatibilidade, acessibilidade e desempenho finais;
- créditos, política de privacidade simples (sem coleta) e instruções;
- plano de rollback e versionamento do save.

Critério de conclusão:

- autorização explícita para publicar;
- identidade e conteúdo juridicamente seguros;
- build implantado sem segredo/serviço pago;
- smoke test público e rollback verificados.

## Processo de cada etapa

1. Product Architect confirma requisito e critérios.
2. Senior Developer implementa apenas a fatia ativa.
3. Executa testes, lint, typecheck e build aplicáveis.
4. Product Architect revisa funcionalidade, arquitetura, UX, segurança e performance.
5. Senior Developer corrige achados justificados.
6. Reexecuta verificações e fecha o gate.

Achados usam severidade:

- **CRITICAL:** perda de dados, execução insegura, fluxo principal impossível ou build inutilizável;
- **HIGH:** requisito P0/P1 quebrado, regressão grave, desempenho abaixo do gate;
- **MEDIUM:** comportamento importante degradado com contorno;
- **LOW:** melhoria pequena, legibilidade ou polimento.

## Decisões de parada

- se PlayCanvas falhar objetivamente no spike, revisar DECISION-003 antes de criar conteúdo;
- se o preset suportado romper o gate escalável, reduzir efeitos, resolução, assets e carga antes de trocar motor;
- se P0 não for divertido/legível, ajustar voo, energia e combate antes do P1;
- se PI não estiver resolvida, o build continua privado/original e não é publicado;
- multiplayer, pouso ou interiores não entram por “pequena melhoria”; exigem novo plano.
