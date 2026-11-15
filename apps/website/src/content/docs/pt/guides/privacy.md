---
title: "Permissões e privacidade"
---

O ZIP de desenvolvimento Chrome inclui YouTube experimental. O pacote separado para a Chrome Web Store e o Firefox excluem YouTube. A instalação do ZIP Firefox é temporária; não se anuncia XPI assinado nem aprovação de loja.

O Firefox pede consentimento nativo opcional antes do envio à nuvem para o conteúdo e eventuais dados pessoais, como voz ou imagem. A recusa impede a preparação e o envio. Não há upload automático.

O teste local de YouTube guarda contexto observado limitado e tokens opacos existentes localmente com a tarefa. Não gera atestações nem executa código remoto do player. As exportações omitem esses dados.

Sem telemetria. Biblioteca e tarefas ficam neste navegador. Acesso à rede apenas para fontes autorizadas.

Detecção automática de mídia

A deteção inicia nos sites permitidos. Pause-a aqui ou limite o acesso no navegador.

O Alcydeo pode reler automaticamente as listas detectadas para identificar qualidades e fragmentos. A extensão baixa os fragmentos de mídia quando você inicia um download.

As tarefas armazenam URLs de página e fonte, incluindo assinaturas temporárias, localmente no IndexedDB. Fragmentos e saídas usam OPFS. Remover uma tarefa apaga registro e temporários, não o arquivo final nem o histórico do Chrome. Exportações omitem URLs, caminhos e IDs de download. Requisições contatam fontes/CDNs permitidos com as sessões aplicáveis do Chrome. O modo anônimo está desativado. O GitHub Pages hospeda a documentação pública e pode registrar visitas ao site. Suporte público: [GitHub Issues](https://github.com/drslid/Alcydeo/issues).

Limpar histórico

Os registros concluídos, com falha e cancelados e seus arquivos temporários serão removidos do Alcydeo em todas as páginas e filtros, incluindo favoritos. Os arquivos salvos e os downloads ativos ou pausados serão mantidos.

## Diagnóstico de detecção — 1.0.0

Biblioteca → Configurações → Detecção: escolha a aba de origem para ver ou copiar o diagnóstico local. Apenas códigos e contadores seguros, sem envio automático. O diagnóstico saiu da janela da extensão.

Relatório local, sem links de vídeo, cookies ou assinaturas. Nada é enviado.

Relatório local de detecção → Copiar relatório.

## X — 0.1.38

Posts do X: recarregue o post após atualizar Alcydeo. Os dados nativos fornecem título e qualidades MP4 mesmo com player Blob. Dados atuais e antigos são lidos sem executar scripts. Listas de áudio e vídeo não aparecem separadas quando há arquivo completo. O post fornecido foi salvo e decodificado por inteiro como MP4 AVC/AAC de 57,6 segundos. Nem todo feed, post privado, live ou layout foi validado. Sem nova permissão, conta, API ou programa auxiliar.

## TikTok — 0.1.37

Posts do TikTok: o Alcydeo lê o catálogo nativo do post selecionado mesmo com player Blob. Qualidades e codecs ficam sob o título real. A aba de origem verifica e transmite o arquivo original ao processamento local, sem alterar cabeçalhos/assinaturas ou exigir programa auxiliar. Mantenha TikTok e gerenciador abertos; pode fechar o popup. Arquivos interrompidos reiniciam. O post AVC/AAC de 33 segundos fornecido foi salvo e decodificado por inteiro; feeds, lives, posts privados e todos os codecs/layouts não são universalmente validados.

O catálogo e tokens de continuação ficam no IndexedDB e são limpos ao navegar ou limpar a sessão. Lotes selecionados persistem até limpar seu histórico concluído. O contexto nativo fica na página YouTube; pedidos usam a sessão do navegador. Nenhum dado vai para servidores Alcydeo, nuvem ou documentação.

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

O idioma e as miniaturas ficam nos registros locais da biblioteca. As miniaturas vêm de arquivos reais acessíveis. Os desenhos permanecem na aba e são removidos ao parar a gravação. Remover registros limpa dados temporários e mantém arquivos salvos. A gravação começa apenas após ação explícita ou escolha de superfície no Chrome.

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

Capture a aba pelo popup ou escolha uma tela aqui. Maior bitrate e até a resolução da fonte. Mantenha o gerenciador aberto.
