# Comando Estelar — protótipo técnico

Protótipo de um jogo 3D original de exploração espacial executado no navegador. O **P0 está aprovado**: arena, voo, energia, sensores, três equipamentos, escudos direcionais, dano, IA, HUD nas bordas, naves procedurais, VFX em pool e benchmark escalável. O **gate técnico do P1 está aprovado** e contém campanha tutorial de três missões, save local versionado, base/mapa/viagem, configurações, acessibilidade prioritária, diário, áudio procedural, assets validados e execução local offline. Um playtest humano de primeira experiência ainda antecede a aprovação formal do MVP.

## Requisitos

- Node.js 22.12 ou superior;
- npm 10 ou superior;
- Google Chrome ou Microsoft Edge estável com aceleração gráfica ativa;
- Windows 11 é a plataforma de referência desta primeira etapa.

## Instalação e execução

No Windows, dê dois cliques em `ABRIR_JOGO.bat` para preparar, iniciar e abrir o jogo automaticamente no navegador. Mantenha a janela do servidor aberta enquanto estiver jogando; use `Ctrl+C` nela para encerrar.

Para abrir a carga determinística do P0.5, dê dois cliques em `EXECUTAR_BENCHMARK.bat`. O procedimento e a tabela de resultados ficam em [`docs/BENCHMARK_P0_5.md`](docs/BENCHMARK_P0_5.md).

Como alternativa, execute manualmente:

```powershell
npm ci
npm run dev
```

Abra o endereço exibido pelo Vite. O projeto precisa ser servido por HTTP local; abrir `index.html` diretamente por `file://` não é suportado.

No Windows, `ABRIR_JOGO.bat` oferece o mesmo fluxo em `localhost`: valida Node.js 22.12+, confere se `node_modules` corresponde ao hash do `package-lock.json`, executa `npm ci` somente quando necessário e abre o navegador. O script não solicita privilégio administrativo nem expõe o servidor à rede local.

Se uma rede corporativa interceptar TLS, configure o Node para confiar no repositório de certificados do sistema. Não desative `strict-ssl` para contornar erros de certificado.

## Comandos

| Ação                               | Comando                  |
| ---------------------------------- | ------------------------ |
| Desenvolvimento                    | `npm run dev`            |
| Testes em modo interativo          | `npm test`               |
| Testes unitários em execução única | `npm run test:run`       |
| E2E no Chrome e Edge instalados    | `npm run test:e2e`       |
| Benchmark físico em Chrome         | `npm run test:benchmark` |
| Validar manifesto/assets           | `npm run assets:check`   |
| Validar build local/offline        | `npm run offline:check`  |
| Lint                               | `npm run lint`           |
| Formatação                         | `npm run format`         |
| Verificar formatação               | `npm run format:check`   |
| Typecheck                          | `npm run typecheck`      |
| Build estático                     | `npm run build`          |
| Prévia do build                    | `npm run preview`        |
| Gate local sem E2E                 | `npm run verify`         |

`npm run test:e2e` cria o build e o serve em `http://127.0.0.1:4173`. Os projetos Playwright usam os canais de sistema `chrome` e `msedge`; nenhum navegador baixado separadamente é obrigatório nesta máquina. A matriz também verifica uma janela curta do benchmark, mas esse teste automatizado não substitui a medição física documentada.

## Controles de voo

- `W`/`S`: acelerar e reverter;
- `A`/`D` ou setas esquerda/direita: guinar;
- setas para cima/baixo: inclinar;
- `Q`/`E`: rolar;
- `Shift`: impulso;
- `Espaço`: freio assistido;
- `P`: pausar/retomar;
- `F`: entrar/sair de tela cheia;
- botão **Capturar mouse**: usar mouse para guinada/inclinação; `Esc` libera.

Perder foco ou ocultar a aba limpa todas as entradas, libera o ponteiro e mantém a sessão pausada até o jogador retomar.

## Treinamento inicial

O botão do painel **Comando de missão** conduz três lições em sequência:

1. **Levantamento de Nereida:** selecionar e identificar uma sonda com os sensores;
2. **Socorro no Anel de Íris:** aproximar, alinhar e estabilizar uma nave passiva com o raio trator;
3. **Defesa do Corredor Aurora:** gerenciar energia, escudos e armas para neutralizar uma interceptadora hostil.

O HUD mostra a instrução atual e libera equipamentos gradualmente. Ao retornar à base, o jogo repara e reabastece a nave, salva o checkpoint local e oferece a próxima missão. A terceira conclusão permanece disponível após recarregar e permite reiniciar todo o treinamento.

