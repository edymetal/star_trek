# Registro de decisões

Atualizado em: 2 de setembro de 2026

Decisões aceitas só devem ser alteradas por nova entrada que referencie a anterior, apresente evidência e descreva migração. Decisões provisórias têm gate explícito.

## DECISION-001 — Identidade original por padrão

**Status:** aceita  
**Problema:** a ideia é inspirada em Star Trek, mas as diretrizes públicas para produções de fãs não concedem automaticamente licença para publicar um jogo.  
**Opções consideradas:** usar nomes/assets da franquia; manter protótipo privado; desenvolver identidade original compatível com publicação.  
**Decisão:** código, dados e assets do P0/P1 usarão nomes genéricos ou originais. Material protegido só entra com licença/autorização verificável.  
**Motivo:** mantém a construção segura e não bloqueia mecânicas.  
**Consequências:** a pasta/repositório pode manter o nome histórico local por enquanto, mas o título público, lore, naves, interface, sons e marcas serão originais. Uma decisão de publicação deverá confirmar isso.

## DECISION-002 — Aplicação estática, single-player e offline-first

**Status:** aceita  
**Problema:** backend e serviços trazem custo, rede, segurança e manutenção sem requisito atual.  
**Opções consideradas:** servidor persistente; backend local; build web estático.  
**Decisão:** P0/P1 serão totalmente client-side; nenhum serviço externo será necessário em runtime.  
**Motivo:** atende custo zero, simplicidade e uso no notebook.  
**Consequências:** não há conta, sincronização em nuvem, ranking ou multiplayer. Esses recursos exigem nova arquitetura.

## DECISION-003 — PlayCanvas Engine standalone

**Status:** aceita com gate no fim do spike P0.1/P0.2  
**Problema:** o jogo precisa de motor 3D web-first, licença permissiva, PBR, assets e bom controle do build.  
**Opções consideradas:** PlayCanvas, Babylon.js, Three.js, Godot Web e Unity Web.  
**Decisão:** usar PlayCanvas Engine pelo npm, sem dependência obrigatória do editor/serviço hospedado.  
**Motivo:** menor desalinhamento com web, licença MIT e recursos de motor suficientes.  
**Consequências:** cenas e ferramentas serão organizadas no repositório. Se um critério objetivo de compatibilidade, performance ou manutenção falhar no spike, Babylon.js é a alternativa; troca requer ADR antes de conteúdo substancial.

## DECISION-004 — TypeScript estrito, Vite e npm

**Status:** aceita  
**Problema:** regras complexas e build web precisam ser mantidos com pouca infraestrutura.  
**Opções consideradas:** JavaScript puro; TypeScript; bundlers/frameworks adicionais.  
**Decisão:** TypeScript estrito, Vite e npm com lockfile.  
**Motivo:** tipos para domínio/save e build estático simples.  
**Consequências:** sem `any` implícito, sem dependências globais escondidas e sem introduzir monorepo/framework sem necessidade.

## DECISION-005 — WebGL 2 como baseline; WebGPU experimental

**Status:** aceita; preferência WebGPU continua provisória  
**Problema:** WebGPU pode melhorar recursos, mas suporte/driver/desempenho na MX130 não é garantido.  
**Opções consideradas:** somente WebGL 2; somente WebGPU; fallback e benchmark.  
**Decisão:** toda função P0/P1 deve funcionar em WebGL 2. WebGPU será opção somente depois de comparação no mesmo benchmark.  
**Motivo:** compatibilidade e recuperação importam mais que novidade.  
**Consequências:** efeitos exclusivos de WebGPU não podem ser requisito do MVP.

## DECISION-006 — Domínio independente do motor

**Status:** aceita  
**Problema:** colocar regras em scripts/entidades gráficas cria acoplamento e testes frágeis.  
**Opções consideradas:** lógica centrada no PlayCanvas; simulação separada com adaptadores.  
**Decisão:** energia, combate, dano, sensores, IA, missão e save não importam PlayCanvas/DOM.  
**Motivo:** testes rápidos, fonte única de verdade e evolução do renderer.  
**Consequências:** existe uma camada explícita de sincronização e algum mapeamento de IDs; duplicar estado autoritativo no engine/HUD é proibido.

## DECISION-007 — Simulação em passo fixo e múltiplas frequências

**Status:** aceita; frequência exata provisória  
**Problema:** regras não podem mudar com FPS, mas executar tudo a 60 Hz desperdiça CPU.  
**Opções consideradas:** delta variável; tudo a 60 Hz; passo fixo com subsistemas em ritmos menores.  
**Decisão:** combate/movimento usam passo fixo; IA e sensores distantes usam ritmos menores. P0 decidirá 30 ou 60 Hz por benchmark.  
**Motivo:** estabilidade e orçamento do i7-8550U.  
**Consequências:** todo temporizador de jogo usa relógio da simulação; renderização interpola estado.

## DECISION-008 — Universo em três escalas

**Status:** aceita  
**Problema:** escala astronômica real degrada precisão, tempo de viagem e desempenho.  
**Opções consideradas:** universo contínuo 1:1; níveis isolados; mapa, sistema artístico e bolha tática.  
**Decisão:** usar mapa setorial lógico, sistema estelar artístico e bolha tática com origem flutuante.  
**Motivo:** preserva fantasia sem manter tudo ativo.  
**Consequências:** dobra é transição/carregamento; distâncias visuais não são escala científica.

## DECISION-009 — Voo cinemático sem motor de física no P0

**Status:** aceita  
**Problema:** física 6DoF completa e malhas de colisão complexas aumentam custo e dificultam controle.  
**Opções consideradas:** física realista; Rapier; movimento cinemático com volumes simples.  
**Decisão:** movimento cinemático, inércia moderada, assistência opcional e colisores simples.  
**Motivo:** melhor controle e menor custo.  
**Consequências:** Rapier só entra por necessidade medida e nova decisão; não haverá física orbital/N-corpos.

