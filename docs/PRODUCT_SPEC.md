# Especificação do produto

Status: P0 aprovado; P1 em implementação  
Atualizado em: 1 de setembro de 2026

Este é o documento canônico para o que o produto deve fazer. A pesquisa técnica, os orçamentos de arte e as fontes consultadas permanecem em [`PLANEJAMENTO.md`](../PLANEJAMENTO.md). Prioridades de entrega ficam em [`MVP.md`](MVP.md) e decisões técnicas em [`ARCHITECTURE.md`](../ARCHITECTURE.md) e [`DECISIONS.md`](DECISIONS.md).

## 1. Visão geral

Um jogo 3D de exploração e combate espacial executado no navegador, gratuito, single-player e capaz de funcionar offline após o carregamento dos arquivos. O jogador comanda uma nave, navega entre pontos de interesse, escaneia fenômenos e contatos, administra energia e resolve encontros por exploração, assistência, evasão ou combate.

A inspiração é a fantasia de comandar uma nave de ficção científica semelhante à vista em Star Trek. Para manter uma rota segura de publicação, a implementação usará identidade, nomes, modelos, sons e interface originais até que exista licença expressa para empregar propriedade intelectual de terceiros.

## 2. Objetivo

Entregar primeiro um protótipo técnico que prove os sistemas centrais e o desempenho no notebook alvo; depois evoluí-lo para um vertical slice com o ciclo completo:

> missão → preparação → viagem → escaneamento → decisão/exploração/combate → consequência → retorno e reparo

O jogo não pretende simular uma galáxia em escala física real. A prioridade é uma experiência legível, tática e visualmente convincente dentro do orçamento do hardware.

## 3. Público-alvo

- jogadores de desktop/notebook interessados em ficção científica, exploração e combate tático;
- pessoas que valorizam gerenciamento de nave mais do que ação puramente arcade;
- inicialmente, o próprio criador usando Windows 11, navegador Chromium atual, teclado e mouse;
- público de português brasileiro na primeira versão; internacionalização poderá ser adicionada depois.

Celulares, realidade virtual e consoles não fazem parte do alvo inicial.

## 4. Problema que o produto resolve

Oferece uma experiência gratuita e local de comando espacial que combina navegação, exploração e decisões táticas sem exigir instalação de um motor nativo, servidor, conta, assinatura ou hardware recente. O desafio de produto é fazer os sistemas interagirem: energia influencia voo, sensores, escudos e armas; danos afetam subsistemas; exploração produz objetivos e escolhas.

## 5. Princípios do produto

1. **Decisões antes de espetáculo:** efeitos devem comunicar estado e consequência.
2. **Desempenho é funcionalidade:** uma melhoria visual que rompe o orçamento do hardware não está pronta.
3. **Offline e gratuito:** nenhum fluxo central pode depender de serviço pago ou conexão permanente.
4. **Escopo progressivo:** P0 prova a base; P1 fecha o vertical slice; P2 e P3 só avançam depois.
5. **Conteúdo seguro:** todo asset deve ter autoria e licença conhecidas.
6. **Sistemas reutilizáveis:** naves e bases compartilham energia, escudos, armas, casco e subsistemas.

## 6. Funcionalidades principais

### 6.1 Navegação

- voo cinematográfico com yaw, pitch e roll, inércia moderada e assistência opcional;
- velocidade de impulso no espaço local e transição de dobra para longas distâncias;
- câmera externa principal e visão tática complementar;
- mapa setorial e pontos de interesse em uma versão posterior ao protótipo técnico.

### 6.2 Energia

- geração limitada pelo reator;
- alocação entre motores, escudos, armas e sistemas auxiliares/sensores;
- presets equilibrado, ataque, defesa e fuga, além de ajuste personalizado;
- efeito perceptível da energia em aceleração, regeneração, recarga, sensores e raio trator.

### 6.3 Combate e danos

- feixe de energia, torpedos e raio trator com papéis, custos e limites distintos;
- escudos direcionais em quatro setores;
- casco dividido em seções e subsistemas danificáveis;
- dano visual em estados preparados, com decalques, partículas, emissivos e peças destacáveis limitadas;
- IA básica capaz de perseguir, orientar o escudo, atacar, redistribuir energia e recuar.

### 6.4 Exploração

- detecção passiva e escaneamento ativo;
- identificação de nave, base, planeta, lua, estrela, asteroide, sinal e anomalia;
- contato inicialmente desconhecido, com informação revelada por alcance, tempo e energia;
- objetivos de investigação, assistência e recuperação, além de combate.

