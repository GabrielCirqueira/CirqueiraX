# CirqueiraX — Conheça o sistema

O CirqueiraX é a sua central de mídias pessoais. Ele reúne em um só lugar os vídeos que você baixa da internet, os prints que você tira no computador, as músicas que você quer guardar e os arquivos que você envia à mão. Depois organiza tudo, manda para as pastas certas, deixa disponível no celular e faz o backup no Google Fotos.

A ideia é simples: **você escolhe o que quer guardar, e o sistema cuida do resto.**

> Acesso: o sistema abre pelo navegador, no computador ou no celular. Basta entrar com seu usuário e senha.

---

## O que o CirqueiraX faz por você

| Sem o sistema | Com o CirqueiraX |
| :--- | :--- |
| Baixar um vídeo, procurar o arquivo, mandar para o celular e fazer backup à mão | Cole o link e escolha uma categoria. O vídeo vai para a pasta certa, chega ao celular e entra no álbum do Google Fotos |
| Tirar um print, abrir o navegador e subir no álbum certo | Tire o print normalmente. Ele aparece sozinho no sistema, já organizado |
| Não saber o que já foi salvo, onde está ou o que deu errado | Um painel mostra tudo: o que chegou, o que está sendo processado e o que falhou |
| Guardar o mesmo arquivo várias vezes | O sistema reconhece arquivos repetidos e avisa antes de duplicar |
| Disco cheio de vídeos antigos | Os vídeos antigos do servidor são removidos sozinhos, sem perder o registro nem a cópia do celular |

---

## As páginas do sistema

O menu lateral dá acesso a todas as páginas. Nele você também alterna entre **tema claro e escuro** e sai da sua conta.

### Dashboard

É a página inicial, um resumo de tudo que está acontecendo.

- **Números principais:** total de mídias, concluídas, em processamento e com erro.
- **Métricas de vídeos:** quantos foram baixados, quantos estão no disco, quantos foram apagados hoje e quanto espaço foi liberado.
- **Atalhos rápidos:** baixar um vídeo, abrir os prints ou fazer um upload.
- **Gráficos e atividades recentes:** mostram a distribuição das mídias e as últimas movimentações.
- **Status das integrações:** indica se Syncthing, processamento, Google Fotos e armazenamento estão funcionando.

O Dashboard também tem outras três abas:

- **Categorias:** crie e edite categorias e escolha a pasta e o álbum de cada uma.
- **Sincronização:** veja a situação das pastas sincronizadas e peça uma sincronização na hora.
- **Erros:** veja o que falhou, o motivo, e tente de novo com um clique.

### Central de Mídias

É a sua biblioteca completa, com tudo que entrou no sistema em uma tela só.

- **Abas:** Todas as Mídias, Upload Manual, Downloads Redes e Prints & Capturas, cada uma com sua contagem.
- **Filtros:** por tipo (fotos ou vídeos), categoria e situação, além de busca por título, nome do arquivo ou código do arquivo.
- **Duas formas de ver:** grade, no estilo do Google Fotos, ou tabela compacta.
- **Ações em cada item:** ver, copiar, baixar, editar imagem, trocar a categoria ou apagar.
- **Ações em vários itens:** selecione o que quiser e categorize ou apague tudo de uma vez.

Dois atalhos ajudam no dia a dia: **Ctrl+A** seleciona tudo, e com itens selecionados as **teclas de 1 a 9** aplicam uma categoria na hora.

### Downloads

É onde você baixa vídeos do **YouTube, TikTok, Instagram e X (Twitter)**.

**Como baixar:** cole o link, escolha uma categoria se quiser e pronto. Dá para colar vários links de uma vez ou simplesmente apertar **Ctrl+V** em qualquer lugar da página.

**Fila de downloads:** os vídeos são baixados um de cada vez, e um painel mostra o progresso. Você pode pausar, retomar, tentar de novo o que falhou e limpar os erros.

**Para organizar a lista:**