## DECISION-010 — Conteúdo orientado a dados validados

**Status:** aceita  
**Problema:** classes específicas por nave/arma dificultam balanceamento e conteúdo.  
**Opções consideradas:** hierarquias de subclasses; definições configuráveis; scripting externo.  
**Decisão:** definições serializáveis e validadas alimentam sistemas genéricos; dados nunca executam código.  
**Motivo:** manutenção, testes e expansão segura.  
**Consequências:** schemas/validadores e IDs estáveis são parte do P0; casos realmente excepcionais usam composição explícita.

## DECISION-011 — HUD em HTML/CSS sem framework no P0

**Status:** aceita  
**Problema:** HUD precisa ser legível e acessível, mas um framework adicionaria dependência antes da complexidade existir.  
**Opções consideradas:** UI dentro do canvas; framework web; DOM simples.  
**Decisão:** HTML/CSS e componentes TypeScript pequenos sobre o canvas.  
**Motivo:** acessibilidade, responsividade e simplicidade.  
**Consequências:** avaliar framework somente se P1 provar complexidade e uma ADR demonstrar benefício.

## DECISION-012 — Dano visual preparado, não destruição arbitrária

**Status:** aceita  
**Problema:** o usuário quer dano detalhado, mas corte de malha/textura dinâmica pesada excede o orçamento.  
**Opções consideradas:** destruição procedural; troca de modelo; máscaras/decalques/partículas/peças preparadas.  
**Decisão:** três ou quatro estados por seção, máscaras, decalques limitados, emissivos, partículas e poucas peças destacáveis.  
**Motivo:** resultado previsível e convincente na MX130.  
**Consequências:** assets precisam de preparação de dano; efeitos têm pools e limites por preset.

## DECISION-013 — IndexedDB com save versionado no P1

**Status:** aceita  
**Problema:** progresso precisa sobreviver ao fechamento sem banco remoto e sem bloquear a thread principal.  
**Opções consideradas:** `localStorage`; IndexedDB; arquivo manual; nuvem.  
**Decisão:** IndexedDB atrás de repositório, envelope versionado e migrações testadas. Preferências pequenas podem usar armazenamento simples encapsulado.  
**Motivo:** capacidade, assincronicidade e custo zero.  
**Consequências:** backup, erro de quota e recuperação de corrupção precisam de fluxo explícito; criptografia/antitrapaça não são objetivos.

## DECISION-014 — Vitest e Playwright com testes focados em risco

**Status:** aceita  
**Problema:** regras precisam de cobertura rápida e o navegador precisa de validação real.  
**Opções consideradas:** testes apenas manuais; uma única ferramenta; unitário + integração/E2E.  
**Decisão:** Vitest para domínio/integração e Playwright para fluxos críticos em Chrome/Edge.  
**Motivo:** feedback rápido e confiança proporcional ao risco.  
**Consequências:** não perseguir percentual artificial; benchmark e inspeção visual continuam necessários.

## DECISION-015 — Dependências estáveis e versões travadas no scaffold

**Status:** aceita  
**Problema:** números de versão mudam entre planejamento e implementação.  
**Opções consideradas:** registrar ranges amplos agora; usar `latest`; selecionar e travar no P0.1.  
**Decisão:** o Agente 2 confirmará versões estáveis e compatíveis no P0.1, registrará a seleção e fará commit do lockfile. Betas exigem justificativa.  
**Motivo:** evita documentação envelhecida virar instalação insegura.  
**Consequências:** versões pesquisadas no `PLANEJAMENTO.md` são referência, não range automático.

## DECISION-016 — Publicação estática gratuita, somente após gate

**Status:** aceita  
**Problema:** o jogo precisa ser executável no navegador sem custo, mas publicar cedo cria riscos de PI/licença e regressão.  
**Opções consideradas:** executável local apenas; GitHub Pages; Cloudflare Pages; serviço pago.  
**Decisão:** build estático compatível com hospedagem gratuita; provedor só será escolhido no gate de publicação.  
**Motivo:** evita acoplamento e custo.  
**Consequências:** caminhos funcionam sob subdiretório; nenhuma publicação automática é necessária no P0.

## DECISION-017 — Toolchain compatível e fixada no P0.1

**Status:** aceita  
**Problema:** TypeScript 7.0.2 é a versão estável mais recente, mas o typescript-eslint 8.67.0 declara suporte oficial somente a TypeScript `>=4.8.4 <6.1.0`. Adotar as versões mais novas isoladamente deixaria lint e parser fora da matriz suportada.  
**Opções consideradas:** TypeScript 7 sem lint TypeScript suportado; ferramenta beta; TypeScript 6 estável dentro da matriz; linter alternativo que contrariaria o contrato ESLint.  
**Decisão:** o scaffold fixa TypeScript 6.0.3, typescript-eslint 8.67.0 e ESLint 10.8.1. Também fixa PlayCanvas 2.21.4, Vite 8.2.2, Vitest 4.1.11, Playwright 1.62.1 e Prettier 3.9.6. `eslint-config-prettier` desativa regras estilísticas conflitantes; Prettier formata e ESLint analisa qualidade.  
**Motivo:** todas as ferramentas são estáveis, compatíveis e passaram instalação limpa, lint, typecheck, testes, build e E2E no ambiente alvo.  
**Consequências:** todas as versões permanecem exatas no `package.json`/lockfile. TypeScript 7 só entra depois de suporte declarado pelo typescript-eslint e repetição do gate. `@types/webxr` é dependência somente de tipos exigida pelas declarações completas do PlayCanvas; isso não adiciona VR ao escopo.

## DECISION-018 — Movimento a 60 Hz parametrizado no P0.2

