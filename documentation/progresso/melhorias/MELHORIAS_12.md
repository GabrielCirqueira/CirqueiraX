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