- Quatro formas de exibição: Grade, Compacto, Galeria e Lista.
- Escolha quantas colunas quer ver e quantos vídeos por página (25, 50 ou 100).
- Filtre por situação, origem ou categoria, incluindo só os vídeos ainda sem categoria.

**Ações com vários vídeos selecionados:**

- **Categorizar** ou **remover categoria**.
- **Distribuir horários:** espalha os vídeos ao longo do dia para organizar a linha do tempo. Há três modos: uniforme, retroativo e orgânico.
- **Rebaixar:** baixa novamente vídeos cujo arquivo foi removido.
- **Apagar**.

**Editar um vídeo:** você ajusta título, autor, data, duração exibida e capa. Há atalhos como Hoje, Ontem, -7 e -30 dias.

Cada vídeo também pode ser assistido dentro do próprio sistema.

> **Link repetido:** se o vídeo já foi baixado antes, o sistema não baixa outra vez e usa o que já tem.

### Downloads MP3

Transforma vídeos em música para você ouvir ou baixar.

- Cole um link no campo **Colar e baixar**, ou aperte **Ctrl+V** na página.
- As músicas aparecem em uma grade de capas, e você escolhe de 1 a 6 colunas.
- Um player fixo mostra o que está **Tocando agora**.
- Cada música tem uma barra mostrando quanto tempo falta para expirar.

> **Importante:** os arquivos MP3 ficam disponíveis por **7 dias**. Depois disso o arquivo é removido, mas você pode baixar de novo. Se quiser guardar uma música para sempre, baixe para o seu dispositivo.

### Música (Spotify, YouTube Music e Cápsula Sonora)

A página **Música** junta o que você ouve no Spotify e no YouTube Music. Um seletor no topo mostra tudo junto ou só um dos serviços, e cada música e artista tem o ícone de onde foi ouvido. O YouTube Music é registrado pelo servidor, inclusive o que você ouve no celular, e o passado vem do Google Takeout. Versões como slowed e reverb contam para a mesma música, mashups são músicas próprias e uma tela de revisão deixa corrigir o que a identificação automática errar. Os minutos do YouTube Music são estimados.

**Como o YouTube Music é registrado:** cada pessoa conecta a própria conta no cartão do YouTube Music, colando os cabeçalhos de uma página do `music.youtube.com` aberta numa janela anônima (o passo a passo aparece no cartão). Isso inclui o cookie da sessão do Google, que fica criptografado e nunca é mostrado de novo. A partir daí o servidor lê o histórico da conta a cada 30 segundos (2 minutos quando nada muda) e registra cada música nova, com o tempo da que está tocando crescendo enquanto ela toca. Se o Google encerrar a sessão, o cartão e o Dashboard pedem para reconectar, e basta colar de novo; nada do que já foi registrado se perde. Todas as capas, do Spotify e do YouTube, passam pelo próprio CirqueiraX, então aparecem mesmo em redes que bloqueiam os endereços originais.

Conecte sua conta do Spotify e reviva a antiga **Cápsula Sonora** com o resumo de cada mês: minutos ouvidos, músicas e artistas mais tocados, variedade musical comparada com o mês anterior e histórico diário. Acompanhe também o resumo de hoje e dos últimos 7 dias com curiosidades musicais e exportação em planilha CSV.

A página também mostra a música tocando agora, recordes e sequências de dias, a evolução mês a mês, o mapa de horários, a concentração do gosto, taxa de pulos e de aleatório, descobertas, redescobertas e obsessões, rankings de todos os tempos com álbuns e o resumo do ano. Cada artista e música tem página própria, e a Cápsula do mês pode virar uma imagem para compartilhar.

### Livros em Áudio

Transforma seus livros em formato PDF em audiolivros interativos com narração por voz neural no idioma do livro (português, inglês, espanhol, francês, italiano ou alemão).