### 6.5 Base e progressão

- acoplagem ou aproximação segura à base;
- reparo, reabastecimento e seleção de missão;
- salvamento local versionado;
- progressão por missões e melhorias de sistemas somente depois de o ciclo base estar estável.

## 7. Funcionalidades secundárias

- diário de bordo e catálogo de descobertas;
- reputação simples por facção;
- controles remapeáveis e gamepad;
- exportação/importação manual do save;
- cache instalável como PWA;
- mais sistemas estelares, classes de nave, bases, anomalias e missões;
- áudio posicional e opções separadas de volume.

Multiplayer, interiores caminháveis, pouso em planetas, galáxia 1:1, física orbital completa e centenas de naves simultâneas estão fora do escopo do MVP.

## 8. Casos de uso

| ID | Ator | Caso de uso | Resultado esperado |
| --- | --- | --- | --- |
| UC-01 | Jogador | Iniciar ou continuar uma sessão | Cena jogável abre com preset compatível e save válido |
| UC-02 | Jogador | Pilotar e trocar a câmera | Nave responde de forma previsível, sem perda de controle ao pausar |
| UC-03 | Jogador | Redistribuir energia | Capacidades dos quatro sistemas mudam e o total é conservado |
| UC-04 | Jogador | Detectar e escanear um contato | Dados são revelados gradualmente conforme alcance e potência |
| UC-05 | Jogador | Atacar com feixe e torpedo | Custos, alcance, recarga, acerto, escudo e dano são aplicados |
| UC-06 | Jogador | Usar o raio trator | Alvo válido tem velocidade relativa alterada dentro dos limites |
| UC-07 | Jogador | Receber dano | Setor, casco, subsistema, HUD, áudio e efeitos exibem o mesmo estado |
| UC-08 | Jogador | Completar um objetivo e retornar | Missão fecha, consequência é registrada e serviços da base ficam disponíveis |
| UC-09 | Jogador | Alterar qualidade e controles | Mudança é aplicada e persistida sem quebrar a sessão |
| UC-10 | Sistema | Recuperar erro de save ou asset | O jogo informa o problema e oferece estado seguro sem travar silenciosamente |

## 9. Fluxo do usuário

1. Abertura carrega apenas o essencial e verifica WebGL 2, aceleração gráfica e preferências locais.
2. Menu oferece iniciar, continuar, configurações, diagnóstico e créditos/licenças.
3. Nova sessão começa com um tutorial contextual curto, sem exigir conta.
4. Na base, o jogador vê estado da nave, seleciona missão e prepara energia/equipamentos.
5. No espaço, pilota, consulta objetivo e escaneia contatos.
6. O encontro oferece ação compatível com a missão: investigar, resgatar, evitar ou combater.
7. Danos persistem até reparo; conclusão e descobertas atualizam o save.
8. Ao retornar à base, o jogador repara, recebe o resultado e escolhe o próximo objetivo.

O treinamento inicial materializa esse fluxo em três missões curtas e ordenadas: sensores/scan sem armamento, assistência com contato passivo e raio trator, e combate com energia, escudos e arsenal completo. A HUD libera ações gradualmente, informa a posição na sequência e preserva a conclusão de cada missão em checkpoint seguro.

O diário mínimo do MVP apresenta o objetivo atual, progresso de `0/3` a `3/3` e uma descoberta original por missão concluída. Os registros são derivados dos checkpoints seguros e dos IDs de conteúdo, portanto permanecem após reload sem duplicação; conteúdo incompatível resulta em mensagem segura e preservação do save.

O mapa inicial representa o Sistema Hélios em escala artística. A Base Aurora, os três setores de missão e dois pontos de interesse são nós lógicos ligados por rotas configuráveis; a viagem é uma transição apresentada, não deslocamento contínuo em escala astronômica. Na base e durante o trânsito não existem IA hostil, projéteis ou controles táticos ativos. O retorno concluído restaura nave, energia e munição antes de liberar a missão seguinte.

No P0, esse fluxo é reduzido a abrir → pilotar → escanear → combater/testar raio trator → pausar/configurar. O ciclo com missão, viagem, base funcional e save pertence ao P1.

## 10. Telas e estados de interface

- carregamento e diagnóstico de compatibilidade;
- menu principal;
- HUD de voo/combate;
- painel de energia;
- painel de sensores/contato selecionado;
- visão tática/mapa local;
- pausa e configurações;
- estado da nave e reparo na base (P1);
- mapa setorial e seleção de missão (P1);
- diário de bordo, créditos e licenças (P1/P2).