**Status:** aceita provisoriamente até o benchmark P0.5  
**Problema:** voo precisa ser independente do FPS de renderização e não pode tentar recuperar indefinidamente o tempo perdido após aba suspensa.  
**Opções consideradas:** delta variável; passo fixo de 30 Hz; passo fixo de 60 Hz; recuperação sem limite.  
**Decisão:** o movimento usa passo fixo configurável de 60 Hz, interpolação visual, delta de frame aceito de no máximo 250 ms e no máximo 15 passos por frame. Excesso é descartado e registrado localmente. Comandos contínuos são lidos por passo; deltas acumulados do ponteiro ficam pendentes durante frames sem passo e são consumidos uma única vez pelo próximo passo.  
**Motivo:** 60 Hz preserva resposta imediata do controle e os testes reproduzem o mesmo estado com renderização a 30 e 144 FPS. Limites evitam espiral de catch-up.  
**Consequências:** o benchmark P0.5 ainda pode reduzir a frequência por nova evidência; regras não leem FPS/relógio global e pausa zera o acumulador.

## DECISION-019 — Energia conservada com reserva e eficiência por integridade

**Status:** aceita provisoriamente até playtest/balanceamento P0.5  
**Problema:** energia precisa afetar sistemas imediatamente, continuar determinística e representar dano sem criar ou esconder potência.  
**Opções consideradas:** percentuais cosméticos; consumo separado sem conservação; fluxo conservado com perdas explícitas.  
**Decisão:** a nave possui capacidade de alocação 100 distribuída entre motores, escudos, armas e auxiliares/sensores. A geração efetiva do reator pode ser complementada pela reserva quando há perda de integridade; cada canal converte sua parcela em potência efetiva e perda conforme a própria integridade. Normalização e ajustes sempre conservam a capacidade. Presets são dados imutáveis, e valores finais continuam provisórios.  
**Motivo:** torna presets, dano futuro e feedback explicáveis, testáveis sem GPU e independentes do renderer.  
**Consequências:** reserva não recarrega no P0.3; recarga, persistência e reparo exigem regra posterior. Escudos e estado de armas já evoluem, mas disparo, acerto, scanning e dano pertencem ao P0.4. O domínio de energia não importa PlayCanvas nem DOM.

## DECISION-020 — Percepção e combate determinísticos no P0.4

**Status:** aceita provisoriamente até playtest/balanceamento P0.5  
**Problema:** sensores, IA, armas e dano precisam formar um encontro reproduzível sem permitir que jogador ou IA consultem informações que ainda não perceberam.  
**Opções consideradas:** estado direto da cena; lógica em scripts PlayCanvas; sessão determinística sobre domínio puro.  
**Decisão:** contatos progridem de desconhecido para detectado e identificado por alcance, tempo, energia e integridade. Fora do alcance, somente a última distância observada permanece durante memória tática configurável de oito segundos; nunca se publica posição atual oculta. A IA recebe apenas percepção válida. Equipamentos validam alvo, alcance, linha de visão por volumes simples, solução, potência, capacitor, recarga, munição, massa e subsistema. Escudos têm quatro setores; casco tem quatro seções e integridade derivada de quatro subsistemas.  
**Motivo:** preserva justiça, testabilidade sem GPU, independência de FPS e fonte única de verdade.  
**Consequências:** valores são conteúdo provisório; VFX sofisticado não pertence ao domínio e fica para P0.5. Rapier continua desnecessário no P0.

## DECISION-021 — Composição visual tática original para o P0.5

**Status:** aceita como direção, pendente de validação visual e de desempenho  
**Problema:** a cena P0.4 prova regras, mas ainda não entrega a leitura dramática e integrada esperada na referência visual do usuário.  
**Opções consideradas:** manter painéis de diagnóstico centrais; copiar a referência; reinterpretar a hierarquia em identidade própria.  
**Decisão:** o P0.5 buscará câmera externa com a nave do jogador grande e legível, alvo à frente, starfield denso, brackets/linha/retículo no espaço, objetivo à esquerda, nave/escudos/sistemas embaixo à esquerda, alvo embaixo à direita e combate claramente visível na cena. A composição, os nomes, os símbolos e os assets serão originais, sem reprodução pixel a pixel, logos ou elementos protegidos de Star Trek.  
**Motivo:** atende a expectativa de simulador espacial tático e mantém segurança de propriedade intelectual.  
**Consequências:** o overhaul visual só começa após aprovação do P0.4 e deve respeitar presets e benchmark do notebook alvo.

## DECISION-022 — UI-1 antecipa somente a hierarquia de apresentação

**Status:** aceita por prioridade explícita do usuário; pendente de revisão visual  
**Problema:** a apresentação provisória centralizada não comunicava a experiência tática desejada, mas P0.4 ainda possui findings e P0.5 não está autorizado.  
**Opções consideradas:** aguardar todo o P0.4; iniciar o overhaul/VFX P0.5; entregar uma camada de apresentação limitada e segura.  
**Decisão:** UI-1 reorganiza apenas DOM/CSS, câmera, starfield barato, retículo e marcador por DTO público. Usa paleta naval original, drawers recolhíveis, texto a 8 Hz e transformações do marcador por frame. A ordem semântica é objetivo, ações táticas, energia e sessão; dados de subsistemas e quatro setores de escudo pertencem ao cartão do jogador. O marcador projeta somente observação pública, congela e usa rótulo/traço próprios durante memória; a malha remota é ocultada quando não existe observação atual. Nenhum deles lê posição inimiga oculta. O preset baixo mantém no máximo 18 draw calls e 96 asteroides.  
**Motivo:** atende à prioridade visual sem alterar regras de combate, adicionar assets externos ou mascarar o gate P0.4.  
**Consequências:** naquele ciclo, P0.4 continuou bloqueado até concluir correções e E2E terminal; esse estado foi substituído por `DECISION-024`. A composição UI-1 torna-se baseline de apresentação, sujeita à revisão do Product Architect.

## DECISION-023 — UI-GFX usa efeitos originais em pool e adaptador não autoritativo