O áudio usa síntese procedural original e só é liberado após o primeiro clique para entrar na sessão ou pelo botão **Ativar e testar áudio** em Configurações. Volume geral, efeitos, ambiente e mute são persistentes. Pausa e perda de foco suspendem o som; se Web Audio estiver indisponível, todas as informações essenciais continuam visíveis e o jogo permanece utilizável.

O emblema vetorial original é carregado pelo manifesto local depois da conferência de caminho, tipo, tamanho e SHA-256. Se o manifesto ou o arquivo falhar, o menu mostra um símbolo CSS seguro e oferece **Tentar carregar novamente** sem bloquear a cena. A autoria, a licença MIT do PlayCanvas e os recursos próprios estão detalhados em [`docs/ASSET_LICENSES.md`](docs/ASSET_LICENSES.md).

## Controles de energia

Use os botões **Equilibrado**, **Ataque**, **Defesa** e **Fuga** para aplicar presets completos. Os botões `−` e `+` de cada canal ajustam motores, escudos, armas ou auxiliares/sensores em cinco pontos; os demais canais são redistribuídos automaticamente para conservar o total de 100. Todos os controles são botões nativos e funcionam por teclado.

## Controles táticos

- `T`: selecionar o próximo contato detectado;
- `X`: limpar o alvo;
- `R`: ativar/interromper scan do alvo selecionado;
- `1`: disparar feixe;
- `2`: lançar torpedo;
- `3`: ativar raio trator;
- `N`: reiniciar depois de vitória ou derrota.

Os mesmos comandos estão disponíveis como botões nativos no painel **Encontro tático**. Alcance, linha de visão, solução de tiro, energia, capacitor, recarga, munição, massa e integridade dos subsistemas podem impedir uma ação; o painel informa o motivo sem depender apenas de cor.

## Diagnóstico da GPU

A tela inicial informa backend, renderizador, preset e FPS. O HUD mostra voo, casco, escudos, estado preparado de armas, alcance de sensores, alocação, reator e reserva, além de frametime, draw calls, objetos instanciados e LOD. O baseline e o padrão do jogo continuam sendo WebGL 2. O benchmark aceita `backend=webgpu` somente para comparação experimental e sempre mantém fallback WebGL 2.

Se aparecer renderização por software ou a GPU integrada:

1. ative a aceleração gráfica no Chrome/Edge;
2. em Configurações do Windows → Sistema → Tela → Elementos gráficos, defina o navegador como **Alto desempenho**;
3. reinicie completamente o navegador;
4. confira `chrome://gpu` ou `edge://gpu` e o Gerenciador de Tarefas.

## Estrutura atual

- `src/application`: composição do boot, sessão e loop de passo fixo;
- `public/assets`: manifesto e arquivos distribuídos com autoria, licença e integridade;
- `src/content`: definições imutáveis e validação do catálogo de assets;
- `src/domain`: prontidão gráfica e regras puras de voo, energia, sensores, armas, dano, linha de visão e IA, sem DOM/GPU;
- `src/engine`: adaptação PlayCanvas, arena, câmera, instancing, LOD e carregamento transacional de assets;
- `src/platform`: diagnóstico, medição local, IndexedDB e entrada segura de teclado/mouse;
- `src/ui`: shell e HUD DOM acessíveis;
- `tests/e2e`: boot, recuperação, controle, pausa e foco em Chrome/Edge.

Não existe `.env.example` porque o jogo não usa variáveis de ambiente, segredo, API ou serviço externo em runtime. As variáveis `BENCHMARK_*` são apenas parâmetros locais do teste físico em Playwright.

## Build

```powershell
npm run build
npm run preview
```

O conteúdo de `dist/` é totalmente estático e usa caminhos relativos, permanecendo compatível com hospedagem futura em subdiretório. Publicação e deploy não fazem parte desta etapa.

O build executa `npm run assets:check` automaticamente. Arquivo em `public/assets/` sem registro, hash/tamanho divergente ou dependência de runtime com versão/licença inesperada interrompe o build antes da geração de `dist/`.

O build também executa `npm run offline:check`: referências de outra origem, arquivos locais ausentes, tamanho inicial acima de 60 MB ou registro de service worker não aprovado interrompem o gate. O `postinstall` registra o hash do lockfile, permitindo que `ABRIR_JOGO.bat` reutilize uma instalação válida sem consultar o registry. O MVP não é uma PWA; depois de `npm ci`, o atalho serve todos os recursos no próprio computador sem depender de internet. Cache instalável será reconsiderado apenas na preparação de publicação.

## Continuação do desenvolvimento

O estado concluído, todas as pendências e a ordem recomendada para outra IA finalizar o MVP estão em [`docs/HANDOFF_REMAINING_WORK.md`](docs/HANDOFF_REMAINING_WORK.md).
