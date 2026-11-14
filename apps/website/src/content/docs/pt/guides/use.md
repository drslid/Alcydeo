---
title: "Usar o Alcydeo"
---

Reproduza o vídeo: o Alcydeo detecta e atualiza o indicador automaticamente. Abra a janela, escolha uma qualidade disponível e baixe. Para HLS ou DASH, encontre as qualidades e mantenha o gerenciador aberto. O Chrome solicita acesso HTTP/HTTPS na instalação; limite-o no Chrome ou pause a detecção nas configurações. Um download direto termina quando o Chrome confirma que o arquivo foi salvo. Mostrar na pasta permite encontrá-lo. As qualidades vinculadas do mesmo vídeo ficam em um cartão. A qualidade escolhida é mantida após nova análise.

Fontes / Atividade. Os downloads continuam ao fechar esta janela. Mantenha a aba do gerenciador aberta para fluxos segmentados.

![Fontes](/Alcydeo/images/popup-progress.png)

Ferramentas de vídeo: Converter para MP4, Comprimir, Unir clipes, Cortar.

Detecção automática de mídia

Ativada por padrão. O Chrome concede acesso aos sites na instalação. Pause a detecção aqui ou limite o acesso no Chrome.

Limpar histórico

Os registros concluídos, com falha e cancelados e seus arquivos temporários serão removidos do Alcydeo em todas as páginas e filtros, incluindo favoritos. Os arquivos salvos e os downloads ativos ou pausados serão mantidos.

## Nuvem — 0.1.55

Biblioteca → Nuvem → Destino → Compartilhar com Gofile

## Biblioteca — 0.1.61

Cortar · Recortar enquadramento · Unir clipes · Converter para MP4 · Comprimir · Nuvem · Mostrar na pasta

Na janela da barra, escolha a qualidade e clique em Baixar. Cast fica ao lado. O menu … reúne corte e gravação. Captura da aba e Biblioteca permanecem embaixo ao rolar as fontes; idioma, ajuda e ajustes ficam no cabeçalho.

## 0.1.52

O TikTok utiliza os metadados nativos da publicação atual e conserva até três endereços CDN originais por qualidade. Um endereço que falha só é substituído após verificar a alternativa; a qualidade e o título escolhidos mantêm-se. Os limites do servidor exigem espera. Mantenha a página de origem e o gestor abertos até concluir a gravação.

## 0.1.51

Os tempos de corte podem ser editados junto ao vídeo: segundos, m:ss ou h:mm:ss com até três casas decimais. Os controlos e os campos ficam sincronizados; um intervalo inválido não pode ser exportado. As transferências por segmentos preservam o erro original quando os outros pedidos param. Os limites do servidor continuam a exigir espera; não são contornados.

## 0.1.50

As propostas e o contador de ficheiros diretos, HLS e DASH aparecem após verificações limitadas dos prefixos multimédia: no máximo duas verificações simultâneas em segundo plano, sem abrir a janela. Fontes incertas ficam ocultas; Analisar página tenta novamente. Os testes reais abrangem o Reel exato do Instagram, sem recomendações, além de TikTok e Odysee. Limites e verificações de acesso são indicados; o download completo de Odysee continua por validar. As dimensões do contentor aparecem quando disponíveis. Totais HTTP coerentes descrevem a fonte completa; ≈ indica estimativas, nunca apenas o tamanho da inicialização HLS. Metadados ausentes continuam desconhecidos. Os protótipos locais de YouTube SABR, listas e captura mantêm limites de validação distintos; esta verificação não certifica os seus bytes. A compatibilidade continua limitada.

## 0.1.49

As fontes de áudio e vídeo separadas do mesmo HLS VOD são agrupadas após verificar as suas faixas. Uma só proposta mantém as qualidades disponíveis e combina ambas as faixas. Não é aplicada normalização adicional dos URL; os restantes formatos e leitores continuam sujeitos aos limites documentados.

## Recortar enquadramento — 0.1.48

Selecione uma área do vídeo para exportar como um novo MP4. O original é mantido.

Arraste para desenhar uma área nova. Arraste dentro dela para mover ou use as alças para redimensionar. As setas movem 1 píxel; mantenha Shift pressionado para 10 píxeis.

