# Melhorias — M221 a M240

> Detalhamento das melhorias **M221–M240**. Índice em [MELHORIAS.md](MELHORIAS.md).

---

### ✅ Melhoria 221 — Inglês & Pronúncia: Letra da Música Tocando no Spotify com Pronúncia

- **Status**: Concluído
- **Data**: 25 de novembro de 2026
- **Pedido**: uma aba que mostra a música que está tocando no Spotify, acompanha o minuto exato e exibe a letra original com a pronúncia de cada linha.
- **Solução**:
  - Nova aba **Tocando agora** em `/pronuncia` (para todos com a permissão `pronuncia`; as abas Correções e Dicionário seguem só para administrador). A aba escolhida fica salva.
  - Letra sincronizada do **LRCLIB** (acervo aberto e gratuito, sem chave): busca exata por música, artista, álbum e duração; se falhar, busca pelo título sem sufixos ("- Remastered", "(feat. …)") com duração parecida. Fica salva por faixa em `letra_musica_pronuncia`; letra não encontrada é procurada de novo depois de 3 dias.
  - A pronúncia de cada linha é gerada na hora pelo motor (uma consulta ao dicionário para a letra toda), então correções aprovadas já valem nas letras.
  - Karaokê: a linha atual acende e fica centralizada; a posição é a do Spotify mais o tempo contado no navegador. Rolar a letra pausa o acompanhamento por 5 s, com botão "Voltar para a linha atual". Ajuste de sincronia de meio em meio segundo (salvo no navegador).
  - Consulta ao Spotify com folga para não estourar o limite do app: a cada 15 s tocando, 30 s parada, e logo depois do fim da faixa; nada enquanto a aba estiver em segundo plano; respeita o bloqueio já registrado.
  - Tradução da letra só quando pedida (botão **Tradução**): uma chamada em lote ao DeepL, linhas repetidas não gastam cota, e fica salva.
  - Clicar numa linha abre ouvir/devagar e o palavra por palavra com dicas. Avisos para Spotify desconectado, bloqueado, nada tocando, podcast, letra não encontrada, instrumental, letra sem tempo e letra que parece não estar em inglês.
- **Arquivos**: `src/Controller/Pronuncia/MusicaPronunciaController.php`, `src/Service/Pronuncia/{ObterTocandoAgoraPronunciaService,ObterLetraMusicaPronunciaService,TraduzirLetraMusicaService,GerarAnalisePronunciaService}.php`, `src/Infra/Lrclib/LrclibClient.php`, `src/Infra/DeepL/DeepLClient.php` (`traduzirLote`), `src/Domain/Pronuncia/{LeitorLetraMusica,NormalizadorTituloMusica}.php`, `src/Entity/LetraMusicaPronuncia.php`, `src/Repository/LetraMusicaPronunciaRepository.php`, `src/Enum/SituacaoLetraMusica.php`, `src/DataObject/Pronuncia/` (letra e tocando agora), `src/Interface/{BuscadorLetraMusicaInterface,TradutorTextoInterface}.php`, `migrations/Version20261125230754.php`, `web/features/pronuncia/` (novos: `components/{PainelMusicaTocando,LetraSincronizada,LinhaLetraItem,BarraTempoMusica}.tsx`, `hooks/useMusicaTocando.ts`)

---

### ✅ Melhoria 222 — Tocando Agora: Troca de Música Detectada em Segundos

- **Status**: Concluído
- **Data**: 25 de novembro de 2026
- **Problema**: ao trocar de música, a aba Tocando agora levava cerca de 20 s para perceber (consulta ao Spotify a cada 15 s). A letra em si chega em ~0,1 s pelo LRCLIB.
- **Solução**:
  - Ritmo de 5 s com a música tocando, decidido pelo servidor (`proximaConsultaMs`). Quando o "tocando agora" passa de 360 consultas na última hora (média de 6 por minuto), cai para 12 s, abaixo do ritmo que já causou bloqueio de ~20 h (≈10 por minuto durante uma hora).
  - Contagem em janela móvel de 60 minutos, minuto a minuto, em cache (`ControleLimiteSpotifyService::consultasNaUltimaHora`), para qualquer origem.
  - `ObterTocandoAgoraSpotifyService` guarda o resultado por 4 s por usuário: `/musica` e Inglês & Pronúncia abertas juntas dividem a consulta, com o progresso adiantado pelo tempo em cache.
  - Botão de atualizar no cartão da música e nova consulta ao voltar para a aba.
