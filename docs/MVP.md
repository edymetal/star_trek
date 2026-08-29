# Escopo priorizado do MVP

Status: P0 concluído; P1 em implementação  
Atualizado em: 29 de agosto de 2026

O P0 é um protótipo técnico jogável, não o jogo completo. O MVP demonstrável é formado por todo o P0 e pelo subconjunto P1 descrito aqui. P2 e P3 não podem consumir esforço enquanto houver falha crítica/alta, meta de desempenho não atendida ou fluxo incompleto em P0/P1.

## P0 — obrigatório para provar o produto

### P0.1 Fundação verificável

- projeto TypeScript estrito com PlayCanvas Engine standalone e Vite;
- scripts de desenvolvimento, lint, typecheck, testes e build;
- estrutura modular que separe domínio, aplicação, renderização, interface e dados;
- uma página/cena inicial com diagnóstico de WebGL 2, renderizador, FPS e preset;
- build totalmente estático, sem backend, login ou serviço externo em runtime.

Concluído quando `dev`, lint, typecheck, testes e build funcionarem; a cena carregar em Chrome e Edge; e uma falha de compatibilidade mostrar instrução em vez de tela vazia.

### P0.2 Arena e voo

- arena local contendo nave do jogador, uma nave inimiga, uma base visual, planeta, lua, estrela e asteroides instanciados;
- controles de teclado/mouse, assistência de voo, impulso e câmera externa;
- pausa, perda/retorno de foco e tela cheia sem prender entrada;
- volumes de colisão simples e limites claros da arena.

Concluído quando o jogador navegar e enquadrar alvos de maneira estável, com movimento independente da taxa de quadros.

### P0.3 Energia e HUD

- reator, reserva e alocação limitada entre motores, escudos, armas e auxiliares/sensores;
- presets equilibrado, ataque, defesa e fuga;
- HUD provisório legível para velocidade, alvo, casco, escudos, arma, calor/recarga e energia;
- feedback imediato da alocação no comportamento de cada sistema.

Concluído quando testes provarem conservação/limites e um teste jogável demonstrar diferença perceptível entre os presets.

### P0.4 Sensores e combate

- contato desconhecido, seleção de alvo e escaneamento ativo;
- feixe de energia, torpedo e raio trator;
- escudos de frente, traseira, bombordo e estibordo;
- casco por seções e pelo menos motores, armas, escudos e sensores como subsistemas;
- IA inimiga com estados de patrulha/espera, perseguição, ataque e retirada;
- condições explícitas de vitória, derrota e reinício do encontro.

Concluído quando cada equipamento respeitar energia, alcance, linha de visão/solução de tiro, recarga e alvo válido; e o inimigo conseguir concluir um ciclo de combate sem conhecimento impossível.

### P0.5 Dano visual e benchmark

- impacto de escudo direcional;
- pelo menos três estados visuais de casco em seções preparadas;
- partículas/decalques limitados e efeitos de subsistema desativado;
- LOD da nave principal e instancing de asteroides;
- encontro de benchmark reproduzível, presets baixo/médio/alto e relatório de métricas.

Concluído quando o dano lógico e visual não divergirem; não houver crescimento ilimitado de efeitos; e o cenário mantiver pelo menos 30 FPS médios com p99 de até 50 ms no preset suportado pela GPU acelerada escolhida pelo navegador. A medição física UHD 620/baixo aprovou este gate; uma GPU específica não é requisito conforme `DECISION-027`.

### Gate de saída do P0

- todos os itens P0 concluídos;
- fluxo abrir → pilotar → escanear → combater/usar raio trator → pausar/configurar funciona;
- zero bug CRITICAL ou HIGH conhecido;
- testes essenciais, lint, typecheck e build passam;
- relatório do benchmark no hardware alvo;
- revisão do Product Architect aprova ou registra pendências não bloqueantes.

## P1 — importante para formar o vertical slice

- mapa de um sistema estelar em escala artística e transição de dobra/carregamento;
- base funcional com partida, retorno, reparo e reabastecimento;
- três missões curtas: exploração/escaneamento, assistência com raio trator e combate;
- duas variações de IA/nave inimiga ou neutra;
- persistência local versionada em IndexedDB, autosave seguro e recuperação de erro;
- diário de objetivo/descoberta e tutorial contextual curto;
- configurações persistentes, escala de HUD, redução de flashes/tremor e remapeamento essencial;
- áudio e feedback próximos da qualidade desejada;
- inventário de autoria/licença de todos os assets do build;
- cache offline/PWA somente se a medição mostrar que não complica atualizações e saves.

### Gate de saída do MVP (P0 + P1)

- ciclo base → missão → viagem → escaneamento → resolução → retorno completo;
- três missões concluíveis e reiniciáveis sem corromper estado;
- save reabre após fechar o navegador e migra entre versões de teste suportadas;
- 30 FPS médios ou mais e p99 de até 50 ms no preset suportado, sem travamentos recorrentes ou crescimento ilimitado de carga;
- Chrome e Edge passam nos fluxos críticos;
- zero bug CRITICAL ou HIGH conhecido;
- build, lint, typecheck e testes essenciais passam;
- nenhuma dependência, asset ou marca sem licença compatível.

## P2 — melhorias posteriores

- três sistemas estelares e duas bases com funções distintas;
- três a cinco classes de nave;
- oito a doze missões com variações e eventos;
- progressão de sistemas, reputação e duas facções originais;
- diário de bordo e catálogo de descobertas completo;
- gamepad, exportação/importação de save e controles totalmente remapeáveis;
- mais opções de acessibilidade e localização em inglês;
- ferramentas internas de edição/validação de dados e assets;
- avaliação de WebGPU como opção preferencial quando mais rápido no hardware medido.

## P3 — ideias futuras

- campanha longa e conteúdo procedural limitado por regras;
- comércio e salvamento mais profundo;
- tripulação e eventos narrativos;
- novas classes de armas e contramedidas;
- suporte a mais navegadores e dispositivos;
- pouso ou exploração planetária separada;
- interiores caminháveis;
- multiplayer cooperativo.

Pouso, interiores e multiplayer exigem nova especificação e arquitetura. Não são extensões pequenas do MVP.

## Itens explicitamente fora do MVP

- backend, conta, autenticação e ranking online;
- monetização, compras ou serviços pagos;
- galáxia 1:1 e física de N corpos;
- centenas de naves ativas;
- corte/destruição arbitrária de malha em runtime;
- assets, interface, música ou nomes copiados de Star Trek sem licença.

## Ordem de execução

1. P0.1 Fundação verificável.
2. P0.2 Arena e voo.
3. P0.3 Energia e HUD.
4. P0.4 Sensores e combate.
5. P0.5 Dano visual e benchmark.
6. Gate formal do P0.
7. P1 em fatias verticais pequenas, começando por uma missão completa.

Cada bloco admite no máximo cinco ciclos review → implement → test. Problemas restantes são registrados em `docs/KNOWN_ISSUES.md` quando esse arquivo se tornar necessário; bugs CRITICAL/HIGH continuam bloqueando o gate.