## 0.1.47

Os ficheiros montados que passam na verificação da estrutura são guardados automaticamente, sem segundo clique. A reprodução local no navegador já não bloqueia a gravação; um codec indisponível pode exigir outro leitor. As falhas antigas de reprodução por codec são resolvidas sem novo download se o resultado conservado estiver intacto. Cancelar Guardar como continua a exigir uma nova tentativa explícita.

## 0.1.46

Duplicados adicionais de HLS VOD são agrupados após comparar o plano de download e amostras de bytes; o URL original do leitor é mantido. A opção de 2/4/8 ligações permite descarregar em conjunto as faixas de áudio e vídeo DASH compatíveis. Dividir um recurso exige um validador de versão forte e intervalos de bytes fiáveis. A velocidade depende do servidor e da ligação.

## VK Video — 0.1.43

VK Video: vídeos DASH compatíveis aparecem como uma fonte com seleção de qualidade. Fragmentos e sons da interface são excluídos. Alcydeo combina os recursos de vídeo e áudio declarados e salva um MP4 verificado. O vídeo de 7 min 53 s foi salvo e decodificado por inteiro em 144p (AV1/Opus). Nem todo codec, transmissão ao vivo, acesso privado ou DRM é compatível. Mantenha o gerenciador aberto durante o processamento.

## X — 0.1.38

Posts do X: recarregue o post após atualizar Alcydeo. Os dados nativos fornecem título e qualidades MP4 mesmo com player Blob. Dados atuais e antigos são lidos sem executar scripts. Listas de áudio e vídeo não aparecem separadas quando há arquivo completo. O post fornecido foi salvo e decodificado por inteiro como MP4 AVC/AAC de 57,6 segundos. Nem todo feed, post privado, live ou layout foi validado. Sem nova permissão, conta, API ou programa auxiliar.

## TikTok — 0.1.37

Posts do TikTok: o Alcydeo lê o catálogo nativo do post selecionado mesmo com player Blob. Qualidades e codecs ficam sob o título real. A aba de origem verifica e transmite o arquivo original ao processamento local, sem alterar cabeçalhos/assinaturas ou exigir programa auxiliar. Mantenha TikTok e gerenciador abertos; pode fechar o popup. Arquivos interrompidos reiniciam. O post AVC/AAC de 33 segundos fornecido foi salvo e decodificado por inteiro; feeds, lives, posts privados e todos os codecs/layouts não são universalmente validados.

## Playlist do YouTube — 0.1.38

Apenas build local: os vídeos disponíveis da playlist do YouTube começam selecionados. Desmarque os indesejados, escolha a qualidade máxima e inicie. Os arquivos são salvos um por vez numa subpasta com o nome da playlist, a posição original e o título do vídeo. Mantenha o gerenciador aberto; pode fechar o popup. Retomar ignora arquivos já salvos e permite tentar apenas os que falharam. Todos os metadados devem carregar antes do início (até 5.000 itens / 100 páginas). Usa continuações nativas e uma aba própria de reprodução sem som, sem contornar acesso. O envio completo de uma playlist real do YouTube não foi validado. O pacote Store exclui esta função.

Este mix muda: inclui apenas os títulos carregados agora pelo YouTube. Selecione o que salvar; sugestões futuras não estão incluídas.

Qualidade original indica que a resolução da fonte é desconhecida. Fontes identificadas como HTML são removidas. Quando um redirecionamento do leitor é observado, o título e a resolução permanecem associados ao arquivo de mídia real.

Alguns CDNs enviam MP4 como application/octet-stream. Alcydeo mantém a URL final assinada observada e exclui páginas HTML de player, erros e anexos HTML. Reinicie o player original após recarregar a extensão.

O indicador é atualizado quando uma fonte é detectada, mesmo que a página ou seus quadros ainda estejam carregando. As qualidades disponíveis são preenchidas depois. O site precisa primeiro fornecer uma fonte de mídia.

O Alcydeo pode reler automaticamente as listas detectadas para identificar qualidades e fragmentos. A extensão baixa os fragmentos de mídia quando você inicia um download.

