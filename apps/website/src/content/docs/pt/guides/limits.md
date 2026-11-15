---
title: "Compatibilidade e limites"
---

São aceitos arquivos diretos e variantes HLS/DASH sem criptografia testadas. Acesso, codecs e armazenamento determinam a compatibilidade. Mídia protegida é recusada. Reserve cerca de três vezes o tamanho da mídia para segmentos; nem todos os arquivos grandes foram validados.

O Firefox 153+ tem um pacote próprio sem YouTube. Captura de aba do Chrome, Google Cast e AirPlay não estão disponíveis no Firefox. O processamento local depende dos seus codecs; o guia Firefox registra o escopo testado.

O ZIP de desenvolvimento Chrome inclui YouTube experimental. O pacote separado para a Chrome Web Store e o Firefox excluem YouTube. A instalação do ZIP Firefox é temporária; não se anuncia XPI assinado nem aprovação de loja.

Google Cast continua experimental. O usuário confirmou uma demonstração oficial Google na Shield; isso não valida outras fontes ou arquivos privados. Para arquivos locais na Shield, use a transmissão de aba do Chrome. AirPlay não está disponível no Chrome para Windows.

Gofile, MegaUp, 1fichier, Turbobit e links de envio pCloud são opcionais. O envio depende do seu clique. Os protocolos têm testes locais; envios reais não foram validados. Aplicam-se os limites e a retenção do provedor.

O build local detecta YouTube experimentalmente e processa faixas separadas/SABR. Um Short fornecido foi salvo completo a 144p/720p com áudio/vídeo; outras fontes, qualidades e sessões precisam de validação. O ZIP Store exclui YouTube. Inicie o player normal; SABR interrompido recomeça do início. Sem compatibilidade universal garantida.

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

clip.webm → clip-converted.mp4

Conversão para MP4

MP4 com vídeo H.264 e áudio AAC. Um arquivo por vez; mantenha o gerenciador aberto. O original é mantido. Faixas compatíveis são copiadas; outras faixas suportadas são recodificadas, o que pode demorar e alterar a qualidade.

Qualidade do vídeo: Automática · copiar vídeo compatível / Alta qualidade / Equilibrada / Arquivo menor.

Resolução máxima: Original · sem ampliar / 1080p / 720p / 480p.

Taxa de áudio: Automática · copiar AAC compatível / 128 / 192 / 256 kb/s.

Padrões para MP4. Mudar qualidade, resolução ou áudio pode exigir recodificação. Tamanho e velocidade dependem da origem e do computador.

A conversão é local. Uma cópia da origem escolhida e o MP4 ficam no armazenamento temporário do navegador até excluir a tarefa. O original no disco é mantido. O conteúdo não é enviado a servidores.

A conversão processa um arquivo por vez. Após pausar ou fechar o gerenciador, recomeça a partir da entrada salva.

## Gravar um fluxo ao vivo

Salve os segmentos HLS recebidos diretamente, mantendo a qualidade original. Suporta TS/fMP4 sem criptografia com áudio e vídeo no mesmo fluxo. Mantenha o gerenciador aberto. Para outras fontes use Captura da aba.

Começa em um segmento completo recente, que pode incluir segundos antes do clique. Parar e salvar termina o segmento atual e cria um MP4 verificado. O início da transmissão não é recuperado.

Este fluxo tem áudio separado. Use HLS combinado ou Captura da aba; não será salvo vídeo sem seu áudio.

A gravação foi interrompida. Salve a parte recebida; o período perdido não pode ser recuperado.
