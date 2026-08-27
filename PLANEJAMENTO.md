# Planejamento do jogo de exploração e combate espacial

Pesquisa e proposta inicial registradas em 20 de agosto de 2026. Este documento contém somente decisões de pré-produção; não há implementação de código nesta fase.

## Status e documentos canônicos

Este arquivo preserva a pesquisa, as alternativas técnicas, os orçamentos e a proposta original. Após a revisão formal de pré-produção, use as fontes canônicas abaixo para executar o projeto:

- [`docs/PRODUCT_SPEC.md`](docs/PRODUCT_SPEC.md): comportamento, fluxos e requisitos;
- [`docs/MVP.md`](docs/MVP.md): prioridades P0–P3 e gates;
- [`ARCHITECTURE.md`](ARCHITECTURE.md): arquitetura e estratégia técnica;
- [`docs/ROADMAP.md`](docs/ROADMAP.md): ordem de implementação;
- [`docs/ASSUMPTIONS.md`](docs/ASSUMPTIONS.md): hipóteses e validações;
- [`docs/DECISIONS.md`](docs/DECISIONS.md): decisões justificadas;
- [`docs/PROGRESS.md`](docs/PROGRESS.md): estado atual;
- [`AGENTS.md`](AGENTS.md): instruções permanentes de trabalho.

Em caso de divergência, os documentos canônicos mais específicos prevalecem. As decisões antes abertas neste planejamento receberam defaults seguros para permitir o P0; isso não autoriza publicação de propriedade intelectual de terceiros.

## 1. Resumo executivo

A melhor direção para este projeto é um jogo 3D de navegador, inicialmente para um jogador, com exploração dividida em setores e combates táticos em áreas locais. O projeto não deve tentar simular uma galáxia inteira em escala real nem manter todos os corpos celestes ativos ao mesmo tempo.

Recomendação técnica principal:

- linguagem: TypeScript em modo estrito;
- motor: PlayCanvas Engine 2.x, instalado pelo npm e usado de forma independente;
- renderização: WebGL 2 como base confiável, com WebGPU habilitado somente depois de um teste comparativo no notebook;
- ferramentas de desenvolvimento: Node.js LTS, Vite, Vitest e Playwright;
- arte: Blender, Krita e assets próprios ou com licença compatível;
- formato 3D: GLB/glTF 2.0, com malhas e texturas otimizadas;
- física: movimentação cinemática própria no início; Rapier 3D somente se colisões físicas complexas se mostrarem necessárias;
- execução e distribuição: aplicação estática, sem servidor obrigatório, executável localmente e publicável gratuitamente.

A qualidade visual deve vir de bons modelos, iluminação PBR, materiais, efeitos de impacto e direção de câmera, e não de uma quantidade excessiva de polígonos, luzes e simulações.

## 2. Limites reais do equipamento alvo

Notebook analisado:

| Componente | Detectado |
| --- | --- |
| Modelo | Acer Aspire A515-51G |
| Processador | Intel Core i7-8550U, 4 núcleos e 8 threads |
| Memória | aproximadamente 20 GB |
| GPU integrada | Intel UHD Graphics 620 |
| GPU dedicada | NVIDIA GeForce MX130, 2 GB de VRAM |
| Sistema | Windows 11 64 bits |
| Node.js atual | 22.23.1, ainda LTS e compatível com Vite 8 |

O principal limite é a GPU e seus 2 GB de VRAM, não a memória RAM. O jogo deverá confirmar que o navegador está usando a MX130, oferecer perfis de qualidade e conseguir reduzir resolução e efeitos em tempo real.

Metas iniciais propostas:

- perfil recomendado: 1600 × 900, 45 a 60 FPS durante exploração e pelo menos 30 FPS no pior momento de combate;
- perfil de segurança: 1280 × 720, 60 FPS na maior parte do tempo;
- escala de resolução dinâmica entre 70% e 100%;
- primeiro carregamento jogável entre 40 e 60 MB compactados;
- conteúdo de cada novo setor preferencialmente abaixo de 30 a 50 MB;
- orçamento aproximado de até 200 a 300 draw calls nos encontros mais pesados;
- uso de VRAM do conteúdo ativo idealmente abaixo de 1,2 a 1,4 GB, deixando margem para navegador e sistema;
- teste obrigatório tanto na MX130 quanto na UHD 620, mesmo que a segunda use qualidade baixa.