**Status:** aceita por prioridade explícita do usuário; pendente de revisão gráfica  
**Problema:** a UI-1 organizou a leitura tática, mas a cena ainda precisava comunicar silhueta, combate, escudo e dano sem retomar regras pendentes do P0.4 nem antecipar o benchmark P0.5.  
**Opções consideradas:** alterar eventos/regras do domínio; instanciar VFX a cada disparo; manter somente feedback textual; adicionar uma camada visual limitada sobre snapshots públicos.  
**Decisão:** UI-GFX mantém o domínio intacto e usa materiais/primitivas originais, iluminação sem sombras, três estados visuais de casco e pool fixo de 12 entidades para projétil, duas linhas/feixes e dois impactos. O adaptador confirma comandos do jogador no fixed-step seguinte por resultados públicos (dano observado, munição ou trator ativo), retém a apresentação por 1,5 s e combina no máximo dois efeitos deduplicados. Contato não observado não fornece posição, LOD ou dano ao renderer.  
**Motivo:** torna feixe, torpedo, trator, impactos e dano legíveis, inclusive sob sobrescrita do slot de efeito pela IA, sem criar segunda autoridade ou crescimento por disparo.  
**Consequências:** o preset baixo mantém teto automatizado de 28 draw calls com VFX combinados, 96 asteroides e 680 estrelas instanciadas em uma chamada. As silhuetas procedurais usam fuselagem, proa, pylons, motores emissivos e LOD próprio; corpos celestes não ocupam a área segura do HUD. Na repetição daquele ciclo, a apresentação UI passou em 20/20 casos e o adaptador em 10/10 unitários, mas o fluxo gráfico-combate falhou em 0/2 por perda do marcador antes do alinhamento. Esse bloqueio foi resolvido posteriormente em `DECISION-024`. As medições atuais são diagnósticas; partículas, decals/peças finais, assets e benchmark físico continuam no P0.5.

## DECISION-024 — Torpedo físico e estabilização do encontro P0.4

**Status:** aceita pelo coordenador; revisão formal do Product Architect pendente  
**Problema:** o fluxo integrado variava conforme o tempo real do navegador. O roteiro tentava pilotar com foco em botões, e o torpedo resolvia sua viagem apenas por distância inicial, exigindo observação exatamente no instante do impacto. A cadência inimiga também podia destruir sensores antes da primeira decisão tática.  
**Opções consideradas:** relaxar/remover testes; manter impacto automático; criar modo especial de teste; corrigir foco, trajetória e balanceamento do encontro real.  
**Decisão:** comandos de voo E2E devolvem foco ao canvas após ações em botões. O torpedo passa a manter posição própria, atualizar a solução apenas sob observação atual, seguir inercialmente a última solução conhecida e aplicar dano somente quando o segmento percorrido intercepta o raio físico do alvo; perder a solução ou exceder alcance encerra o projétil sem dano. A posição autoritativa do alvo participa apenas da colisão interna e não orienta nem é publicada durante memória. A interceptadora usa multiplicador provisório de recarga 3×, garantindo uma janela de reação testada de seis segundos sem remover derrota possível.  
**Motivo:** preserva percepção justa, torna o projétil rastreável e evitável, mantém a semântica acessível dos controles e estabiliza o encontro real sem caminho exclusivo para automação.  
**Consequências:** `verify` passa com 123/123 testes; o fluxo crítico feixe/torpedo/trator mais vitória/reinício passa 12/12 em três repetições por navegador; a matriz completa passa 38/38 em Chrome/Edge, sem `skip`. O bloqueio técnico do ciclo 2 foi removido, mas o gate P0.4 ainda aguarda revisão formal. Cadência, raio de colisão e demais números continuam provisórios até playtest/benchmark P0.5.

## DECISION-025 — Benchmark P0.5 explícito, determinístico e limitado

**Status:** aceita e encerrada por `DECISION-027`  
**Problema:** diagnósticos pontuais de FPS/draw calls da arena jogável não representam uma carga fixa e não produzem percentis comparáveis entre GPU, navegador e preset. Também não podem ser confundidos com o gate físico do hardware alvo.  
**Opções consideradas:** medir manualmente o encontro variável; criar uma cena separada duplicando renderer/VFX; adicionar um modo de benchmark explícito sobre o mesmo adaptador visual.  
**Decisão:** a URL `?benchmark=1` ativa uma carga exclusivamente visual sobre o adaptador da arena, sem alterar regras ou snapshots autoritativos. Os presets baixo/médio/alto definem resolução, antialiasing, LOD, 4/6/8 naves, 96/144/192 asteroides, 680/900/1.200 estrelas e 1/2/3 estados de dano simultâneos. O cenário usa movimentos derivados de índice/tempo, mantém dois efeitos e um projétil do pool e coleta até 7.200 frametimes após aquecimento. O relatório expõe FPS médio, p50, p95, p99 e pior quadro.  
**Motivo:** preserva o mesmo renderer e os mesmos recursos visuais do jogo, cria uma carga repetível e impede crescimento ilimitado de amostras/objetos.  
**Consequências:** E2E pode validar a conclusão da coleta, mas números headless, aba em segundo plano ou janela curta são apenas diagnósticos. A UHD 620 passou o perfil baixo em janela física. A URL aceita `backend=webgpu` apenas para comparação e usa WebGL 2 como fallback; WebGL 2 continua o padrão porque a comparação UHD não mostrou benefício material. O modo de benchmark não pode fornecer informação de combate ao jogo nem se tornar caminho alternativo para vencer encontros. A exigência posterior de medir uma GPU específica foi substituída por `DECISION-027`.

## DECISION-026 — Dano visual por seção e impacto direcional com orçamento fixo

