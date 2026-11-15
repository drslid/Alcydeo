---
title: "Instalação local"
---

Escolha o pacote de Chrome ou Firefox para computador. Não precisa de conta Alcydeo nem de outro software. Ainda não há página oficial nas lojas.

[Baixar Alcydeo](https://github.com/drslid/Alcydeo/releases/tag/v1.0.0) — v1.0.0

1. Baixe o ZIP para Chrome no GitHub Releases e extraia para uma pasta que será mantida.
2. Abra chrome://extensions, ative o modo do desenvolvedor e escolha Carregar sem compactação. Selecione a pasta com manifest.json.
3. Fixe o Alcydeo e atualize a página do vídeo. Inicie a reprodução, abra a extensão e escolha uma qualidade disponível.

### Firefox

Firefox 153+: carregue o ZIP em about:debugging → Este Firefox → Carregar extensão temporária. A instalação termina ao reiniciar o Firefox; a instalação permanente exige assinatura da Mozilla.

O Firefox 153+ tem um pacote próprio sem YouTube. Captura de aba do Chrome, Google Cast e AirPlay não estão disponíveis no Firefox. O processamento local depende dos seus codecs; o guia Firefox registra o escopo testado.

O ZIP de desenvolvimento Chrome inclui YouTube experimental. O pacote separado para a Chrome Web Store e o Firefox excluem YouTube. A instalação do ZIP Firefox é temporária; não se anuncia XPI assinado nem aprovação de loja.

Instalação nova ou configurações redefinidas: quatro arquivos simultâneos, download em partes ativado com quatro conexões por arquivo compatível. As escolhas existentes são preservadas. Os dois limites são ajustáveis; não há promessa de ganho universal de velocidade.

### GitHub / MIT

Node 24.22.2 · pnpm 12.5.1

```sh
git clone https://github.com/drslid/Alcydeo.git
cd Alcydeo
pnpm install --frozen-lockfile
pnpm build:chrome
pnpm build:firefox
```

Chrome: `apps/extension/.output/chrome-mv3`

Firefox: `apps/extension/.output/firefox-mv3`

Após atualizar, recarregue Alcydeo e as páginas de vídeo já abertas. A versão 0.1.39 encerra observadores antigos quando a comunicação do Chrome desaparece e corrige o erro sendMessage/contexto inválido. Erros anteriores podem ser apagados no painel de erros da extensão.