Essas metas são hipóteses de pré-produção. O protótipo técnico deverá medi-las e ajustá-las.

### Uso da GPU pelo navegador

WebGL 2 e WebGPU enviam a renderização 3D para a GPU quando a aceleração gráfica do navegador está ativa. A CPU continua responsável por regras do jogo, IA, parte da física, preparação de comandos e carregamento de dados.

Em notebooks com vídeo híbrido, Chrome e navegadores Chromium não combinam a GPU integrada com a dedicada para executar o mesmo jogo. O navegador escolhe um adaptador e, por economia de energia, pode escolher a Intel UHD 620 em vez da NVIDIA MX130.

Antes dos benchmarks:

1. manter ativa a opção de aceleração gráfica nas configurações de sistema do Chrome ou Edge;
2. nas configurações de gráficos do Windows 11, cadastrar o executável do navegador e escolher o perfil de alto desempenho/NVIDIA MX130;
3. encerrar todas as janelas e processos do navegador e abri-lo novamente;
4. no Chrome, abrir `chrome://gpu` e confirmar que WebGL e, quando testado, WebGPU aparecem como acelerados por hardware;
5. conferir o adaptador/renderizador mostrado no relatório e validar no Gerenciador de Tarefas qual GPU está executando a carga 3D.

O jogo deverá exibir um diagnóstico simples do renderizador e avisar quando detectar renderização por software. WebGPU não deve ser forçado por flags para usuários finais; se estiver indisponível ou bloqueado pelo driver, o jogo deverá usar WebGL 2.

## 3. Visão do produto

### Fantasia central

O jogador comanda uma nave, explora sistemas desconhecidos, investiga anomalias, toma decisões de navegação e energia, encontra outras naves e bases e participa de combates em que o estado da nave é visível e afeta seu funcionamento.

### Ciclo principal de jogo

1. Receber uma missão ou detectar um ponto de interesse.
2. Examinar o mapa, escolher rota e preparar a distribuição de energia.
3. Viajar em dobra para outro setor ou aproximar-se em velocidade de impulso.
4. Escanear nave, base, planeta, lua, estrela, anomalia ou campo de asteroides.
5. Resolver o encontro por exploração, assistência, diálogo simples, evasão ou combate.
6. Coletar dados, recursos de missão ou salvamento permitido pela situação.
7. Reparar, reabastecer, aprimorar sistemas e aceitar o próximo objetivo em uma base estelar.

Sem esse ciclo, o projeto corre o risco de virar apenas uma demonstração visual de navegação. Exploração precisa produzir descobertas e decisões; combate precisa ter consequências; bases precisam ter função.

### Pilares

- exploração com curiosidade e descoberta;
- combate tático legível, não apenas disparos rápidos;
- gerenciamento de energia que realmente altere o comportamento da nave;
- danos visíveis e danos de sistemas conectados;
- apresentação cinematográfica com desempenho estável;
- todo conteúdo liberado por jogo, sem compras e sem dependência de serviços pagos.

## 4. Decisões originalmente em aberto

Estas questões foram reconciliadas em `docs/ASSUMPTIONS.md` e `docs/DECISIONS.md`. Os defaults atuais permitem iniciar o P0: identidade original provisória, câmera externa com visão tática, voo cinematográfico, campanha curta guiada, planetas sem pouso, português brasileiro e desktop/notebook. Elas continuam sujeitas aos gates indicados, mas não bloqueiam a fundação técnica.

Antes de ampliar o escopo, devem ser confirmadas estas decisões:

1. Propriedade intelectual: será um protótipo pessoal de fã ou um jogo publicável em universo original inspirado por ficção científica?
2. Perspectiva: terceira pessoa externa, ponte/cabine, visão tática ou alternância entre terceira pessoa e tática?
3. Controle: seis graus de liberdade realistas ou voo cinematográfico simplificado? A recomendação é voo cinematográfico com inércia moderada, yaw, pitch e roll.
4. Campanha: história linear, missões procedurais ou combinação? A recomendação é uma pequena campanha guiada com encontros reaproveitáveis.
5. Progressão: melhoria da nave, desbloqueio de novas classes, reputação por facção ou somente avanço narrativo?
6. Exploração planetária: os planetas serão somente observáveis e escaneáveis ou será possível pousar? Pouso deve ficar fora da primeira versão.
7. Quantidade inicial de conteúdo: número de naves, facções, sistemas e missões.
8. Idiomas: somente português inicialmente ou português e inglês desde o começo?
9. Público alvo: somente o notebook atual ou também celulares e computadores mais fracos? A recomendação inicial é desktop/notebook com teclado, mouse e gamepad opcional.