**Status:** aceita e aprovada no gate P0.5 por `DECISION-027`  
**Problema:** os três estados globais de casco da UI-GFX indicavam severidade, mas não mostravam onde o impacto ocorreu, qual seção foi danificada ou qual subsistema ficou inoperante. Criar partículas e decalques a cada acerto faria o custo crescer durante combates longos.  
**Opções consideradas:** manter apenas estado global; gerar VFX dinamicamente por acerto; preparar recursos fixos por seção e derivá-los do snapshot público.  
**Decisão:** cada nave possui quatro decalques preparados para proa, popa, bombordo e estibordo e um pool fixo de três sparks geométricos. O preset limita a 1/2/3 seções com sparks simultâneos. Materiais, emissivos e visibilidade dos decalques derivam dos estados lógicos públicos; motores, escudos, armas e sensores escurecem quando o respectivo subsistema está desativado. O setor de impacto acompanha o efeito confirmado e desloca feixe/impacto para a superfície direcional do alvo. Informações remotas de seção e subsistema são ocultadas quando o contato está apenas na memória.  
**Motivo:** torna dano e escudos direcionais legíveis, preserva a percepção do domínio e mantém quantidade de entidades limitada independentemente da duração do combate.  
**Consequências:** testes de apresentação e E2E devem conferir seção atingida, subsistema desativado, setor do impacto e ocultação em memória. O teto automatizado de draw calls do combate no preset baixo sobe de 28 para 36 para comportar recursos preparados; qualquer aumento posterior exige benchmark. Os efeitos continuam procedurais e sem assets externos.

## DECISION-027 — Desempenho escalável sem vínculo obrigatório a uma GPU

**Status:** aceita por requisito explícito do usuário; gate P0.5 aprovado  
**Problema:** o gate inicial exigia selecionar e medir especificamente a MX130 em 1600×900/médio. O usuário esclareceu que não deseja personalização por placa de vídeo: o requisito real é manter o jogo leve e sem travamentos. O navegador já havia escolhido a UHD 620 e produzido uma medição física acelerada suficiente para avaliar o pior perfil disponível no notebook.  
**Opções consideradas:** alterar a preferência de GPU do Windows; manter a MX130 como bloqueio; eliminar métricas; usar presets escaláveis e um gate independente do modelo de GPU.  
**Decisão:** não alterar preferências do sistema operacional nem exigir um adaptador específico. O jogo mantém baixo/médio/alto e seleciona um ponto de partida conservador, sempre com WebGL 2 funcional. O gate de regressão usa o cenário determinístico na GPU acelerada efetivamente escolhida pelo navegador: no preset suportado, exige média de pelo menos 30 FPS e p99 de até 50 ms, sem crescimento de entidades/VFX. A medição de uma segunda GPU permanece diagnóstico opcional. Recursos futuros que romperem esse limite devem reduzir carga, resolução ou efeitos antes de avançar. O passo lógico fixo de 60 Hz é confirmado, com limite de recuperação e descarte explícito de tempo excedente.  
**Motivo:** mede a experiência percebida — fluidez e ausência de pausas recorrentes — sem acoplar o produto à configuração de um único notebook. A UHD 620/baixo em 1280×720 registrou 60,010 FPS, p95 de 17,9 ms e p99 de 18,9 ms em WebGL 2 durante 30 s, fornecendo uma referência conservadora já aprovada.  
**Consequências:** P0.5 e o gate formal do P0 são aprovados sem medição obrigatória da MX130; P1 pode começar. O benchmark permanece obrigatório para regressões gráficas relevantes. WebGPU continua opcional, pois não apresentou ganho material. Não há autorização para remover presets, LOD, instancing, pools ou limites de carga.

## DECISION-028 — Primeira missão reutiliza a arena e os sensores autoritativos

**Status:** aceita para a primeira subfatia P1  
**Problema:** o P1 precisa provar um ciclo base–missão–retorno antes de adicionar mapa, novos setores e persistência, sem duplicar o estado do contato ou aumentar a carga gráfica.  
**Opções consideradas:** criar imediatamente mapa, setor e save completos; controlar a missão pela UI; criar uma máquina de estados de domínio pequena e integrá-la à arena existente.  
**Decisão:** `Levantamento de Nereida` usa uma máquina de estados determinística com briefing, partida, levantamento, retorno e conclusão. O objetivo só é satisfeito quando o snapshot público dos sensores identifica o ID configurado; HUD e PlayCanvas não se tornam autoridades. Partida/retorno usam transição temporal curta e bloqueiam voo, enquanto a conclusão reinicia o encontro para representar reparo, energia e reabastecimento na base. A ação contextual permite repetir o ciclo.  
**Motivo:** entrega uma missão jogável completa em sessão com regras testáveis sem GPU, reutiliza os sistemas P0 e não adiciona biblioteca, entidade ou efeito gráfico.  
**Consequências:** a missão inicialmente não sobrevivia a reload e a viagem não tinha mapa/apresentação própria. A persistência foi resolvida por `DECISION-029`; mapa e apresentação de viagem foram resolvidos posteriormente por `DECISION-031`.

## DECISION-029 — Snapshots transacionais e checkpoints seguros no save local

**Status:** aceita para a segunda subfatia P1  
**Problema:** o progresso da primeira missão precisava sobreviver a reload sem salvar estados instáveis, corromper o último registro válido ou transformar IndexedDB em dependência do domínio. Corrupção, versão incompatível e indisponibilidade de armazenamento também precisavam produzir recuperação visível.  
**Opções consideradas:** salvar diretamente um único objeto; usar `localStorage`; adicionar uma biblioteca de persistência; manter snapshots próprios atrás de repositório com ponteiro ativo transacional.  
**Decisão:** o progresso usa `SaveRepository` e um adaptador IndexedDB próprio, sem nova dependência. O envelope atual é v2, com timestamp ISO UTC, checksum FNV-1a de integridade e payload estruturalmente validado; uma fixture v1 comprova a migração sequencial v1 → v2. Cada gravação cria um snapshot e atualiza o ponteiro ativo na mesma transação, mantendo no máximo três snapshots. A missão salva apenas `briefing` e `completed`: viagem, levantamento, retorno e combate retomam do briefing. Save inválido ou conteúdo incompatível é preservado, inicia uma sessão segura e bloqueia gravações automáticas até uma ação explícita de recuperação. O modo de benchmark não acessa a persistência.  
**Motivo:** entrega retomada local, rollback implícito em falha transacional e tratamento acionável sem backend, biblioteca, segredo ou estado autoritativo na UI/engine. Checksum detecta dano acidental e não pretende impedir trapaça.  
**Consequências:** o payload inicialmente persistia o checkpoint da primeira missão e foi estendido às demais missões pela `DECISION-030` sem mudança estrutural. Configurações continuam separadas e pendentes. Toda expansão do formato exige validação e migração testada; estados transitórios não podem virar autosave sem novo ponto seguro explícito.

