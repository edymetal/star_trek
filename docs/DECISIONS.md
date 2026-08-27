# Registro de decisões

Versão: 1.0 — 20 de agosto de 2026

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
**Consequências:** P0.4 continua bloqueado até concluir correções e E2E terminal; P0.5 continua bloqueado para VFX, dano visual e benchmark. A composição UI-1 torna-se baseline de apresentação, sujeita à revisão do Product Architect.

## DECISION-023 — UI-GFX usa efeitos originais em pool e adaptador não autoritativo

**Status:** aceita por prioridade explícita do usuário; pendente de revisão gráfica  
**Problema:** a UI-1 organizou a leitura tática, mas a cena ainda precisava comunicar silhueta, combate, escudo e dano sem retomar regras pendentes do P0.4 nem antecipar o benchmark P0.5.  
**Opções consideradas:** alterar eventos/regras do domínio; instanciar VFX a cada disparo; manter somente feedback textual; adicionar uma camada visual limitada sobre snapshots públicos.  
**Decisão:** UI-GFX mantém o domínio intacto e usa materiais/primitivas originais, iluminação sem sombras, três estados visuais de casco e pool fixo de 12 entidades para projétil, duas linhas/feixes e dois impactos. O adaptador confirma comandos do jogador no fixed-step seguinte por resultados públicos (dano observado, munição ou trator ativo), retém a apresentação por 1,5 s e combina no máximo dois efeitos deduplicados. Contato não observado não fornece posição, LOD ou dano ao renderer.  
**Motivo:** torna feixe, torpedo, trator, impactos e dano legíveis, inclusive sob sobrescrita do slot de efeito pela IA, sem criar segunda autoridade ou crescimento por disparo.  
**Consequências:** o preset baixo mantém teto automatizado de 28 draw calls com VFX combinados, 96 asteroides e 680 estrelas instanciadas em uma chamada. As silhuetas procedurais usam fuselagem, proa, pylons, motores emissivos e LOD próprio; corpos celestes não ocupam a área segura do HUD. A apresentação UI passa em 20/20 casos e o adaptador em 10/10 unitários, mas o fluxo gráfico-combate falhou em 0/2 na repetição final por perda do marcador antes do alinhamento. As medições atuais são diagnósticas; partículas, decals/peças finais, assets e benchmark físico continuam no P0.5. P0.4 permanece bloqueado e seus findings lógicos não foram resolvidos por esta decisão.

## Decisões futuras não bloqueantes

| Tema | Padrão até decidir | Gate |
| --- | --- | --- |
| Nome/lore final | identidade original provisória | antes de produzir arte final/publicar |
| 30 Hz ou 60 Hz fixos | 60 Hz parametrizado | benchmark P0.5 |
| WebGPU preferencial | WebGL 2 | fim de P0.5 |
| GitHub ou Cloudflare Pages | apenas build local | preparação de publicação |
| PWA/cache offline | sem service worker | P1 após medir atualização e tamanho |
| Framework de UI | DOM simples | só se complexidade de P1 justificar |
| Rapier | cinemática/volumes simples | só com necessidade física medida |