## 5. Escopo recomendado

### Protótipo técnico

Objetivo: provar que a experiência visual e o combate cabem no notebook.

- uma nave controlável com três níveis de detalhe;
- câmera externa e HUD provisório;
- um planeta, uma estrela e asteroides instanciados;
- uma nave inimiga simples;
- um phaser/feixe, um torpedo e escudo com efeito de impacto;
- alocação de energia entre motores, escudos e armas;
- dano visual em três estados;
- comparação WebGL 2 versus WebGPU;
- telemetria de FPS, tempo de CPU/GPU, draw calls e memória aproximada de assets.

Não deve haver campanha, inventário, multiplayer ou universo procedural nesta fase.

### Vertical slice jogável

Objetivo: demonstrar o ciclo completo com qualidade próxima da desejada.

- um sistema estelar completo, mas em escala artística;
- uma nave do jogador;
- dois arquétipos de nave controlados por IA;
- uma base estelar utilizável;
- planeta, lua, estrela e campo de asteroides;
- missão de exploração, missão de resgate e encontro de combate;
- sensores e escaneamento;
- phasers, torpedos, raio trator e gerenciamento de energia;
- escudos, casco, subsistemas e reparo na base;
- salvamento local;
- opções gráficas, áudio, controles remapeáveis e pausa.

### Alpha de conteúdo

- três a cinco classes de nave;
- duas bases com funções diferentes;
- três sistemas estelares;
- facções e reputação simples;
- oito a doze missões com variações;
- eventos e anomalias;
- progressão e aprimoramentos;
- tutorial integrado;
- PWA/offline depois do primeiro carregamento, se o cache for confiável.

### Fora do escopo inicial

- multiplayer e servidor persistente;
- pouso em planetas;
- interiores caminháveis das naves;
- tripulação individual simulada;
- galáxia inteira em escala 1:1;
- destruição física completa de qualquer malha;
- centenas de naves simultâneas;
- criação procedural de modelos 3D em tempo real;
- realidade virtual.

Esses itens podem ser reconsiderados somente depois de o vertical slice atingir as metas de desempenho.

## 6. Organização do universo e escala

Usar três escalas separadas resolve os problemas de precisão numérica, memória e tempo de viagem:

### Mapa galáctico/setorial

- representa sistemas e rotas como dados, não como objetos 3D ativos;
- guarda o estado persistente de missões, facções e encontros;
- a dobra funciona como transição de viagem e carregamento assíncrono.

### Sistema estelar

- exibe estrela, planetas, luas, bases e pontos de interesse em escala reduzida;
- órbitas podem ser artísticas ou analíticas, sem física de N corpos;
- corpos muito distantes usam versões simplificadas ou impostores.

### Bolha tática local

- contém a nave do jogador, aliados, inimigos, projéteis e objetos próximos;
- usa origem flutuante para manter precisão;
- ativa física, IA e efeitos completos somente dentro dessa área;
- objetos fora da bolha têm simulação de baixa frequência ou somente estado lógico.

Planetas não devem ficar a distâncias astronômicas reais no mesmo sistema de coordenadas usado pelo combate. Isso provocaria problemas de profundidade e precisão sem melhorar a diversão.

## 7. Sistemas do jogo

### Navegação e voo

- velocidade de impulso para encontros locais;
- dobra para rotas entre pontos distantes;
- assistência de voo opcional para estabilizar rotação e facilitar mira;
- modos de câmera externa, perseguição e tática;
- limite de velocidade condicionado à energia e ao dano dos motores;
- colisão simplificada por volumes convexos, cápsulas ou esferas, não pela malha visual detalhada.

### Energia

Cada nave possui geração do reator, bateria/reserva e quatro consumidores principais:

- motores;
- escudos;
- armas;
- sistemas auxiliares/sensores.

Regras propostas:

- a soma das alocações não pode exceder a energia disponível;
- mais energia nos motores melhora aceleração, giro e velocidade máxima;
- mais energia nos escudos acelera regeneração e aumenta resistência dentro de um limite;
- mais energia nas armas acelera recarga de capacitores e torpedos, mas gera calor;
- auxiliares controlam sensores, raio trator, reparos e contramedidas;
- presets rápidos: equilibrado, ataque, defesa, fuga e personalizado;
- subsistemas danificados desperdiçam energia ou reduzem o limite de alocação.