Uma URL pode devolver outra lista HLS. O Alcydeo segue uma variante única para mostrar as qualidades reais e resolve a variante escolhida ao baixar, até seis níveis. Se a qualidade desaparecer, escolha novamente; fontes criptografadas continuam sem suporte.

Os metadados temporizados (0x15) não foram incluídos no arquivo salvo.

clip.webm → clip-converted.mp4

Conversão para MP4

MP4 com vídeo H.264 e áudio AAC. Um arquivo por vez; mantenha o gerenciador aberto. O original é mantido. Faixas compatíveis são copiadas; outras faixas suportadas são recodificadas, o que pode demorar e alterar a qualidade.

Qualidade do vídeo: Automática · copiar vídeo compatível / Alta qualidade / Equilibrada / Arquivo menor.

Resolução máxima: Original · sem ampliar / 1080p / 720p / 480p.

Taxa de áudio: Automática · copiar AAC compatível / 128 / 192 / 256 kb/s.

Padrões para MP4. Mudar qualidade, resolução ou áudio pode exigir recodificação. Tamanho e velocidade dependem da origem e do computador.

A conversão é local. Uma cópia da origem escolhida e o MP4 ficam no armazenamento temporário do navegador até excluir a tarefa. O original no disco é mantido. O conteúdo não é enviado a servidores.

A conversão processa um arquivo por vez. Após pausar ou fechar o gerenciador, recomeça a partir da entrada salva.

Salvar arquivos: Salvar automaticamente. Mostrar Salvar como em cada download.

Os arquivos são salvos nesta subpasta da pasta de downloads escolhida no Chrome. Altere a pasta principal nas configurações de download do Chrome.

## Downloads simultâneos — 0.1.60

Arquivos em paralelo: 1 / 2 / 3 / 4 / 5 / 6 / 7 / 8.

De 1 a 8 arquivos por vez, independentemente do número de conexões por arquivo. Os arquivos em espera começam assim que uma vaga fica livre.

Ao reduzir o limite, os downloads em andamento terminam normalmente. As conversões continuam uma por vez.

### Downloads em várias partes

Usar várias conexões para arquivos e DASH compatíveis.

Conexões por arquivo: 2 / 4 / 8.

Mantenha o gerenciador aberto. Faixas de áudio e vídeo compatíveis podem baixar juntas. Dividir um recurso exige intervalos confiáveis e um validador forte de versão; caso contrário, usa-se a transferência normal. A velocidade depende do servidor e da conexão.

## Biblioteca

Vídeos, downloads e processamento em um só lugar.

Selecionar esta página · Converter para MP4 · Comprimir · Unir clipes · Nuvem · Excluir seleção

Os arquivos são processados um por vez e os originais são mantidos. Escolha as cópias locais ausentes abaixo.

Editor visual de corte — Arraste os marcadores para escolher início e fim, visualize e salve a seleção em MP4.

Editor visual de montagem — Arraste os clipes ou use as setas para ordenar. Clique na miniatura para visualizar.

Compressão padrão: Usados para comprimir na biblioteca. Qualidade, resolução e áudio afetam tamanho e tempo.

Qualidade da captura: 720p / 1080p / 4K. Até 4K a 30 fps com maior bitrate. O detalhe depende da fonte; ampliar pixels não recupera detalhes ausentes.

Desenhar na aba capturada · Desfazer traço · Limpar desenho

Idioma: English / Español / Français / Deutsch / 简体中文 / العربية / Русский / Português / हिन्दी / اردو.

Download de originais; as extensões não garantem reproduzir ou converter todos os codecs no Chrome. M3U8 e MPD descrevem fluxos segmentados.

MP4 · WEBM · M3U8 · MPD · M4V · MKV · TS · MOV · AVI · OGG · MPG · WMV · FLV · 3GP · M2TS · MTS

MP3 · AAC · M4A · FLAC · WAV

Ignorar arquivos menores que: 10 KB / 100 KB / 1 MB / 2 MB. Tamanhos desconhecidos permanecem visíveis. O tamanho da lista não é o do vídeo.

Um domínio ou URL por linha, incluindo subdomínios. Os outros sites são analisados com a detecção automática.

## Ferramentas de vídeo

Recorte um vídeo ou una clipes na ordem desejada. O processamento fica no seu dispositivo.