## DECISION-030 — Três missões tutoriais reutilizam uma campanha e perfis de encontro

**Status:** aceita por prioridade explícita do usuário para a terceira subfatia P1  
**Problema:** o jogador precisava aprender sensores, assistência e combate em três missões iniciais sem receber todas as ações ao mesmo tempo, duplicar regras existentes ou tornar a UI/engine autoridades da progressão. A sequência também precisava continuar segura após reload.  
**Opções consideradas:** três fluxos específicos acoplados ao boot; tutorial apenas textual sobre a arena hostil; campanha de domínio orientada a dados com objetivos validados por eventos autoritativos.  
**Decisão:** usar uma campanha determinística ordenada com objetivos `identify-contact`, `tractor-lock` e `combat-victory`. O conteúdo define briefing, instruções, contato, disposição e equipamentos permitidos. Os encontros das duas primeiras missões são passivos e liberam, respectivamente, nenhum armamento e somente o raio trator; a terceira missão restaura o perfil hostil e todo o arsenal. A aplicação converte snapshots já validados de sensores, trator e combate em eventos de objetivo. Apenas `briefing` e `completed` são checkpoints. O envelope permanece v2 porque seu contrato já era `{ missionId, checkpoint }`; mudar a versão sem alterar a estrutura criaria uma migração artificial.  
**Motivo:** ensina uma mecânica por vez, reutiliza os sistemas P0, mantém regras testáveis sem GPU e preserva saves existentes que concluíram a primeira missão. Um save concluído de `Levantamento de Nereida` oferece diretamente a segunda missão.  
**Consequências:** as três missões inicialmente compartilhavam a mesma arena e o mesmo ID lógico de contato, com nomes e perfis diferentes. `DECISION-031` preservou a bolha tática reutilizada, mas atribuiu setor, contato e posição próprios a cada missão e entregou o mapa/viagem. Diário ampliado, áudio e configurações continuam pendentes. Novos tipos de objetivo devem ser adicionados como dados e eventos explícitos, sem inferência na UI.

## DECISION-031 — Navegação lógica e raízes gráficas fixas separam base, viagem e encontro

**Status:** aceita para a quarta subfatia P1 (P1-A)  
**Problema:** briefing, partida e retorno existiam apenas como fases temporais sobre a arena ativa. O jogador não tinha mapa, as missões reutilizavam o mesmo contato lógico e o estado de base podia manter apresentação tática incompatível com uma doca segura. A solução não podia introduzir universo 1:1, física orbital, crescimento de entidades ou novo checkpoint instável.  
**Opções consideradas:** carregar uma cena PlayCanvas distinta a cada estado; simular deslocamento contínuo entre coordenadas astronômicas; manter um grafo lógico no domínio e alternar grupos gráficos prealocados.  
**Decisão:** o Sistema Hélios é conteúdo imutável validado, composto por Base Aurora, três nós de missão, dois pontos de interesse e rotas bidirecionais com distância e duração artísticas. Uma sessão de domínio controla `base`, `map`, `travel` e `encounter`, seleção de destino e falhas estruturadas. A campanha exige o destino da missão atual, usa a duração da rota nas fases `outbound`/`returning` e conserva apenas os checkpoints v2 `briefing`/`completed`. O PlayCanvas cria uma única vez raízes de base e bolha tática, alterna visibilidade e zera VFX fora do encontro; a viagem é uma apresentação DOM/CSS leve. Cada missão recebe ID e posição de contato próprios.  
**Motivo:** torna o ciclo espacial coerente e testável sem GPU, mantém a base segura, evita precisão e carregamento desnecessários e preserva o orçamento já aprovado. O DOM existente suporta mapa, foco e feedback sem justificar framework.  
**Consequências:** não há combate na base ou na viagem; reparo, energia e munição só são restaurados ao concluir o retorno. Reload transitório volta ao briefing seguro e o schema de save continua v2. Novos setores entram como conteúdo validado, mas múltiplos sistemas, simulação orbital e streaming complexo permanecem fora do MVP. O benchmark de regressão em UHD 620/1600×900/médio manteve 60,01 FPS médios e p99 de 18,0 ms.

## DECISION-032 — Menu modal de sessão e painel derivado tornam a base a fronteira segura

**Status:** aceita para a quinta subfatia P1 (P1-B)  
**Problema:** o jogo carregava diretamente a apresentação tática, sem uma fronteira clara entre escolha de sessão, progresso salvo e preparação na base. Uma nova sessão não podia substituir silenciosamente o progresso, mas o menu também não deveria se tornar autoridade da campanha, nave ou persistência.  
**Opções consideradas:** manter ações no HUD da arena; criar páginas e recarregar a aplicação para cada tela; usar um estado efêmero pequeno na aplicação e uma camada modal DOM sobre a sessão carregada.  
**Decisão:** `src/application/session-menu.ts` controla apenas as visões `home`, `settings`, `diagnostics` e `credits`, abertura, fechamento e retorno. A aplicação continua dona da campanha, save, navegação e encontro; o shell deriva deles a telemetria do menu e da base. A sessão inicia atrás do menu, com superfícies de jogo inertes e entradas táticas bloqueadas. `Continuar` fecha a fronteira somente para checkpoint válido; `Novo treinamento` exige `dialog` nativo quando existe progresso e reinicia campanha/encontro no primeiro briefing após confirmação. O comando da base expõe recursos restaurados, três estados de missão e a ação de abrir o mapa, sem duplicar estado persistente.  
**Motivo:** entrega navegação por teclado, foco previsível, proteção de progresso e base semanticamente distinta com DOM existente, sem framework, novo schema, asset ou carga da cena.  
**Consequências:** configurações ainda são apenas uma entrada informativa e serão implementadas em P1-C em repositório separado. Créditos identificam a autoria procedural atual, mas o inventário formal continua em P1-G. O menu pode ser reaberto somente da base; mapa, viagem e encontro permanecem estados próprios e não aceitam comandos enquanto a fronteira modal estiver aberta.