O sistema deve gerar escolhas. Se todas as barras puderem permanecer no máximo, ele não tem função.

### Escudos

- quatro setores direcionais: frente, traseira, bombordo e estibordo;
- o impacto aparece apenas por um curto período, preservando a visão do casco;
- dano reduz primeiro o setor atingido;
- redistribuição manual pode reforçar um lado às custas dos outros;
- regeneração depende de energia, tempo sem impacto e integridade do emissor;
- colapso de um setor expõe diretamente casco e subsistemas daquela região.

### Phasers ou feixes de energia

- ataque hitscan visualizado como feixe contínuo curto;
- precisão e dano caem com distância e movimento relativo;
- consomem capacitor e geram calor;
- podem mirar subsistemas depois de um escaneamento adequado;
- cores e comportamento pertencem às definições da facção, não ao código do sistema.

### Torpedos

- projéteis rastreáveis com tempo de recarga e quantidade limitada por encontro ou missão;
- exigem solução de tiro e podem ser interceptados ou evitados;
- causam grande impacto de escudo, casco e área curta;
- variantes futuras podem trocar dano, velocidade, rastreamento e efeito, sem criar um sistema novo.

### Raio trator

- exige alcance, linha de visão e energia auxiliar;
- altera gradualmente a velocidade relativa, sem teletransportar o alvo;
- funciona melhor em alvos leves, danificados ou com motores desligados;
- pode estabilizar destroços, auxiliar resgates, impedir fuga ou reposicionar objetos;
- deve quebrar quando a força exigida, distância ou dano do emissor ultrapassarem o limite.

### Danos e apresentação visual

O modelo recomendado combina estado lógico e representação artística:

- casco dividido em seções, cada uma associada a subsistemas;
- três a quatro estágios de material por seção: intacto, marcado, avariado e crítico;
- decalques de queimadura e impacto com quantidade limitada e reutilização por pool;
- emissivos animados para metal quente e circuitos expostos;
- faíscas, fumaça, vazamentos e pequenos destroços por partículas;
- peças previamente marcadas que podem se soltar em danos críticos;
- luzes, motores e armas que falham de acordo com o subsistema;
- câmera com tremor curto e controlado, nunca a ponto de esconder a ação.

Não usar corte de malha arbitrário nem pintura de textura 4K em tempo real na primeira versão. Variantes preparadas no Blender, decalques e máscaras de dano entregam resultado melhor e mais previsível no hardware disponível.

### Sensores e exploração

- detecção passiva de contatos;
- escaneamento ativo que revela classe, armas, escudos, carga e subsistemas;
- análise de planetas, luas, asteroides e anomalias;
- sinais desconhecidos que criam objetivos opcionais;
- diário de bordo com descobertas;
- alcance e velocidade dos sensores dependentes de energia e dano.

### Bases estelares

As bases reutilizam os mesmos componentes de nave sempre que possível:

- escudos e seções de casco;
- phasers, torpedos e raio trator;
- geração e distribuição de energia;
- docas, reparo, reabastecimento e missões;
- defesa por setores e subsistemas maiores;
- tráfego de naves simulado em baixa frequência.

### Inteligência artificial

- máquina de estados hierárquica ou utility AI simples;
- percepção baseada em sensores, não conhecimento perfeito;
- decisões sobre distância, orientação do escudo, energia, alvo e retirada;
- atualização tática entre 5 e 10 vezes por segundo, sem necessidade de rodar toda IA a cada quadro;
- perfis distintos: patrulheiro, agressor, defensor de base, escolta e fugitivo;
- regras reproduzíveis e depuráveis; não usar IA generativa no jogo.

### Salvamento e progressão

- IndexedDB para saves locais versionados;
- autosave apenas fora de combate ou em pontos seguros;
- exportação/importação manual de save em fase posterior;
- progressão por missão, reputação e melhorias de sistemas;
- nenhum item comprado com dinheiro real.

## 8. Qualidade visual dentro do orçamento

### Modelos e níveis de detalhe

Orçamento inicial por nave principal:

| Uso | Triângulos aproximados | Texturas sugeridas |
| --- | ---: | --- |
| Nave do jogador, muito próxima | 80 mil a 150 mil | atlas 2K, eventualmente um segundo 2K |
| Nave próxima de combate | 40 mil a 80 mil | 1K a 2K |
| Distância média | 10 mil a 30 mil | 1K |
| Distante | 1 mil a 5 mil ou impostor | 256 a 512 |