O HUD será HTML/CSS sobre o canvas. Deve funcionar em 1280×720 ou mais, com escala de interface, alto contraste, indicação que não dependa somente de cor e navegação por teclado nos menus.

## 11. Regras de negócio e de jogo

### Energia

- a soma alocada não pode superar a capacidade disponível do reator e da reserva;
- alocação mínima/máxima e perdas por dano são validadas pelo domínio, não pela interface;
- presets usam as mesmas regras do ajuste manual;
- valores nunca podem se tornar `NaN`, infinitos ou negativos.

### Escudos e casco

- cada impacto resolve primeiro o setor direcional atingido;
- excesso de dano atravessa para casco quando a regra da arma permitir;
- escudo regenera apenas após intervalo sem impacto, condicionado a energia e emissor funcional;
- uma seção de casco pode afetar um ou mais subsistemas associados;
- destruição do jogador encerra o encontro e restaura um ponto seguro, nunca corrompe o save.

### Armas

- feixes exigem alvo/linha de tiro, alcance, capacitor e condição térmica válidos;
- torpedos exigem munição, recarga e solução de tiro; são projéteis rastreáveis;
- raio trator exige alcance, linha de visão, energia auxiliar e diferença de massa/força válida;
- fogo amigo e mira em subsistemas serão decisões de balanceamento posteriores; não são requisitos do P0.

### Simulação

- regras de combate usam passo fixo e resultado independente da taxa de renderização;
- objetos fora da bolha tática não recebem simulação visual completa;
- `Esc` ou `P` pausam e retomam; a pausa congela a simulação e libera captura de
  ponteiro/controles, e a retomada recaptura o mouse;
- o jogo deve ser reproduzível em testes quando uma semente explícita for fornecida.

### Dados e saves

- saves têm versão de esquema e migração explícita;
- autosave ocorre apenas em pontos seguros, nunca no meio da resolução de dano;
- configurações gráficas e controles são separados do progresso;
- falha de leitura mantém o save original e oferece iniciar sessão segura.

## 12. Requisitos funcionais

| ID | Requisito | Prioridade |
| --- | --- | --- |
| RF-001 | Executar a partir de build estático em navegador compatível | P0 |
| RF-002 | Detectar ausência de WebGL 2/renderização por software e orientar o usuário | P0 |
| RF-003 | Controlar nave e câmera em arena espacial local | P0 |
| RF-004 | Realocar energia entre quatro consumidores e presets | P0 |
| RF-005 | Escanear e selecionar contato | P0 |
| RF-006 | Operar feixe, torpedo e raio trator | P0 |
| RF-007 | Resolver escudo direcional, casco e subsistemas | P0 |
| RF-008 | Exibir dano visual consistente com o dano lógico | P0 |
| RF-009 | Controlar ao menos um oponente por IA | P0 |
| RF-010 | Pausar e alterar preset gráfico, áudio e controles essenciais | P0 |
| RF-011 | Viajar entre base, objetivo e encontro em um sistema | P1 |
| RF-012 | Aceitar e completar três tipos de missão | P1 |
| RF-013 | Reparar e reabastecer em base funcional | P1 |
| RF-014 | Salvar e retomar progresso localmente | P1 |
| RF-015 | Registrar créditos e licença de todos os assets distribuídos | P1 |
| RF-016 | Progredir sistemas/reputação e acessar mais conteúdo | P2 |

## 13. Requisitos não funcionais

### Desempenho

- hardware usado como referência de orçamento: i7-8550U, 20 GB RAM, GeForce MX130 2 GB e UHD 620, sem exigir seleção manual de um adaptador específico;
- preset suportado: pelo menos 30 FPS médios e p99 de até 50 ms no pior cenário determinístico, buscando 45–60 FPS fora do pico;
- a UHD 620 validou o perfil baixo em 1280×720; presets, LOD e pools continuam obrigatórios para manter a experiência leve;
- carregamento jogável inicial de até 60 MB compactados como orçamento, não como licença para preenchê-lo;
- limites detalhados de VRAM, draw calls, LOD e assets estão no `PLANEJAMENTO.md`.

### Compatibilidade e responsividade

- baseline em WebGL 2; WebGPU é melhoria opcional após benchmark;
- primeira matriz: versões estáveis atuais de Chrome e Edge no Windows 11;
- tela mínima 1280×720; o canvas e HUD adaptam-se até Full HD;
- perda de foco, redimensionamento e mudança de tela cheia não podem prender controles.