## DECISION-033 — Preferências v1 em localStorage permanecem separadas do progresso

**Status:** aceita para a sexta subfatia P1 (P1-C)  
**Problema:** preset, HUD, áudio futuro, redução de efeitos e entrada precisavam sobreviver ao reload e estar disponíveis antes da criação da cena, sem migrar o save da campanha, ocultar configuração inválida ou tornar DOM/PlayCanvas autoridades.  
**Opções consideradas:** incluir preferências no envelope IndexedDB v2; criar outro banco IndexedDB assíncrono; usar envelope versionado pequeno em `localStorage` atrás de repositório próprio.  
**Decisão:** `GameSettings` possui schema v1 estrito e chave `stellar-command-game-settings` exclusiva. A aplicação ativa defaults conservadores quando não há registro; versão, JSON ou valor inválido preserva o original, mostra recuperação e só o substitui após restauração/alteração explícita. Preset persistido vale no próximo boot, salvo override diagnóstico por query; HUD, mouse, teclas e reduções de VFX são aplicados imediatamente. Volumes são persistidos agora e alimentam o adaptador de áudio na P1-F. As cinco ações táticas usam allowlist sem duplicidade; voo, pausa, tela cheia, limpar alvo e reiniciar permanecem fixos. Benchmark desativa acesso às duas persistências.  
**Motivo:** leitura síncrona antecede a cena, o payload é pequeno e local, e a separação impede configuração de alterar checkpoint ou exigir migração artificial do save. Validação e controlador continuam testáveis sem DOM/GPU, enquanto adaptadores recebem somente preferências válidas.  
**Consequências:** `localStorage` não é adotado para progresso; futura mudança estrutural das preferências exige nova versão/migração. Preset precisa de reload porque a criação do dispositivo gráfico não é refeita em runtime. P1-D ainda revisará teclado, contraste, anúncios e movimento; P1-F consumirá os três volumes já persistidos.

## DECISION-034 — Acessibilidade do MVP usa foco modal e anúncios deduplicados no shell

**Status:** aceita para a sétima subfatia P1 (P1-D)  
**Problema:** a base já oferecia controles nativos e redução de efeitos, mas o mapa não era uma fronteira modal completa, o foco podia permanecer em um botão oculto durante viagem/encontro, textos tutoriais continuavam citando teclas padrão após remapeamento e várias regiões vivas podiam repetir telemetria. A correção não deveria duplicar estado autoritativo, mover regras para o DOM ou adicionar uma biblioteca de UI/acessibilidade.  
**Opções consideradas:** adicionar framework/componente modal e biblioteca de auditoria em runtime; anunciar todo o HUD publicado a 8 Hz; manter controles nativos e criar uma coordenação pequena de foco, atalhos e anúncios no adaptador DOM.  
**Decisão:** menu e mapa contêm o foco por ordem DOM natural, deixam o restante inerte e restauram/transmitem foco para base, viagem ou canvas conforme a navegação. Objetivos, feedback alterado e resultado terminal alimentam regiões `aria-live` polite/assertive separadas por chaves estáveis; telemetria contínua não é republicada. O conteúdo tutorial usa tokens simbólicos formatados na aplicação a partir de bindings validados, e o shell sincroniza texto e `aria-keyshortcuts` dos botões. Escudos, subsistemas e energia recebem nomes completos e valores textuais; cores preservam contraste AA e `forced-colors` recebe geometria/foco explícitos.  
**Motivo:** fecha teclado, semântica, remapeamento e leitor de tela com a arquitetura existente, sem dependência, novo estado persistente ou import de DOM no domínio. Deduplicação por transição evita inundar tecnologia assistiva e mantém a publicação visual idempotente.  
**Consequências:** a escala máxima continua 110%; em 1280×720 a barra tática ampliada usa duas linhas para manter rótulos/teclas visíveis sem ocupar o centro de mira. Remapeamento ampliado, perfis de daltonismo e auditoria com usuários de tecnologias assistivas permanecem melhorias P2; P1-E pode reutilizar os mesmos landmarks e anúncios para o diário, mas não deve transformar atualizações de lista em telemetria falada contínua.

## DECISION-035 — Diário mínimo é uma projeção do checkpoint seguro v2

**Status:** aceita para a oitava subfatia P1 (P1-E)  
**Problema:** o MVP exige objetivo atual, progresso e descobertas persistentes sem duplicação, mas a campanha é linear e o save v2 já identifica a missão e o checkpoint seguro. Persistir outra lista exigiria schema v3, migrações e reconciliação entre duas representações da mesma conclusão.  
**Opções consideradas:** criar array de descobertas no schema v3; usar outro registro em `localStorage`; derivar uma entrada por definição imutável a partir do checkpoint v2.  
**Decisão:** `mission-journal.ts` valida a coleção orientada a dados e projeta exatamente uma entrada por ID. Missões anteriores ao checkpoint, e a missão atual quando concluída, expõem sua descoberta; a próxima permanece atual e as demais bloqueadas. Objetivo e instruções usam a telemetria já formatada da missão. ID desconhecido, definição duplicada ou snapshot inconsistente produz estado `unavailable` com mensagem segura. O shell apenas renderiza a projeção idempotente no menu, acessível também pela base.  
**Motivo:** o checkpoint linear contém toda a informação necessária para `0/3` a `3/3`; derivação elimina duplicação por reload/repetição e mantém domínio, conteúdo, persistência e DOM nas fronteiras existentes.  
**Consequências:** o schema permanece v2 e a migração v1 → v2 não muda. Campanha ramificada, descoberta opcional independente ou reordenação retroativa exigirá novo modelo/schema antes do P2. O diário completo e catálogo expandido continuam P2; áudio P1-F pode reagir à mudança de conclusão, mas não se torna autoridade do registro.