- produzir pelo menos três LODs para toda nave e base importante;
- usar atlas de materiais para reduzir draw calls;
- usar detalhes de normal map em vez de geometria pequena;
- instanciar asteroides e variar escala, rotação e cor;
- descarregar assets de setores anteriores;
- evitar transparências grandes sobrepostas, principalmente em explosões.

### Iluminação e pós-processamento

- iluminação PBR com uma fonte estelar principal e ambiente controlado;
- materiais emissivos nas naves e bases;
- bloom moderado para motores, feixes, torpedos e estrelas;
- tone mapping consistente;
- sombras somente para objetos próximos e realmente perceptíveis;
- qualidade escalável para sombras, partículas, resolução e pós-processamento;
- não usar SSR, SSGI, profundidade de campo e volumetria pesada todos ao mesmo tempo;
- compilar/aquecer shaders importantes durante o carregamento para evitar travamentos no primeiro disparo.

### Planetas e estrelas

- planeta como esfera por LOD, textura de superfície, normal map, camada atmosférica e nuvens opcionais;
- lua sem atmosfera e com material mais simples;
- estrela como corpo emissivo, halo e luz principal, sem simulação volumétrica completa;
- corpos distantes renderizados em camada de fundo ou com escala artística;
- texturas científicas da NASA somente quando as diretrizes do arquivo específico permitirem, sempre registrando a fonte.

## 9. Pilha técnica recomendada

Versões consultadas em 20 de agosto de 2026; na implementação devem ser usadas versões estáveis e fixadas no lockfile, nunca tags beta ou alpha sem uma justificativa testada.

| Camada | Escolha | Situação atual | Motivo |
| --- | --- | --- | --- |
| Linguagem | TypeScript | 7.0.2 estável | tipos ajudam a controlar regras, saves e componentes de um jogo grande |
| Runtime de desenvolvimento | Node.js | migrar preferencialmente para 24 LTS; 22.23 atual ainda é suportado | estabilidade e compatibilidade de ferramentas |
| Motor 3D | PlayCanvas Engine | 2.21.4 estável | web-first, MIT, PBR, ECS, partículas, áudio, streaming e fallback WebGL 2 |
| Build/dev server | Vite | 8.2.1 estável | build estático otimizado e desenvolvimento rápido |
| Modelos | Blender | 5.2 LTS na documentação atual | gratuito, aberto e com exportação glTF integrada |
| Imagens/UI | Krita | gratuito e aberto | texturas, máscaras de dano, telas e concept art |
| Assets 3D | GLB/glTF 2.0 | padrão Khronos | formato compacto e adequado à GPU e à web |
| Otimização de assets | glTF Transform CLI | 4.4.2 | meshopt, redimensionamento e KTX2/Basis em pipeline reproduzível |
| Testes unitários | Vitest | usar estável compatível com Vite 8 | regras de energia, dano, IA e saves sem renderização |
| Testes no navegador | Playwright | 1.62.1 estável | verifica carregamento, controles, saves e navegadores reais |
| Física opcional | Rapier 3D | bindings JavaScript/WebAssembly, Apache 2.0 | colisões e constraints eficientes se o protótipo precisar |
| Hospedagem | GitHub Pages ou Cloudflare Pages | planos gratuitos para conteúdo estático | o jogo não precisa de backend na primeira versão |

Dependências que não devem ser adicionadas inicialmente:

- React para a cena 3D;
- outra ECS sobre a ECS do PlayCanvas;
- biblioteca de áudio separada, pois o motor já oferece áudio posicional;
- motor de física completo antes de existir uma necessidade medida;
- biblioteca de estado global para substituir algumas estruturas TypeScript simples;
- serviços de IA, banco de dados ou autenticação pagos.

O HUD pode ser HTML/CSS acessível sobre o canvas, comandado por TypeScript. Um framework de interface só deverá entrar quando menus e telas provarem que a complexidade o justifica.

## 10. Comparação dos motores atuais