Conversão local para MP4 H.264/AAC. Codecs incompatíveis são informados.

Crie um MP4 H.264/AAC local com os padrões de compressão em Configurações. Um arquivo menor não é garantido.

Escolha e ordene 2–20 clipes. MP4 até 720p/30 fps. Cada clipe precisa de uma faixa de vídeo e a mesma presença de áudio.

Arraste os marcadores para escolher início e fim, visualize e salve a seleção em MP4.

## Gravar transmissão

Ao vivo — Grava HLS ao vivo compatível diretamente. Outros players usam captura da aba.

Fluxo do player — Salve os segmentos HLS recebidos diretamente, mantendo a qualidade original. Suporta TS/fMP4 sem criptografia com áudio e vídeo no mesmo fluxo. Mantenha o gerenciador aberto. Para outras fontes use Captura da aba.

Começa em um segmento completo recente, que pode incluir segundos antes do clique. Parar e salvar termina o segmento atual e cria um MP4 verificado. O início da transmissão não é recuperado.

Este fluxo tem áudio separado. Use HLS combinado ou Captura da aba; não será salvo vídeo sem seu áudio.

A gravação foi interrompida. Salve a parte recebida; o período perdido não pode ser recuperado.

Captura da aba — Capture a aba pelo popup ou escolha uma tela aqui. Maior bitrate e até a resolução da fonte. Mantenha o gerenciador aberto.

## Nuvem — 0.1.57

Envia apenas o arquivo escolhido ao clicar. Sem sincronização automática.

Enviar para todas as nuvens sem configuração

Gofile · MegaUp · 1fichier · Turbobit. Cada serviço tem seus próprios limites.

**Excluir arquivos temporários** — 0.1.58

Exclui as cópias locais da Nuvem e cancela os envios em espera. Os originais e os links de compartilhamento são mantidos.

Compartilhar um link : Gofile / MegaUp / 1fichier / Turbobit. Salvar na nuvem : pCloud.

Gofile não exige login e cria um link público. Qualquer pessoa com o link pode acessar o arquivo. A retenção segue as regras do Gofile.

Compartilhamento experimental sem conta. Os arquivos são públicos e podem expirar após 30 dias sem atividade. Guarde o original.

Compartilhamento experimental sem conta. Qualquer pessoa com o link pode acessar o arquivo. Armazenamento após 15 dias não garantido; guarde o original. A disponibilidade pode demorar após o envio.

Compartilhamento experimental sem conta, até 200 MB por arquivo. Qualquer pessoa com o link pode acessar; retenção de até 7 dias. Guarde o original e confira o arquivo no Turbobit.

Sem entrar aqui: cole um link de envio pCloud existente e escolha a região da pasta. O proprietário precisa de uma conta pCloud. O arquivo vai para essa pasta, sem criar link público de download.

Link ou código de envio — Região de dados da pasta: Europa / Estados Unidos.

Tentar novamente envia o arquivo inteiro. Se a resposta se perdeu, verifique o destino para evitar duplicatas.

Mantenha o gerenciador aberto. Uma cópia temporária guarda o arquivo escolhido. Remover a entrada apaga a cópia local e mantém o arquivo remoto.

Protocolos de nuvem testados localmente. Envios reais ainda precisam de validação; MegaUp é experimental. pCloud exige link de envio existente.

## Excluir arquivos temporários — 0.1.63

Exclui as cópias locais da Nuvem e cancela os envios em espera. Os originais e os links de compartilhamento são mantidos.

Arquivos temporários excluídos. O histórico de envios e os links de compartilhamento são mantidos.

Há uma transferência ou preparação em andamento. Aguarde a conclusão ou cancele antes de limpar.

[Gofile API](https://gofile.io/api) · [pCloud API](https://docs.pcloud.com/methods/upload_links/uploadtolink.html)

## Verificando fonte…

Uma pequena amostra é verificada antes de baixar, não o arquivo completo. Atualize para testar as opções novamente.

A verificação encontrou fontes inválidas, indisponíveis ou pequenas demais. Recarregue o player original e detecte novamente.

Esta fonte é menor que o tamanho mínimo escolhido nas configurações.

[Reprodução na TV](/Alcydeo/pt/guides/tv/)
