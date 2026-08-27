# Comando Estelar — protótipo técnico

Protótipo de um jogo 3D original de exploração espacial executado no navegador. A etapa atual combina o encontro tático **P0.4** ainda em correção com a apresentação **UI-GFX** validada: arena, voo, energia, sensores, três equipamentos, escudos direcionais, dano, IA, HUD nas bordas, naves procedurais e VFX em pool. Os assets finais e o benchmark físico continuam reservados ao P0.5; o gate lógico P0.4 ainda não está aprovado.

## Requisitos

- Node.js 22.12 ou superior;
- npm 10 ou superior;
- Google Chrome ou Microsoft Edge estável com aceleração gráfica ativa;
- Windows 11 é a plataforma de referência desta primeira etapa.

## Instalação e execução

No Windows, dê dois cliques em `ABRIR_JOGO.bat` para preparar, iniciar e abrir o jogo automaticamente no navegador. Mantenha a janela do servidor aberta enquanto estiver jogando; use `Ctrl+C` nela para encerrar.

Como alternativa, execute manualmente:

```powershell
npm ci
npm run dev
```

Abra o endereço exibido pelo Vite. O projeto precisa ser servido por HTTP local; abrir `index.html` diretamente por `file://` não é suportado.

No Windows, `ABRIR_JOGO.bat` oferece o mesmo fluxo em `localhost`: valida Node.js 22.12+, confere se `node_modules` corresponde ao hash do `package-lock.json`, executa `npm ci` somente quando necessário e abre o navegador. O script não solicita privilégio administrativo nem expõe o servidor à rede local.

Se uma rede corporativa interceptar TLS, configure o Node para confiar no repositório de certificados do sistema. Não desative `strict-ssl` para contornar erros de certificado.

## Comandos

| Ação                               | Comando                |
| ---------------------------------- | ---------------------- |
| Desenvolvimento                    | `npm run dev`          |
| Testes em modo interativo          | `npm test`             |
| Testes unitários em execução única | `npm run test:run`     |
| E2E no Chrome e Edge instalados    | `npm run test:e2e`     |
| Lint                               | `npm run lint`         |
| Formatação                         | `npm run format`       |
| Verificar formatação               | `npm run format:check` |
| Typecheck                          | `npm run typecheck`    |
| Build estático                     | `npm run build`        |
| Prévia do build                    | `npm run preview`      |
| Gate local sem E2E                 | `npm run verify`       |

`npm run test:e2e` cria o build e o serve em `http://127.0.0.1:4173`. Os projetos Playwright usam os canais de sistema `chrome` e `msedge`; nenhum navegador baixado separadamente é obrigatório nesta máquina.

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

A tela inicial informa backend, renderizador, preset e FPS. O HUD mostra voo, casco, escudos, estado preparado de armas, alcance de sensores, alocação, reator e reserva, além de frametime, draw calls, objetos instanciados e LOD. O baseline é sempre WebGL 2; WebGPU ainda não faz parte do protótipo.

Se aparecer renderização por software ou a GPU integrada:

1. ative a aceleração gráfica no Chrome/Edge;
2. em Configurações do Windows → Sistema → Tela → Elementos gráficos, defina o navegador como **Alto desempenho**;
3. reinicie completamente o navegador;
4. confira `chrome://gpu` ou `edge://gpu` e o Gerenciador de Tarefas.

## Estrutura atual

- `src/application`: composição do boot, sessão e loop de passo fixo;
- `src/content`: definições imutáveis de presets, arena, nave e energia;
- `src/domain`: prontidão gráfica e regras puras de voo, energia, sensores, armas, dano, linha de visão e IA, sem DOM/GPU;
- `src/engine`: adaptação PlayCanvas, arena, câmera, instancing e LOD;
- `src/platform`: diagnóstico, medição local e entrada segura de teclado/mouse;
- `src/ui`: shell e HUD DOM acessíveis;
- `tests/e2e`: boot, recuperação, controle, pausa e foco em Chrome/Edge.

Não existe `.env.example` porque o P0.4 não usa variáveis de ambiente, segredo, API ou serviço externo em runtime.

## Build

```powershell
npm run build
npm run preview
```

O conteúdo de `dist/` é totalmente estático e usa caminhos relativos, permanecendo compatível com hospedagem futura em subdiretório. Publicação e deploy não fazem parte desta etapa.
