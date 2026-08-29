# Benchmark P0.5

Status: gate P0.5 aprovado na UHD 620; medição MX130 opcional  
Atualizado em: 28 de agosto de 2026

## Como executar

1. Feche outras abas e aplicativos 3D.
2. Nas configurações gráficas do Windows, selecione o navegador para a GPU que será medida.
3. Feche completamente o navegador depois de trocar a GPU.
4. Dê dois cliques em `EXECUTAR_BENCHMARK.bat`.
5. Mantenha a janela em foco até o painel informar **Medição concluída**.
6. Registre o renderizador mostrado pelo jogo e os valores de FPS médio, p50, p95 e p99.

O atalho abre o preset médio, aquece a cena por 5 segundos e mede 30 segundos. A URL aceita `preset=low`, `preset=medium` ou `preset=high`, além de `warmup` e `duration` entre 1 e 120 segundos. WebGL 2 é o padrão; `backend=webgpu` solicita o backend experimental e mantém fallback WebGL 2.

Para uma execução controlada em janela física do Chrome, use `npm run test:benchmark`. O padrão é 1600×900/médio, com 5 segundos de aquecimento e 30 segundos de coleta. A UHD 620 pode ser medida em PowerShell com:

```powershell
$env:BENCHMARK_PRESET='low'
$env:BENCHMARK_WIDTH='1280'
$env:BENCHMARK_HEIGHT='720'
npm run test:benchmark
```

Para comparar WebGPU, defina `$env:BENCHMARK_BACKEND='webgpu'`; o campo `backend` do resultado confirma o backend realmente criado. O relatório HTML e o anexo JSON ficam em `playwright-benchmark-report/` e `test-results/`, ambos artefatos locais ignorados pelo Git. Remova as variáveis `BENCHMARK_*` da sessão antes de medir novamente o padrão médio.

## Carga reproduzível

| Preset | Resolução interna | Naves de carga | Asteroides | Estrelas | Danos simultâneos |
| --- | ---: | ---: | ---: | ---: | ---: |
| Baixo | 75% | 4 | 96 | 680 | 1 |
| Médio | 90% | 6 | 144 | 900 | 2 |
| Alto | 100% | 8 | 192 | 1.200 | 3 |

Todos os objetos usam posições e movimentos derivados do índice e do relógio da simulação, sem aleatoriedade global. O cenário mantém dois efeitos táticos e um projétil ativos por meio do pool existente; a coleta conserva no máximo 7.200 amostras de frametime.

## Resultados físicos

Não preencha esta tabela com execução headless, aba em segundo plano ou renderização por software.

| GPU | Navegador | Resolução | Preset | Backend | FPS médio | p50 ms | p95 ms | p99 ms | Resultado |
| --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| GeForce MX130 2 GB | Opcional | 1600×900 | Médio | WebGL 2 | — | — | — | — | Diagnóstico não executado |
| Intel UHD 620 | Chrome 151.0.7922.34 | 1280×720 | Baixo | WebGL 2 | 60,010 | 16,7 | 17,9 | 18,9 | Aprovado; perfil funcional |
| Intel UHD 620 | Chrome 151.0.7922.34 | 1280×720 | Baixo | WebGPU | 60,011 | 16,7 | 17,6 | 19,9 | Comparação; sem ganho material |

As duas medições UHD usaram janela física, 5 segundos de aquecimento, 30 segundos de coleta e renderizador acelerado `ANGLE (Intel UHD Graphics 620, D3D11)`. O perfil baixo fica validado com limiar de 30 FPS médios e p99 de até 50 ms, preservando margem observada para variação térmica e carga do sistema. Conforme `DECISION-027`, não existe gate vinculado à MX130.

## Limites desta fatia

- WebGPU é somente uma opção do benchmark; não substitui WebGL 2 nem habilita efeitos exclusivos no MVP.
- Os modelos continuam procedurais e originais, sem assets externos.
- O cenário mede a carga visual representativa; não altera regras, percepção ou estado autoritativo do encontro jogável.
- O P0.5 foi aprovado com a medição física da GPU acelerada efetivamente escolhida pelo navegador; medições em outras GPUs continuam úteis, mas são opcionais.