- Envie arquivos PDF de livros com facilidade pelo seletor ou arrastando para a tela.
- O sistema extrai os textos e sintetiza a leitura com voz neural de alta naturalidade dividida em blocos e capítulos.
- Leitor de PDF integrado com virada de página automática sincronizada com o áudio ("Seguir áudio") ou navegação livre ("Folhear livre").
- Player com velocidade de 0,5x a 3x (guardada por livro), avanço/retrocesso de 15 segundos e integração com a central de mídia/tela de bloqueio do celular ou computador.
- Marcador de leitura automático que salva onde você parou para continuar de qualquer lugar.
- A frase lida fica destacada no PDF. Você escolhe se o destaque segue a frase inteira ou cada palavra.
- Se você abrir outra página e der play, a leitura começa nessa página.
- Escolha entre nove vozes: ouça uma amostra, gere o livro na voz que preferir e troque a qualquer momento, continuando da mesma frase.
- A voz não lê cabeçalhos, rodapés nem números de página, e lê textos em colunas na ordem certa.
- Escolha se as notas do livro são lidas no fim do capítulo, puladas ou lidas normalmente, e ensine a pronúncia de siglas e abreviações.
- Timer de sono, tempo restante do livro inteiro, recuo de 5 segundos ao retomar e passagem para a próxima parte sem espera.
- Clique numa frase para ouvir dali, destacar ou escrever uma nota. Vários marcadores, destaques e notas por livro, com exportação em Markdown.
- Busca no texto do livro com "ouvir a partir do resultado", sumário com os capítulos reais do livro e tema da página claro, sépia ou escuro.
- A geração começa pelas partes à frente de onde você está ouvindo. Pause um livro ou passe ele na frente da fila.
- Se a voz principal falhar, a parte é gerada com uma voz local (Piper), e há duas vozes Piper para escolher.
- Áudio e PDF por links assinados de curta duração, sem o login na URL.
- No Dashboard: continuar ouvindo, tempo ouvido por dia com meta diária e sequência, e quanto os livros ocupam de disco e memória.
- Baixe as próximas partes para ouvir sem internet.

### Transcrições

Transforma áudios e vídeos em texto. Jogue vários arquivos de uma vez e veja cada um sendo transcrito na hora.

- Envie vários áudios ou vídeos (MP3, M4A, WAV, OPUS do WhatsApp, MP4, MOV, MKV...) arrastando para a tela, até 2 GB cada. No vídeo, o sistema transcreve o que foi falado e guarda só o áudio.
- Cada arquivo entra numa fila e mostra o percentual e o tempo que falta. O texto vai aparecendo enquanto é reconhecido, e um aviso chega quando fica pronto.
- O idioma é detectado sozinho ou você escolhe entre português, inglês e espanhol.
- Ouça o áudio com o trecho falado destacado no texto. Clique numa frase para ouvir dali.
- Veja em trechos com o tempo de cada frase ou em texto corrido com parágrafos, procure palavras dentro do texto, copie ou baixe em TXT, Markdown, SRT ou VTT (legendas).
- Renomeie, favorite, busque em todas as transcrições e filtre por prontas, em andamento, favoritas ou com erro.
- Números da conta: horas transcritas, palavras e tempo de leitura.
- **Corrigir com IA**: depois de pronto, um botão manda o texto para a IA consertar palavras trocadas, nomes, pontuação e acentos, sem mudar o que foi dito. O texto corrigido aparece numa aba própria e o original continua salvo.
- A transcrição roda no próprio servidor, sem enviar o áudio para fora. Só a correção com IA envia o texto (nunca o áudio) para a OpenAI.
- O texto fica salvo para sempre. O áudio é apagado 7 dias depois do envio; até lá dá para ouvir e transcrever de novo.

### Prints & Capturas

É a galeria de capturas de tela, limpa e no estilo do Google Fotos.

Com o **Agente CirqueiraX** instalado no computador, cada print que você tira chega aqui automaticamente, sem você fazer nada. Prints do PC da empresa e do PC pessoal chegam com origens diferentes, mas ficam juntos na mesma galeria.

Em cada print você pode:

