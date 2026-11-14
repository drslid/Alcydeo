---
title: "Instalação local"
---

A prévia é instalada localmente no Chrome desktop. Não exige conta Alcydeo nem software adicional. Ainda não há uma página na Chrome Web Store.

[Baixar a prévia](https://github.com/drslid/Alcydeo/releases/tag/v0.2.0) — v0.2.0

1. Baixe o ZIP para Chrome no GitHub Releases e extraia para uma pasta que será mantida.
2. Abra chrome://extensions, ative o modo do desenvolvedor e escolha Carregar sem compactação. Selecione a pasta com manifest.json.
3. Fixe o Alcydeo e atualize a página do vídeo. Inicie a reprodução, abra a extensão e escolha uma qualidade disponível.

### GitHub / MIT

Node 24.22.2 · pnpm 12.5.1

```sh
git clone https://github.com/drslid/Alcydeo.git
cd Alcydeo
pnpm install --frozen-lockfile
pnpm build:chrome
```

`apps/extension/.output/chrome-mv3`

Após atualizar, recarregue Alcydeo e as páginas de vídeo já abertas. A versão 0.1.39 encerra observadores antigos quando a comunicação do Chrome desaparece e corrige o erro sendMessage/contexto inválido. Erros anteriores podem ser apagados no painel de erros da extensão.
