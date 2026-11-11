# Música — Spotify e YouTube Music juntos

> Página **Música**, rota `/musica`. Reúne o histórico do Spotify e do YouTube Music numa leitura só.
> Lote do roadmap: tópicos 186–205. Este documento cresce a cada tópico concluído.

---

## Objetivo

Transformar a página do Spotify numa página de música que reúne **Spotify e YouTube Music**. O padrão é ver tudo junto, com opção de filtrar por serviço. O YouTube Music é coletado automaticamente pelo servidor, o passado do YouTube vem do Google Takeout, e uma IA identifica música, artista e versões de cada vídeo para combinar com o que já existe do Spotify.

## Decisões

| Assunto | Decisão |
|---|---|
| Nome e rota | **Música**, em `/musica` |
| Visual | Mantém o tema do Spotify (fundo escuro, verde, cartões) |
| Seletor de fonte | Spotify, YouTube Music ou **Todos** (padrão). Cada música/artista mostra o ícone da origem; música ouvida nos dois aparece uma vez com os dois ícones |
| Coleta do YouTube Music | Pelo servidor, sem extensão de navegador. Cobre o celular, porque o histórico é da conta |
| Versões | Slowed, reverb, sped up, 8D, nightcore, lyrics, vídeo oficial, tradução, remix, cover e instrumental ficam juntos na música principal |
| Mashup | É uma música própria; cada artista dos componentes recebe crédito completo |
| Colaborações | Contam para todos os artistas (M128) |
| Identificação | IA (`OPENAI_MODELO_TEXTO`, hoje `gpt-5.4-mini`). Título e canal originais sempre guardados |
| Tempo ouvido em "Todos" | **Soma** medido (Spotify) e estimado (YouTube), com a marca "inclui estimativas" e tooltip separando os dois |
| Compilação | Vídeo com mais de `LIMITE_COMPONENTES_MASHUP = 5` músicas não credita artistas sem confirmação manual |
| Cápsula Sonora | Acompanha o seletor de fonte, com aviso de que a calibração é do Spotify |
| Desconectar o YouTube Music | Apaga só a credencial e **mantém as reproduções** |

As quatro últimas linhas são as propostas padrão do roadmap, adotadas até o Gabriel dizer o contrário.

## Regras de dados

- **Identidade da música:** título normalizado + artista principal normalizado (mesma regra do `SPOTIFY.md`, seção 7). Mashup: conjunto ordenado das chaves dos componentes. Nunca depender do código de faixa do Spotify nem do `videoId`.
- **Horário:** `tocadaEm` em UTC. No YouTube Music coletado, é quando o coletor viu a música aparecer. No Takeout, é o horário do arquivo. Reproduções do YouTube ficam com `tempoExato = false`.
- **Tempo ouvido estimado:** `min(intervalo até a reprodução seguinte, duração do vídeo)`. Tudo que vem do YouTube aparece como "estimado".
- **Stream:** 30 s ou mais (`30.000 ms`), aplicado na leitura, nunca na gravação.
- **Contagem:** cada reprodução conta 1 para a música; minutos totais contam uma vez; cada artista recebe stream e minutos completos. Mês e ano em UTC; "Hoje", hora do dia e "Últimos N dias" em `America/Sao_Paulo` (M120).
- **Ordem dos rankings:** streams, com minutos como desempate (M128).
- **Multiusuário (M131):** toda tabela nova tem `usuario_id`; o catálogo é por usuário; item de outra pessoa responde 404.

## Segurança da credencial do YouTube Music

O cookie é a sessão inteira da conta Google. Ele fica criptografado no banco com a `CriptografiaInterface`, entra no script Python **pela entrada padrão** (nunca argumento nem variável de ambiente), nunca vai para log, Sentry, resposta de API, repositório ou chat, e é apagado ao desconectar. O sistema precisa perceber quando o Google invalida a sessão e avisar.

## Evidências dos testes

- `ytmusicapi` com login por código de TV: erro 400 em tudo. Com cookie e cabeçalhos do navegador: 197 músicas no histórico, 47 playlists, 149 curtidas.
- O histórico não tem horário (só "Today", "Yesterday" e o mês) nem tempo ouvido; repetição seguida conta uma vez; em cerca de 64% dos itens o "artista" é o canal do upload.
- Cada consulta leva cerca de 0,8 s e devolve uns 1,9 MB sem compactar.
- **Duração do cookie:** o primeiro durou menos de um dia. O segundo (colado em 11/11) funcionou das 07h46 até cerca de 08h10 (UTC do servidor) e depois só devolveu `YTMusicServerError: None`. A biblioteca não diz que o problema é o cookie, então o sistema precisa tratar esse erro repetido como "sessão expirada" (tópico 192). A causa provável é a rotação dos cookies de sessão pelo navegador, que invalida a cópia antiga.
- IA com 9 títulos reais: todos separados corretamente; média de 155 tokens de entrada e 102 de saída, 2 a 4 s por chamada, cerca de US$ 0,0006 por vídeo (preço de agregadores, não confirmado). Ponto fraco: título ambíguo ("Renegade") sem aviso de dúvida.
- Spotify: o app é bloqueado (429) depois de cerca de 600 consultas de artistas; o bloqueio para também a coleta das músicas recentes.

## Pendências do Gabriel

1. **Google Takeout:** em `takeout.google.com`, desmarcar tudo, marcar só YouTube e YouTube Music; em "Todos os dados do YouTube incluídos" deixar só o **histórico**; trocar o formato do histórico para **JSON**; exportar uma vez. Opcional: agendar a cada 2 meses por 1 ano.
2. **Exclusão automática:** conferir em `myactivity.google.com` se o histórico do YouTube estava ligado e se há exclusão automática. Prazo menor que 13 meses significa que outubro de 2025 já foi apagado.
3. **Marca do Spotify:** ler as diretrizes de marca e a política de desenvolvedor do Spotify para confirmar se dados do Spotify podem aparecer misturados com outro serviço sob o visual do Spotify. Conclusão: _pendente_.
4. **Atraso do histórico:** dar play em 5 músicas novas anotando o horário de cada play, para comparar com a hora em que o coletor viu cada uma. Mediana: _pendente_. Máximo: _pendente_. Precisa de um cookie válido no coletor de teste.
5. **Credenciais do teste OAuth:** apagar o cliente OAuth do teste no Google Cloud e revogar o acesso em myaccount.google.com → Segurança → Apps de terceiros. As variáveis `YTMUSIC_CLIENT_ID` e `YTMUSIC_CLIENT_SECRET` já foram removidas do `.env` do servidor.
6. **Confirmar as decisões** marcadas como proposta padrão na tabela acima.

## Limpeza do teste

Só depois do tópico 192 estar em produção coletando: parar e remover o contêiner `ytmusic_teste_coletor` e apagar `/root/ytmusic_teste`.

## Fora do escopo

Player próprio dentro do CirqueiraX (M134); extensão de navegador; "tocando agora" do YouTube Music; gêneros; podcasts; YouTube comum depois da troca de hábito; relatórios de TV e outros aparelhos.