- **Copiar** a imagem e colar direto no WhatsApp, Discord ou Slack.
- **Baixar** o arquivo.
- **Categorizar**, **editar** ou **excluir**.
- **Abrir em tamanho grande**.

Você também pode buscar, filtrar por situação e categoria, escolher entre grade e lista, e selecionar vários prints para categorizar ou apagar de uma vez.

### Editor de Imagem

Um editor completo, dentro do sistema, para marcar e ajustar imagens.

**Como abrir uma imagem:** cole com Ctrl+V, arraste para a tela, escolha um arquivo ou clique em **Editar** em um print ou mídia.

**Ferramentas:**

| Ferramenta | Atalho | Para que serve |
| :--- | :--- | :--- |
| Selecionar | V | Mover e ajustar o que já foi desenhado |
| Seta | A | Apontar para algo |
| Retângulo | R | Destacar uma área |
| Círculo | E | Destacar uma área redonda |
| Linha | L | Traçar uma linha reta |
| Pincel | B | Desenhar à mão livre |
| Marca-texto | H | Grifar |
| Texto | T | Escrever na imagem |
| Número | N | Numerar passos |
| Pixelar | D | Esconder dados sensíveis |
| Recorte | C | Cortar a imagem |

Você escolhe entre 8 cores e 3 espessuras, e o editor lembra suas preferências. Também funcionam os atalhos conhecidos: **Ctrl+Z** para desfazer, **Ctrl+C** para copiar e **Ctrl+S** para salvar.

> O original nunca é alterado. Ao salvar, o sistema cria uma **nova mídia**, que mantém a origem e a data da imagem original.

### Extrair Texto

Cole uma imagem com Ctrl+V e o texto dela é lido na hora, já indo para a área de transferência. Funciona só no navegador, em português e inglês, sem salvar nada. Detalhes em [EXTRAIR_TEXTO.md](EXTRAIR_TEXTO.md).

### Upload Manual

Serve para enviar arquivos que já estão no seu dispositivo.

- Arraste os arquivos, escolha pelo seletor ou cole com **Ctrl+V**.
- Aceita fotos (PNG, JPEG, WebP e GIF) e vídeos (MP4, WebM, MOV, AVI e MKV) de até **500 MB** cada.
- Defina uma categoria para todos, para os selecionados ou para cada arquivo.
- Acompanhe o progresso e veja o resultado em grade ou tabela.
- Filtre por Todas, Sem Categoria, Classificadas e Com Erro.

Se o arquivo já existir, ele aparece como **Já Existente (Não Duplicado)**. Mesmo assim, você pode escolher **Sim, Sincronizar Mesmo Assim** para enviá-lo ao Google Fotos.

### Google Fotos

É onde você cuida do backup na nuvem.

- **Conexão:** conecte, reconecte ou desconecte sua conta Google pelo próprio sistema.
- **Álbuns:** veja os álbuns criados pelo CirqueiraX e quais estão ligados a uma categoria.
- **Vínculo:** ligue uma categoria a um álbum quando quiser.
- **Histórico de envios:** veja tudo que foi enviado, com filtros por situação e contadores das últimas 24 horas. Dá para abrir o item no Google Fotos e **reenviar** o que falhou. A lista se atualiza sozinha.

Os álbuns são criados automaticamente a partir das categorias, sem você precisar criá-los à mão.

---

## O que funciona nos bastidores

### Categorias

A categoria é o que define o destino de cada mídia: **uma pasta** e **um álbum do Google Fotos**. Basta escolher a categoria e o sistema faz a distribuição. Se você trocar a categoria depois, o arquivo muda de pasta e de álbum sozinho.

Prints já são organizados automaticamente pela origem. Vídeos e uploads aguardam você escolher, a não ser que a categoria tenha sido definida no envio.

### Sincronização com o celular

As mídias organizadas chegam ao celular pelo **Syncthing**, um aplicativo de sincronização direta entre os seus dispositivos. As subpastas aparecem como álbuns separados na galeria do Android.

### Backup no Google Fotos