## DECISION-036 — Áudio procedural reage a transições públicas e só inicia por gesto

**Status:** aceita para a nona subfatia P1 (P1-F)  
**Problema:** efeitos e ambiente precisavam reforçar seleção, scan, combate, energia e missão sem copiar propriedade intelectual, iniciar contra a política do navegador, criar outra fonte de verdade ou acumular fontes ao pausar e trocar de setor. Mute também precisava sobreviver ao reload, mas o schema v1 de preferências não possuía esse campo.  
**Opções consideradas:** importar biblioteca e arquivos de áudio externos; acoplar fontes PlayCanvas diretamente aos comandos; rotear transições públicas para um adaptador Web Audio procedural, preguiçoso e limitado.  
**Decisão:** `audio-cue-router.ts` compara snapshots públicos e emite sinais semânticos idempotentes para seleção/scan, armas, impactos, avisos, objetivo, vitória/derrota e viagem. `game-audio.ts` limita efeitos a dez vozes lógicas, substitui ambiente ao mudar entre base/viagem/encontro e interrompe fontes em mute, pausa, perda de foco e descarte. `web-audio-backend.ts` só cria `AudioContext` dentro de `unlock()` chamado por clique, sintetiza sequências tonais próprias com osciladores e não carrega arquivo, voz ou música. Estado indisponível/erro permanece visível e o jogo segue funcional. `GameSettings` passa ao schema v2 com `audioMuted`; registros v1 migram automaticamente com mute desativado e são regravados sem alterar o save da campanha.  
**Motivo:** a síntese reduz download, licença e memória, preserva identidade original e permite provar gesto, limite e descarte com adaptadores falsos. Transições públicas mantêm áudio, HUD e VFX alinhados sem reexecutar regra de gameplay.  
**Consequências:** o áudio do MVP é discreto e não posicional; paisagem autoral gravada e espacialização podem ser avaliadas em P2 somente com licença e orçamento medidos. O inventário P1-G registra que não há arquivos sonoros externos. Mudanças futuras em preferências exigem migração a partir do schema v2. O benchmark continua sem criar contexto de áudio e preservou o gate na UHD 620.

## DECISION-037 — Manifesto validado publica assets somente após uma troca atômica

**Status:** aceita para a décima subfatia P1 (P1-G)  
**Problema:** o build usava somente recursos procedurais e não possuía asset distribuído, catálogo, inventário humano ou recuperação específica. Adicionar arquivos sem fronteira permitiria caminho inválido, integridade divergente, atribuição ausente, tela quebrada ou crescimento de recursos. A solução também precisava funcionar sob subdiretório e não transformar uma marca visual substituível em bloqueio do jogo.  
**Opções consideradas:** manter créditos apenas textuais; importar arquivos diretamente em componentes; criar um manifesto local estrito e um carregador transacional com fallback próprio.  
**Decisão:** o primeiro asset é o emblema vetorial original `ui.brand-mark`. `asset-manifest.json` schema v1 registra caminho relativo, MIME, bytes, SHA-256, dependências, autoria, origem, termo e data. O validador de conteúdo rejeita versão/campo/tipo/caminho/dependência/atribuição inválidos e limita o catálogo inicial a 60 MB. O carregador resolve URLs por `document.baseURI`, confere todos os recursos antes de criar/publicar URLs temporárias e revoga-as no descarte. Falha usa o símbolo CSS `CE`, mantém a sessão pronta e oferece retry sem reload. `npm run assets:check`, incorporado ao build, rejeita arquivo público não registrado, hash/tamanho/tipo divergente e dependência de runtime com versão ou licença incompatível. Créditos e `docs/ASSET_LICENSES.md` inventariam PlayCanvas MIT, recursos próprios e a ausência de áudio/fontes externas.  
**Motivo:** uma fronteira verificável torna licença, origem e integridade parte do gate sem exigir pipeline 3D prematuro. A troca atômica impede estado parcialmente carregado; o fallback preserva UC-10 e o caminho relativo preserva futura hospedagem em subdiretório.  
**Consequências:** o projeto agora possui `public/assets/` porque existe um arquivo real de 1.107 bytes. Novos assets devem entrar no mesmo manifesto, passar `assets:check`, declarar licença e respeitar orçamento antes do commit. `LicenseRef-Project-Authored` autoriza o recurso próprio neste build privado, mas o pacote continua `private`/`UNLICENSED`; publicação ainda exige decisão do titular. O gate passou com 198/198 testes, 78/78 E2E e benchmark UHD 620/médio de 60,011 FPS e p99 20,4 ms. P1-H continua responsável por offline/PWA, balanceamento, instalação limpa e revisão formal do MVP.

## Decisões futuras não bloqueantes

| Tema | Padrão até decidir | Gate |
| --- | --- | --- |
| Nome/lore final | identidade original provisória | antes de produzir arte final/publicar |
| 30 Hz ou 60 Hz fixos | 60 Hz confirmado em `DECISION-027` | reavaliar só com evidência nova |
| WebGPU preferencial | WebGL 2 confirmado em `DECISION-027` | reavaliar só com evidência nova |
| GitHub ou Cloudflare Pages | apenas build local | preparação de publicação |
| PWA/cache offline | sem service worker | P1 após medir atualização e tamanho |
| Framework de UI | DOM simples | só se complexidade de P1 justificar |
| Rapier | cinemática/volumes simples | só com necessidade física medida |