| Opção | Pontos positivos | Limitações para este projeto | Decisão |
| --- | --- | --- | --- |
| PlayCanvas Engine 2.x | MIT, pequeno, web-first, TypeScript, ECS, PBR, streaming, WebGL 2 e WebGPU | WebGPU ainda aparece como beta na documentação; exige benchmark | recomendado |
| Babylon.js | Apache 2.0, muito completo, excelente WebGPU/WebGL, PBR, partículas, física, large-world | API e pacote mais amplos; mais recursos e complexidade do que o vertical slice precisa | melhor alternativa se PlayCanvas falhar no spike |
| Three.js | MIT, enorme ecossistema e liberdade de renderização | é mais biblioteca gráfica que motor de jogo; exigiria criar mais sistemas; WebGPURenderer ainda é descrito como experimental | não recomendado como primeira escolha |
| Godot 4 Web | MIT, editor excelente e boa estrutura de jogo | exportação web atual limitada a Compatibility/WebGL 2, sem WebGPU; limitações de threads e áudio no navegador | melhor para jogo nativo, não para esta prioridade web |
| Unity 6 Web | editor e ecossistema maduros | runtime e build mais pesados; licença Personal condicionada a limite financeiro; menos alinhado ao requisito de liberdade total | não recomendado |
| Babylon Lite | moderno e muito leve | somente WebGPU e ainda menos completo como motor; perderia o fallback essencial | acompanhar, não adotar agora |

## 11. Arquitetura proposta

Separar a simulação do domínio da apresentação gráfica será uma das decisões mais importantes.

### Domínio independente da renderização

- nave, reator, energia, escudo, arma, dano, missão e save são estruturas TypeScript testáveis;
- regras não devem depender de malhas, materiais ou partículas;
- o PlayCanvas exibe o estado e encaminha entradas, mas não deve ser o único lugar onde a regra existe;
- definições de naves, armas, facções e missões devem ser orientadas a dados e validadas.

### Frequências diferentes

- renderização: variável, tentando 60 FPS;
- movimento e combate: passo fixo;
- IA tática: 5 a 10 Hz;
- sensores distantes e tráfego: 1 a 5 Hz;
- sistemas fora do setor: atualização por eventos ou intervalos longos.

### Módulos lógicos previstos

- núcleo e ciclo da simulação;
- mundo/setores e origem flutuante;
- entidades de nave e base;
- voo e navegação;
- energia;
- armas;
- escudos, casco e subsistemas;
- sensores e exploração;
- IA;
- missões e progressão;
- save versionado;
- renderização e efeitos;
- interface e entrada;
- áudio;
- telemetria e perfis de qualidade.

### Eventos importantes

Sistemas devem se comunicar por eventos de domínio claros, como impacto de escudo, setor de escudo rompido, casco atingido, subsistema desativado, energia realocada, contato detectado e missão atualizada. Isso desacopla efeitos visuais, áudio, HUD e regras.

## 12. Pipeline de arte gratuito

1. Conceito visual e silhueta original.
2. Modelagem high/low poly no Blender.
3. UVs e atlas de materiais.
4. Bake de normal, ambient occlusion e máscaras.
5. Criação de texturas no Blender/Krita e, quando útil, materiais CC0.
6. Preparação de pontos de arma, motores, peças destacáveis e seções de dano.
7. Criação manual dos LODs.
8. Exportação GLB/glTF 2.0.
9. Validação do asset.
10. Otimização com glTF Transform, meshopt e KTX2/Basis.
11. Teste automático de tamanho, materiais, LODs e desempenho no cenário de benchmark.

Fontes de assets:

- criações próprias: preferência para naves, bases, interface, efeitos e identidade;
- Poly Haven: HDRIs, texturas e modelos CC0, com download e licença registrados;
- NASA: imagens e dados que não contenham material de terceiros e respeitem suas diretrizes; não usar logotipos nem sugerir endosso;
- outras bibliotecas: somente após registrar autor, URL, licença e data de obtenção.

Manter um inventário de licenças desde o primeiro asset. “Gratuito para baixar” não significa “permitido para redistribuir”.

## 13. Propriedade intelectual de Star Trek

Este é o maior risco não técnico do projeto.

As diretrizes oficiais encontradas tratam especificamente de filmes de fãs, afirmam que não são uma licença e reservam aos titulares todos os direitos. Elas não devem ser interpretadas como autorização automática para publicar um jogo. Um aviso de “fan game” reduz confusão, mas não cria uma licença.

Direção recomendada para um jogo público:

- criar universo, facções, nomes, história, uniformes, interface e designs originais;
- usar termos genéricos como feixe de energia, torpedo e raio de tração;
- não usar nome Star Trek no título do produto ou repositório público;
- não copiar Enterprise, bases, logotipos, personagens, vozes, músicas, sons ou interface LCARS;
- registrar a origem e a licença de todos os assets;
- buscar aconselhamento jurídico ou licença formal antes de qualquer distribuição que use diretamente a franquia.

