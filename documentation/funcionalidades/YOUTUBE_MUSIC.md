# YouTube Music

> Parte da página **Música** (`/musica`). Regras gerais, decisões e o histórico de cada tópico ficam em [MUSICA.md](MUSICA.md).

---

## 1. O que faz

Registra o que a conta ouve no YouTube Music, no computador ou no celular, sem extensão de navegador. O servidor consulta o histórico da conta, guarda cada reprodução, descobre a música e o artista de cada vídeo e junta tudo com o Spotify nos relatórios.

## 2. Conexão e cookie

- A conexão usa os **cabeçalhos de uma requisição logada** ao `music.youtube.com` (cookie e `x-goog-authuser`), colados no cartão do YouTube Music. O passo a passo aparece no próprio cartão.
- O cookie é a sessão inteira da conta Google. Fica criptografado no banco (`CriptografiaInterface`), entra no script Python só pela entrada padrão, nunca vai para log, Sentry, resposta de API ou repositório, e é apagado ao desconectar. O campo colado não fica no navegador e é limpo depois do envio.
- **Sair da conta no navegador invalida a sessão.** O jeito mais estável é copiar de uma janela anônima e fechá-la sem clicar em Sair.
- Quando o Google recusa a sessão, a conta vai para `reconectar`: a coleta para, o cartão e o Dashboard avisam, e basta colar cabeçalhos novos. Nenhuma reprodução é perdida.
- **Desconectar** apaga só a credencial; as reproduções continuam nos relatórios.

## 3. Coleta

- A cada 30 s o agendador verifica as contas conectadas; a consulta da mesma conta acontece a cada 30 s enquanto há novidade e a cada 120 s quando parado (fila `youtube_coleta`, 1 worker).
- O histórico do YouTube Music não tem horário nem tempo ouvido. O horário gravado é quando a música apareceu no histórico, com margem de alguns minutos, e o tempo ouvido é estimado: a música que está tocando conta só o tempo decorrido desde que apareceu (atualizado a cada coleta), e cada música é fechada pelo intervalo até a seguinte, sem passar da duração. Se você parar no meio, a última sobe até a duração.
- Repetir a mesma música em seguida não muda o topo do histórico, então a segunda vez não é contada.

## 4. Passado pelo Google Takeout

- Em `takeout.google.com`, exportar só **YouTube e YouTube Music**, só o **histórico**, em **JSON**. Enviar o `.zip` ou o `.json` em "Importar do Google Takeout" no cartão do YouTube Music.
- Só o arquivo do histórico de exibição é lido; buscas, comentários, inscrições e endereços IP são ignorados.
- Etapas: leitura → confirmação (números e custo estimado da IA) → classificação → relatório (músicas, mashups, compilações, não música, a revisar, indisponíveis, período e custo). Cancelar na confirmação pula a IA e deixa os vídeos na revisão.

## 5. Identificação

- Cada vídeo novo passa pela IA (`OPENAI_MODELO_TEXTO`), que devolve tipo, título, artistas, versão, confiança e, quando o título é ambíguo, até duas leituras alternativas.
- Versões (slowed, reverb, sped up, 8D, nightcore, lyrics, vídeo oficial, tradução, remix, cover, instrumental, ao vivo) ficam na mesma música; mashup é uma música própria que credita todos os artistas; mais de 5 músicas no mesmo vídeo vira compilação.
- Detalhes do vídeo (duração, canal, disponibilidade) vêm da YouTube Data API (`YOUTUBE_API_KEY`), atualizados a cada hora.
- O que a IA não resolve vai para a tela de **Revisão** (`/musica/revisao`).

## 6. Configuração

| Variável | Uso |
|---|---|
| `YOUTUBE_API_KEY` | Chave da YouTube Data API v3, restrita a essa API |
| `OPENAI_MODELO_TEXTO` | Modelo da identificação (padrão `gpt-5.4-mini`) |
| `OPENAI_PRECO_ENTRADA_POR_MILHAO` | Preço em US$ por milhão de tokens de entrada (padrão 0,75) |
| `OPENAI_PRECO_SAIDA_POR_MILHAO` | Preço em US$ por milhão de tokens de saída (padrão 4,50) |

## 7. Limites

- Sem horário exato e sem tempo ouvido real; tudo do YouTube Music aparece como estimado.
- Sem "tocando agora": o máximo é a última música detectada.
- Pulos e modo aleatório não existem para o YouTube Music.
- A sessão pode cair a qualquer momento por decisão do Google.