### Acessibilidade

- menus utilizáveis por teclado;
- escala do HUD e texto legível;
- não depender somente de vermelho/verde para dano e alvo;
- opção de reduzir tremor de câmera, flashes e partículas;
- legendas para mensagens faladas quando áudio narrativo existir;
- remapeamento completo é P1, mas controles centrais não podem ser inacessíveis no P0.

### Qualidade e manutenção

- TypeScript estrito, dados validados e regras de domínio testáveis sem GPU;
- build, lint, typecheck e testes essenciais devem passar para fechar uma etapa;
- falhas de asset, compatibilidade e persistência devem produzir mensagem acionável;
- nenhuma dependência sem necessidade medida e registrada.

## 14. Segurança e privacidade

- P0/P1 não têm autenticação, contas, backend, telemetria remota nem compra;
- progresso e preferências permanecem no dispositivo via armazenamento do navegador;
- o jogo não solicita dados pessoais;
- conteúdo orientado a dados não pode executar código arbitrário;
- textos exibidos por dados devem ser tratados como conteúdo, não HTML confiável;
- nenhum segredo ou token será incluído no repositório ou build;
- dependências terão versão travada, licença compatível e revisão de vulnerabilidades antes de uma publicação.

## 15. Dados necessários

Entidades conceituais:

- `GameSession`: seed, tempo, setor e estado da missão;
- `ShipDefinition` e `ShipState`: atributos estáticos e estado mutável;
- `EnergyGrid`: capacidade, reserva, alocações e eficiência;
- `ShieldState`: quatro setores, regeneração e emissor;
- `HullSection` e `SubsystemState`: integridade, associação espacial e efeitos;
- `WeaponDefinition` e `WeaponState`: tipo, alcance, custo, calor, recarga e munição;
- `ContactState`: identificação, assinatura, dados revelados e alvo;
- `CelestialBody`, `StarbaseState` e `SectorState`;
- `MissionDefinition` e `MissionProgress`;
- `PlayerProgress`, `Settings` e `SaveEnvelope` versionado;
- `AssetAttribution`: autor, origem, licença e versão/data.

As estruturas detalhadas serão definidas durante P0, mantendo definições imutáveis separadas do estado de execução.

## 16. APIs, banco, autenticação e integrações

- **Backend:** nenhum no MVP.
- **Banco remoto:** nenhum; IndexedDB será a persistência local em P1.
- **Autenticação/permissões:** nenhuma conta ou papel de usuário; o navegador só precisa de armazenamento local, áudio e ponteiro quando autorizados pelo usuário.
- **APIs externas em runtime:** nenhuma.
- **Integrações de desenvolvimento:** npm para dependências; Blender/Krita/glTF Transform para assets; hospedagem estática somente no momento de publicação.

Uma API, banco remoto ou autenticação só poderá entrar mediante requisito novo, ADR e análise de custo, privacidade e modo offline.

## 17. Critérios de sucesso

### P0

- mecânicas centrais demonstráveis numa arena e benchmark repetível;
- ao menos 30 FPS médios e p99 de até 50 ms no preset suportado pela GPU acelerada escolhida pelo navegador, ou redução documentada de orçamento antes de avançar;
- build estático abre em Chrome e Edge, sem serviço pago;
- testes de invariantes de energia, escudo, dano e armas passam;
- nenhuma falha crítica/alta conhecida.

### MVP/vertical slice (P0 + P1 selecionado)

- jogador sai da base, viaja, escaneia, resolve um encontro e retorna;
- três missões curtas demonstram exploração, assistência/raio trator e combate;
- estado da nave, danos e energia são claros e consistentes;
- save local sobrevive a fechamento e reabertura;
- experiência atende às metas mínimas do hardware;
- build, lint, typecheck e testes essenciais passam;
- todos os assets têm licença registrada e nenhuma propriedade intelectual de terceiros é publicada sem autorização.

## 18. Questões que não bloqueiam o P0

- nome comercial e lore definitivo;
- uso futuro de propriedade intelectual licenciada;
- valores finais de balanceamento;
- classes adicionais de nave e facções;
- campanha completa, progressão e reputação;
- suporte a Firefox, Safari, celular e gamepad.

Esses itens possuem padrão seguro nas premissas. Serão reavaliados nos gates do roadmap, sem impedir o protótipo técnico.