Para um experimento estritamente pessoal e local, ainda é prudente usar assets originais. Antes da primeira publicação, a decisão de propriedade intelectual deve estar encerrada.

## 14. Testes e observabilidade

### Testes automatizados

- energia sempre conserva o total disponível;
- dano atinge o setor correto e nunca produz valores inválidos;
- phaser, torpedo e raio trator respeitam alcance, energia e cooldown;
- saves antigos passam por migração de esquema;
- IA não ataca alvos inválidos e consegue recuar;
- cena abre nos navegadores suportados e chega ao estado jogável;
- teclado, mouse e gamepad não ficam presos depois de pausa ou perda de foco.

### Benchmark fixo

Criar um encontro reproduzível com:

- nave do jogador em LOD0;
- quatro a oito naves em combate;
- uma base ou planeta no enquadramento;
- asteroides instanciados;
- múltiplos impactos de escudo, feixes, torpedos e destroços;
- HUD completo.

Esse cenário será executado em WebGL 2 e WebGPU nos perfis baixo, médio e alto. Toda funcionalidade visual nova deverá ser comparada contra o orçamento desse benchmark.

### Métricas em desenvolvimento

- FPS e percentis de tempo de quadro;
- tempo de CPU e, quando disponível, GPU;
- draw calls, triângulos e trocas de material;
- tamanho carregado por asset e por setor;
- quantidade de partículas, decalques e projéteis;
- pausas por compilação de shader e coleta de lixo;
- tempo até a primeira interação.

## 15. Roadmap realista

As durações abaixo são estimativas para uma pessoa trabalhando com regularidade e podem aumentar bastante por causa da criação de arte.

### Fase 0 — visão e propriedade intelectual, 1 semana

- fechar universo original ou condição de protótipo privado;
- definir perspectiva e estilo de voo;
- escrever uma página de visão, referências visuais e limites de escopo;
- definir critérios do protótipo.

### Fase 1 — protótipo técnico, 2 a 4 semanas

- benchmark de renderização;
- navegação e câmera;
- primeiro modelo com LOD;
- impacto de escudo e dano visual;
- uma arma de feixe e um torpedo;
- teste WebGL 2/WebGPU no notebook.

Ponto de decisão: se o cenário não sustentar 30 FPS no perfil médio, reduzir orçamento visual antes de criar conteúdo.

### Fase 2 — combate e energia, 4 a 8 semanas

- energia completa;
- escudos direcionais;
- phasers, torpedos e raio trator;
- casco e subsistemas;
- IA de combate;
- HUD e feedback de áudio;
- balanceamento do encontro padrão.

### Fase 3 — vertical slice, 6 a 10 semanas

- sistema estelar e mapa;
- base estelar;
- sensores e três tipos de missão;
- viagem em dobra e streaming;
- salvamento local;
- tutorial curto;
- arte e som próximos da qualidade final.

### Fase 4 — alpha, 3 a 6 meses

- mais sistemas, naves, bases e missões;
- progressão e reputação;
- acessibilidade e remapeamento;
- otimização, compatibilidade e correção de bugs;
- publicação gratuita do build estático, se a questão de propriedade intelectual estiver resolvida.

Uma vertical slice convincente é um objetivo de aproximadamente 4 a 6 meses em dedicação parcial consistente. Um jogo completo e polido para uma pessoa tende a exigir 12 a 24 meses ou mais, principalmente por causa de modelos, texturas, efeitos, áudio e conteúdo de missões.

## 16. Riscos e respostas

| Risco | Impacto | Resposta |
| --- | --- | --- |
| Escopo cresce para “simular toda a galáxia” | projeto não termina | setores, vertical slice e lista explícita de fora do escopo |
| Qualidade visual excede a MX130 | FPS baixo e travamentos | benchmark desde a primeira fase, LOD, KTX2, perfis e resolução dinâmica |
| Assets de Star Trek sem autorização | remoção do projeto ou disputa | universo e identidade originais antes de publicar |
| Arte leva mais tempo que programação | poucas naves e cenários | uma nave hero bem feita, kit modular e reutilização consciente |
| WebGPU falha ou fica mais lento nesse hardware | incompatibilidade | WebGL 2 obrigatório e seleção automática por benchmark |
| Física complexa consome CPU | combate instável | voo cinemático e colisões simples; Rapier apenas onde necessário |
| Multiplayer é adicionado cedo | servidor, custo e bugs de sincronização | single-player offline primeiro |
| Downloads muito grandes | abandono antes de jogar | carregamento por setor, compressão, tela inicial leve e cache |
| Dependências mudam rapidamente | manutenção difícil | versões estáveis fixadas, poucas dependências e atualizações deliberadas |