- **Arquivos**: `src/Service/Spotify/{ControleLimiteSpotifyService,ObterTocandoAgoraSpotifyService}.php`, `src/DataObject/Spotify/TocandoAgoraSpotifyDTO.php`, `src/Service/Pronuncia/ObterTocandoAgoraPronunciaService.php`, `src/DataObject/Pronuncia/TocandoAgoraPronunciaDTO.php`, `web/features/pronuncia/{types.ts,hooks/useMusicaTocando.ts,components/PainelMusicaTocando.tsx}`

---

### ✅ Melhoria 223 — Pronúncia Simples, do Jeito que a Gente Lê

- **Status**: Concluído
- **Data**: 25 de novembro de 2026
- **Pedido**: a pronúncia com maiúsculas, hífens e "â" ficou difícil de ler; queria algo silábico como "uotis ior neimi", "si iu leirer", "gudi bai", "rau mati iz dis", como opção ao lado da que já existia.
- **Solução**:
  - Novo modo **Simples** (padrão) ao lado de **Clara** e **Fala natural**, no tradutor, na palavra por palavra, no histórico, nas letras de música e no teste do motor.
  - `ConversorFonemasSimples` gera a escrita a partir dos fonemas do CMU: "i" de apoio no fim, "ch" → "ti", "h" → "r", "is" antes de s + consoante, "l" final → "u", T entre vogais → "r", c/qu e g/gu, só "ó" acentuado, formas prontas para palavras curtas (the → de, you → iu, of → ofi). Correções do administrador também valem no Simples.
  - Motor na versão 2: frases salvas ganham o campo `simples` na próxima tradução ou ao abrir pelo histórico.
  - Exemplos: Good morning → gudi mórnin · What's your name? → uatis ior neimi? · Speak slowly, please → ispiqui islouli, pliz · Water, please → uórer, pliz.
- **Arquivos**: `src/Domain/Pronuncia/{ConversorFonemasSimples,MontadorSentencaPronunciada}.php`, `src/Feature/Pronuncia/PronunciarTextoFeature.php`, `src/DataObject/Pronuncia/{PalavraPronunciadaDTO,SentencaPronunciadaDTO,AnalisePronunciaDTO}.php`, `src/Service/Pronuncia/{RecalcularFrasesPronunciaService,TraduzirTextoService,GerenciarHistoricoPronunciaService}.php`, `src/Entity/FrasePronuncia.php`, `src/Serializer/PronunciaSerializer.php`, `web/features/pronuncia/` (tipos, utils, `Pronuncia.tsx`, `ResultadoTraducao`, `PalavrasPronunciadas`, `HistoricoPronuncia`, `LinhaLetraItem`, `LetraSincronizada`, `PainelDicionario`, `EstadoInicialPronuncia`)

---

### ✅ Melhoria 224 — Spotify: Menos Consultas por Dia para Evitar Bloqueio

- **Status**: Concluído
- **Data**: 26 de novembro de 2026
- **Problema**: o Spotify bloqueou o app por 2 h às 06:40 de 26/11, durante a coleta automática do histórico. Nas 24 h anteriores foram ~1.366 consultas (coleta 838, busca de artistas 306, tocando agora 98, renovação de login 75, capas 49). A cota do modo de desenvolvimento vale para o app inteiro e as 3 contas conectadas dividem o mesmo limite.
- **Solução**:
  - Coleta do histórico recente a cada **10 minutos** (eram 5): de ~860 para ~430 consultas por dia. O Spotify guarda as últimas 50 músicas (2 a 3 horas), então nada se perde.
  - Aba Tocando agora: ritmo de 5 s só com folga também no dia (menos de 900 consultas do app inteiro em 24 h), além do limite por hora; sem folga, 15 s (eram 12 s).
- **Arquivos**: `src/Schedule.php`, `src/Service/Spotify/{ColetarHistoricoRecenteSpotifyService,ControleLimiteSpotifyService}.php`, `src/Service/Pronuncia/ObterTocandoAgoraPronunciaService.php`, `web/features/pronuncia/hooks/useMusicaTocando.ts`

---
