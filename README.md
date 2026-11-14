# ASTOR — experiência digital

Site em uma página só, com narrativa conduzida pelo scroll, para o Astor (São Paulo).
Stack: **Vite + JavaScript puro + GSAP (ScrollTrigger, SplitText) + Lenis**. Fontes hospedadas no próprio projeto (Bodoni Moda + Instrument Sans).

```bash
npm install
npm run dev        # desenvolvimento
npm run build      # gera dist/
SITE_URL=https://seu-dominio npm run build   # URL absoluta usada em canonical/OG/JSON-LD
npm run images     # regenera public/img a partir de assets-src/ (requer Python + Pillow)
```

## Roteiro das cenas

| # | Seção | Desktop (≥1024px) | Mobile |
|---|---|---|---|
| 01 | Hero | Abertura com máscara + wordmark subindo letra a letra; ao rolar, a foto recua e o wordmark se abre | Mesma abertura; texto ancorado embaixo |
| 02 | O Astor | Manifesto em que as palavras acendem conforme a leitura; fotos em camadas com parallax, uma delas invade a seção seguinte | Igual, com parallax reduzido |
| 03 | Gastronomia | **Fixa (pin)**: o steak tartare gira, assenta e domina a cena; o texto entra; depois "Os protagonistas" em composição assimétrica | Sem pin: o prato gira com o scroll |
| 04 | Coquetelaria | **Fixa**: o copo cresce, desliza para a direita e o bar se abre num círculo a partir dele | Sem pin: copo e cena reagem ao scroll |
| 05 | Experiência | **Fixa**: a janela com o painel de azulejos se expande até ocupar a tela; lista com imagem que segue o cursor | Janela expande sem pin; miniaturas na lista |
| 06 | Nossas Casas | **Galeria horizontal guiada pelo scroll vertical**, com contador e parallax nas fotos | Carrossel nativo com scroll-snap (arrastar) |
| 07 | Reservas | Foto panorâmica que se abre como janela | Foto + painel |
| 08 | Rodapé | Assinatura ASTOR sobe letra a letra | — |

Acessibilidade: com `prefers-reduced-motion`, Lenis e todas as animações ficam desligados e o conteúdo é exibido de forma estática. Âncoras (inclusive para cada casa dentro da galeria horizontal) levam o foco ao destino. O menu mobile prende o foco e fecha com Esc; os cardápios abrem num `<dialog>` nativo.

## Fontes do conteúdo (verificadas em 14/11/2026)

Todo o conteúdo vem de **barastor.com.br** (páginas Início, Nossas Casas, Bar do Cofre, Missão, Perguntas Frequentes, Contato) e do **Instagram @barastor**.

- **Reservas:** link oficial do grupo na Tagme (`reservation-widget.tagme.com.br/group/645bde5bf8307e0056c186ee`). O Bar do Cofre tem link próprio (smartlink). O site oficial **não publica links de reserva por casa** para as outras cinco, então todas usam o link do grupo, onde se escolhe a casa.
- **Cardápios:** links livemenu de cada casa, tirados do site oficial.
- **Endereço e horário:** só o **Bar do Cofre** publica endereço e horário. Para as outras casas, "Como chegar" abre uma busca no Google Maps (nenhum endereço foi inventado).
- **Facilidades por casa** (valet, pet friendly, estacionamento, Terraço do Astor): seção Perguntas Frequentes.
- **Prêmio** ("maior vencedor do prêmio de Melhor Bar da Folha, com seis títulos"): peça publicada pelo próprio Astor na biblioteca de mídia do site (agosto/2025).
- **Textos institucionais:** citações do site oficial (Missão, Nossas Casas, Subastor, Bar do Cofre, Delivery). As frases sugeridas no briefing foram mantidas como copy.

## Fotos

Todas são do acervo oficial publicado em `barastor.com.br/wp-content/uploads` (originais em `assets-src/`, versões WebP responsivas em `public/img/`).
Os nomes dos pratos e drinks nas legendas vêm dos nomes dos arquivos oficiais (Steak Tartare, Batatas à Madrilenha, Bolinho de bacalhau, Latino Americano).

**Para confirmar com o cliente:**
- `casa-vila-nova.jpg` foi atribuída à Vila Nova Conceição pela placa de rua visível na foto (R. Baltazar da Veiga × R. Diogo Jacome).
- `casa-oscar-freire.jpg` foi atribuída à Oscar Freire pela comparação com a miniatura oficial da casa.
- `prato-conforto.jpg` não tem nome no acervo, por isso a legenda é "Cozinha de conforto".
- Wordmark: hoje é tipografado (Bodoni Moda). Trocar pelo logo vetorial oficial quando ele for fornecido.

## Pendências fora do escopo do código
- Links de reserva por casa (se a Tagme tiver um smartlink por casa).
- Endereços e telefones oficiais das cinco casas que não os publicam.
- Fotos em alta da coquetelaria autoral para ampliar a cena 04.

## Prévia publicada
https://twyck.github.io/astor-preview/ — marcada como `noindex` e com `robots.txt` bloqueando buscadores.
Para atualizar depois de ajustes: `npm run deploy`. No lançamento oficial, remover o `noindex` do `index.html` e o `public/robots.txt`.