## 17. Critério de sucesso do vertical slice

O vertical slice estará pronto quando:

- for possível iniciar no navegador sem serviço pago;
- o jogador sair de uma base, viajar, escanear um contato, lutar ou completar um objetivo e retornar;
- energia para motores, escudos, armas e auxiliares produzir diferenças perceptíveis;
- phaser, torpedo e raio trator tiverem papéis distintos;
- impactos mostrarem setor de escudo, dano de casco e falha de subsistemas;
- planeta, lua, estrela, asteroides, nave inimiga e base estiverem presentes;
- o jogo sustentar pelo menos 30 FPS no pior combate da MX130 em perfil médio;
- saves locais sobreviverem a fechamento e reabertura do navegador;
- todos os assets tiverem autoria/licença registradas;
- o build puder ser hospedado como conteúdo estático.

## 18. Próximas validações recomendadas

A execução deve validar, nesta ordem:

1. universo original ou protótipo privado de fã;
2. câmera principal e estilo de voo;
3. nome provisório original;
4. primeira nave e seus valores de referência;
5. conteúdo exato do cenário de benchmark;
6. três missões do vertical slice;
7. direção visual da interface;
8. metas finais de FPS e resolução.

O P0 pode começar usando os defaults documentados. A decisão de propriedade intelectual torna-se bloqueante antes de produzir conteúdo final ou publicar; câmera, voo e metas técnicas serão validados por protótipo e benchmark.

## 19. Fontes principais consultadas

### Motores e web

- [PlayCanvas Engine e licença MIT](https://developer.playcanvas.com/user-manual/engine/)
- [Recursos gráficos do PlayCanvas](https://developer.playcanvas.com/user-manual/graphics/)
- [Navegadores suportados pelo PlayCanvas](https://developer.playcanvas.com/user-manual/engine/supported-browsers/)
- [Pacote PlayCanvas no npm](https://www.npmjs.com/package/playcanvas)
- [Especificações do Babylon.js](https://www.babylonjs.com/specifications/)
- [Repositório e licença Apache 2.0 do Babylon.js](https://github.com/BabylonJS/Babylon.js)
- [WebGPURenderer e fallback WebGL 2 do Three.js](https://threejs.org/manual/en/webgpurenderer)
- [WebGL e aceleração gráfica por hardware](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API)
- [Diagnóstico de WebGPU e seleção de GPU no Chrome](https://developer.chrome.com/docs/web-platform/webgpu/troubleshooting-tips)
- [Limitações atuais da exportação web do Godot (documentação estável)](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html)
- [Condições atuais do Unity Personal](https://unity.com/products/unity-personal)

### Linguagem e ferramentas

- [Versões LTS do Node.js](https://nodejs.org/en/about/previous-releases)
- [Vite 8 e requisitos de Node.js](https://vite.dev/blog/announcing-vite8)
- [TypeScript](https://www.typescriptlang.org/)
- [glTF Transform CLI](https://www.npmjs.com/package/@gltf-transform/cli)
- [Rapier e licença Apache 2.0](https://rapier.rs/docs/)
- [Playwright](https://www.npmjs.com/package/@playwright/test)

### Arte, assets e hospedagem

- [Licença e liberdade de uso do Blender](https://www.blender.org/about/license/)
- [Exportação glTF 2.0 no Blender](https://docs.blender.org/manual/en/latest/addons/scene_gltf2.html)
- [Padrão glTF e texturas KTX 2.0](https://www.khronos.org/gltf/)
- [Licença CC0 do Poly Haven](https://polyhaven.com/license)
- [Diretrizes de imagens e mídia da NASA](https://www.nasa.gov/nasa-brand-center/images-and-media/)
- [Limites do GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
- [Limites gratuitos do Cloudflare Pages](https://developers.cloudflare.com/pages/platform/limits/)

### Propriedade intelectual

- [Diretrizes oficiais para filmes de fãs de Star Trek](https://www.startrek.com/fan-films)
