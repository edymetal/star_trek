# Premissas de trabalho

Versão: 1.0 — 20 de agosto de 2026

Estas premissas permitem avançar sem interromper o projeto por preferências que ainda podem ser validadas. Quando uma premissa for confirmada ou rejeitada, atualize seu status e, se afetar arquitetura/escopo, registre uma decisão em `docs/DECISIONS.md`.

| ID | Premissa | Motivo/impacto | Como e quando validar | Status |
| --- | --- | --- | --- | --- |
| A-001 | O P0 usará identidade de ficção científica original, embora a inspiração seja Star Trek. | Evita bloquear mecânicas e reduz risco de PI. | Usuário confirma antes de arte final ou publicação. | Adotada |
| A-002 | Qualquer uso direto da franquia ficará restrito a experimento pessoal até existir licença. | Diretrizes de fan films não equivalem a licença para jogo. | Gate de publicação. | Adotada |
| A-003 | O hardware de referência é Acer Aspire A515-51G, i7-8550U, ~20 GB RAM, MX130 2 GB e UHD 620. | Define orçamento real de CPU/GPU/VRAM. | Inventário repetido no P0.1 confirmou CPU, RAM e as duas GPUs; desempenho continua para P0.5. | Validada no P0.1 |
| A-004 | O navegador primário é Chrome ou Edge estável no Windows 11, com aceleração gráfica ativa. | Reduz a matriz inicial de compatibilidade. | Chrome e Edge passaram boot e controles do P0.2; aceleração WebGL 2 foi confirmada, mas desempenho físico fica para o benchmark. | Parcialmente validada no P0.2 |
| A-005 | A MX130 será selecionada pelo Windows para o navegador durante benchmark. | A integrada e a dedicada não somam potência no mesmo render. | A inspeção P0.2 selecionou UHD 620; configurar alto desempenho e conferir `chrome://gpu`/Gerenciador de Tarefas no P0.5. | Não confirmada nesta sessão |
| A-006 | O jogo é desktop/notebook, teclado e mouse, com tela mínima 1280×720. | Controles e HUD podem priorizar esse formato. | E2E de teclado/foco e inspeção visual 1280×720 passaram no P0.2. | Validada no P0.2 |
| A-007 | Celular, console, VR e gamepad não são requisitos do P0/P1. | Evita multiplicar UX e testes. | Reavaliar após MVP. | Adotada |
| A-008 | O produto será single-player e não terá conta, backend ou banco remoto. | Atende custo zero/offline e simplifica segurança. | Só muda com novo requisito e ADR. | Adotada |
| A-009 | Nenhum serviço pago ou API externa será necessário em runtime. | Requisito explícito de execução gratuita. | Revisar dependências em cada gate. | Adotada |
| A-010 | Português brasileiro é o único idioma necessário no MVP. | Não há requisito de internacionalização inicial. | Usuário confirma antes do P2; evitar texto impossível de extrair. | A validar |
| A-011 | A câmera principal é terceira pessoa externa, com visão tática complementar. | Melhor demonstra modelos/danos e reduz custo de interiores. | Câmera externa ficou funcional e legível no P0.2; sensação ainda requer playtest do usuário. | Parcialmente validada |
| A-012 | O voo é cinematográfico com inércia moderada e assistência opcional. | Mais acessível e barato que física realista 6DoF. | Inércia, assistência, freio e impulso passaram testes/E2E; ajustar sensação por playtest. | Parcialmente validada no P0.2 |
| A-013 | Dobra é uma transição de viagem/carregamento, não velocidade contínua em escala astronômica. | Evita precisão e espaços vazios. | Vertical slice P1. | Adotada |
| A-014 | Planetas são observáveis/escaneáveis; não haverá pouso no MVP. | Pouso é outro jogo em conteúdo e arquitetura. | Reavaliar somente após MVP. | Adotada |
| A-015 | A primeira narrativa será uma pequena sequência guiada com três missões reutilizando sistemas. | Fecha o ciclo com escopo controlado. | Planejamento das missões no início do P1. | Provisória |
| A-016 | Balanceamento final não é conhecido; P0 usa valores claramente configuráveis. | Protótipo precisa medir antes de polir números. | Telemetria local e playtests P0/P1. | Adotada |
| A-017 | WebGL 2 funciona no hardware alvo; WebGPU pode não funcionar ou não ser mais rápido. | Fallback confiável é obrigatório. | Boot WebGL 2 passou em Chrome/Edge no P0.1; WebGPU e desempenho ficam para P0.5. | WebGL 2 validado no P0.1 |
| A-018 | 1600×900/médio a 30 FPS no pico da MX130 é uma meta factível com escopo e assets propostos. | Critério inicial de avanço. | Benchmark P0.5; reduzir orçamento se falhar. | A validar |
| A-019 | UHD 620 pode oferecer um perfil baixo funcional em 1280×720. | Garante recuperação se GPU dedicada não for usada. | Cena/HUD ficaram visualmente funcionais em UHD 620/1280×720/baixo; aba automatizada sofreu throttling e não valida FPS. Benchmark P0.5. | Parcialmente validada no P0.2 |
| A-020 | Movimento cinemático e volumes simples bastam no P0; Rapier não é necessário. | Evita WASM/dependência e custo prematuros. | Linha de visão por esferas, movimento inimigo e raio trator foram implementados/testados sem motor físico no P0.4; colisão avançada continua fora do P0. | Validada para P0.4 |
| A-021 | HUD em DOM simples não excederá a complexidade sustentável no P0/P1 inicial. | Evita framework sem benefício demonstrado. | HUD de voo, energia e combate P0.4 permaneceu modular, acessível e sem sobreposição em 1280×720. | Validada para P0.4 |
| A-022 | Assets provisórios próprios, primitivos ou CC0 serão suficientes para provar P0. | Arte final não deve bloquear mecânicas. | Inventário de licenças e revisão visual P0.5. | Adotada |
| A-023 | IndexedDB é suficiente para saves locais pequenos e versionados. | Não existe sincronização ou conteúdo de usuário pesado. | Implementar e testar quota/corrupção no P1. | Adotada |
| A-024 | Não haverá telemetria remota; métricas de benchmark serão locais. | Preserva privacidade e elimina infraestrutura. | Só muda por consentimento/requisito explícito. | Adotada |
| A-025 | O projeto será desenvolvido gradualmente por uma pessoa com assistência de agentes. | Influencia estimativas e favorece reutilização. | Reavaliar se equipe/ritmo mudar. | Adotada |
| A-026 | Áudio, modelos e texturas de Star Trek não serão copiados para o build. | “Gratuito para baixar” não concede redistribuição. | Auditoria de assets em todos os gates. | Adotada |
| A-027 | O jogo será servido por HTTP(S) local/deploy; abrir via `file://` não é requisito. | Módulos e assets web precisam de origem adequada. | Documentação de execução no P0.1. | Adotada |
| A-028 | A combinação de versões fixada no scaffold funciona em Node 22 e nos navegadores alvo. | Evita adotar versões atuais que não sejam compatíveis entre si. | Instalação limpa, verify, build e E2E do P0.1; revisar a cada atualização deliberada. | Validada no P0.1 |
| A-029 | A direção visual desejada é um simulador espacial tático em terceira pessoa, com nave do jogador grande, alvo à frente, starfield denso e HUD integrado às bordas. | Alinha legibilidade da nave, combate visível e informação tática à referência fornecida sem copiar a franquia. | UI-1/UI-GFX confirmaram hierarquia, nave com 23,8–24,4% da largura, centro livre, memória inequívoca, combate visível e três estados de dano nos dois viewports. Diagnóstico baixo observou 18 draw calls em repouso, 22 com um efeito, 26 com dois simultâneos e teto automatizado 28; benchmark físico continua para P0.5. | Parcialmente validada na UI-GFX |
| A-030 | Primitivas e materiais procedurais próprios bastam para validar a linguagem gráfica antes de produzir assets finais. | Evita custo, licença e VRAM prematuros sem bloquear avaliação de composição e feedback. | Capturas UI-GFX em 1280×720 e 1600×900 confirmam silhuetas, iluminação, feixe/impacto, escudo e dano legíveis. A apresentação pura passa 20/20 e o adaptador VFX 10/10, porém o fluxo gráfico-combate repetido falha 0/2 por perda do marcador; a linguagem gráfica está validada, não o gate integrado. | Parcialmente validada na UI-GFX |

## Premissas que exigem evidência no P0

As premissas A-003, A-004, A-005, A-017, A-018, A-019, A-020 e A-021 não devem ser tratadas como fatos depois dos respectivos testes. Se uma falhar:

- ajuste primeiro preset, orçamento ou implementação dentro da arquitetura;
- registre números e ambiente no relatório do benchmark;
- abra nova decisão somente se a resposta mudar motor, baseline, física ou UI;
- não avance ao P1 com desempenho abaixo do gate sem aprovação explícita.

## Ausências que não impedem construção segura

Ainda não há nome definitivo, lore, desenho da primeira nave, valores finais, provedor de hospedagem nem decisão pública sobre fan game. O P0 pode usar conteúdo original provisório, parâmetros em dados, build local e WebGL 2. Portanto, nenhuma dessas ausências bloqueia o Agente 2.
