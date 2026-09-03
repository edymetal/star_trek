# Playtest final do MVP P1

Atualizado em: 2 de setembro de 2026  
Status: gate técnico concluído; playtest humano de primeira experiência pendente

## Objetivo

Confirmar que uma pessoa que ainda não conhece os controles consegue aprender pelo próprio jogo e concluir as três missões sem consultar o README ou receber instruções externas. A automação cobre regras e caminhos, mas não substitui essa evidência de compreensão.

## Evidência técnica já concluída

- a campanha completa passou em Chrome e Edge, incluindo retorno, reload final e reinício;
- a primeira missão foi concluída com a rede desativada após a carga, sem requisição externa, service worker ou erro de console;
- combate pode ser vencido usando apenas o feixe, sem consumir torpedos;
- derrota permite reiniciar; base restaura casco, energia e seis torpedos;
- a entrada no voo captura o mouse; `Esc` e `P` pausam, liberam comandos e ponteiro e
  recapturam o mouse ao retomar; perda de foco também pausa e libera controles;
- objetivos impossíveis, equipamento bloqueado, alvo errado, save corrompido e checkpoints transitórios têm saídas seguras testadas;
- a campanha completa foi executada uma vez por navegador no gate final, além dos ciclos anteriores.

## Roteiro para a pessoa participante

1. Abra `ABRIR_JOGO.bat` e não leia o README.
2. Inicie um novo treinamento.
3. Conclua `Levantamento de Nereida`, `Socorro no Anel de Íris` e `Defesa do Corredor Aurora` usando apenas as mensagens e controles visíveis.
4. Feche e reabra o navegador pelo menos uma vez entre missões e use **Continuar treinamento**.
5. Na missão de combate, tente primeiro a estratégia que parecer natural; não há obrigação de usar torpedos.
6. Ao final, abra o diário e confirme as três descobertas.

## Registro mínimo

Registrar:

- iniciais ou apelido da pessoa e confirmação de que não conhecia os controles;
- navegador e resolução;
- missão em que precisou de ajuda, se alguma;
- texto, controle ou regra que gerou dúvida;
- ocorrência de objetivo impossível, perda de controle, falta de munição sem alternativa ou necessidade de recarregar a página;
- conclusão das três missões e percepção geral de dificuldade.

## Critério de aprovação

O playtest passa quando a pessoa conclui as três missões sem documentação externa e sem softlock. Dúvidas pontuais LOW/MEDIUM podem gerar ajuste documentado; qualquer fluxo impossível, perda de progresso ou instrução insuficiente que impeça avançar é HIGH e bloqueia o MVP até correção e nova execução.

Depois do registro, o Product Architect revisa a evidência, atualiza `docs/PROGRESS.md` e decide o gate formal. Até lá, o produto continua descrito como MVP em validação final, não como jogo completamente finalizado.