Assim que uma mídia recebe uma categoria com álbum, o sistema a envia para o Google Fotos, com a data correta. Se o arquivo já tiver sido enviado, ele é reaproveitado sem subir de novo.

### Agente de prints

É um pequeno programa instalado no computador. No Windows, ele inicia junto com o sistema e funciona em segundo plano, sem janela. Ele percebe cada print novo e envia ao servidor. Se o agente estava desligado quando você tirou um print, o envio acontece assim que ele voltar a funcionar.

### Notificações de atualização

Quando o sistema ganha uma melhoria ou correção, aparece um popup com o que mudou. Fechar o popup ou clicar em **Ler tudo** marca como lido. O sino no topo guarda o histórico, inclusive as já lidas. Detalhes em [NOTIFICACOES.md](NOTIFICACOES.md).

### Proteção contra duplicados

O sistema compara o conteúdo de cada arquivo com o que já existe, inclusive vídeos muito parecidos. Assim, você não guarda a mesma coisa duas vezes.

### Limpeza automática

Para o servidor não encher, vídeos com mais de **7 dias** são removidos do armazenamento interno, e o card mostra **Arquivo Removido**. O que **continua guardado**:

- o registro do vídeo, com título, capa e dados;
- a cópia na pasta sincronizada com o celular;
- o que foi enviado ao Google Fotos.

Prints e imagens nunca entram nessa limpeza. Se precisar do vídeo de novo, use **Rebaixar**: ele volta com as mesmas datas e sem ser reenviado ao Google Fotos.

### Datas organizadas

Os arquivos saem com a data certa gravada. Assim, eles aparecem na ordem correta na galeria do celular e no Google Fotos.

---

## Situações que você verá nas mídias

| Situação | O que significa |
| :--- | :--- |
| **Recebido** / **Em fila** | A mídia chegou e vai ser processada |
| **Baixando** | O arquivo está sendo baixado |
| **Sem categoria** | Aguarda você escolher uma categoria |
| **Classificado** | A categoria foi definida |
| **Distribuindo** / **Distribuído** | Sendo copiado ou já copiado para a pasta da categoria |
| **Enviando backup** | Subindo para o Google Fotos |
| **Concluído** | Tudo pronto |
| **Falha** | Algo deu errado. Veja o motivo e tente de novo |
| **Arquivo removido** | O arquivo saiu do servidor para liberar espaço, e o registro continua. Pode ser rebaixado |

---

## Dúvidas comuns

**Apagar uma mídia no CirqueiraX apaga do Google Fotos?**
Não. O Google não permite que aplicativos externos apaguem fotos. Se precisar, apague direto no Google Fotos. O mesmo vale ao remover a categoria de uma mídia.

**Posso mudar a data de uma foto que já está no Google Fotos?**
Não pelo sistema, também por limitação do Google. A data é definida no momento do envio.

**Consigo ver meus álbuns antigos do Google Fotos?**
O Google só mostra ao sistema o que o próprio sistema criou. Para trazer fotos antigas, abra o Google Fotos e adicione-as ao álbum criado pelo CirqueiraX.

**Um download falhou. E agora?**
Clique em tentar novamente. Vídeos privados, removidos ou com restrição podem não estar disponíveis para download.

**Existe cadastro pelo site?**
Não. O CirqueiraX é um sistema pessoal, e os usuários são criados pelo administrador.

**O vídeo sumiu da pasta do celular?**
A limpeza automática não mexe na pasta sincronizada. Se você apagar um arquivo em um dispositivo, porém, o Syncthing pode replicar essa remoção para os outros.

---

## Um pouco da parte técnica

Para quem tiver curiosidade: o sistema roda em um servidor próprio, com **PHP e Symfony** por trás e **React** na interface. As tarefas pesadas são feitas em segundo plano, por uma fila. Os vídeos são obtidos com a ferramenta **yt-dlp**, e **ffmpeg** trata áudio, vídeo e datas.

A documentação técnica detalhada está em [CIRQUEIRAX.md](CIRQUEIRAX.md) e nos demais arquivos desta pasta.
