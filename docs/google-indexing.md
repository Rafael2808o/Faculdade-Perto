# Preparação para o Google

O site já entrega os itens técnicos que podem ser publicados sem uma conta externa:

- URLs canônicas, títulos e descrições por página;
- dados estruturados `WebSite`, `Organization`, `FAQPage`, `EducationalOrganization` e `Course` quando há informação suficiente;
- `robots.txt` permitindo rastreamento e apontando para o sitemap;
- índice de sitemaps em `/sitemap.xml`, com páginas principais e registros públicos;
- imagem Open Graph, navegação acessível e respostas HTTP corretas para páginas inexistentes.

## Publicação no Google Search Console

Depois de definir o domínio público definitivo, o proprietário deve criar a propriedade no [Google Search Console](https://search.google.com/search-console), validar a propriedade e enviar:

```text
https://SEU-DOMINIO/sitemap.xml
```

Se o endereço temporário do Render continuar sendo usado, o sitemap correspondente é:

```text
https://faculdade-perto.onrender.com/sitemap.xml
```

Em seguida, use a Inspeção de URL para solicitar a indexação da página inicial e acompanhar erros de rastreamento. O envio do sitemap ajuda o Google a descobrir URLs, mas não garante posição nem prazo de indexação.

## Antes de divulgar

1. Preferir um domínio próprio curto, por exemplo `faculdadeperto.com.br`, e manter o Render apenas como hospedagem.
2. Atualizar `PUBLIC_SITE_URL` no Render para esse domínio antes de enviar o sitemap, para que URLs canônicas e XML não apontem para o endereço temporário.
3. Validar a propriedade do domínio no Search Console, enviar o sitemap e acompanhar os relatórios de páginas e de dados estruturados.
4. Manter apenas páginas com conteúdo público e verificável no sitemap; páginas de login, plano e agradecimento não devem ser indexadas.

Referências oficiais: [criar e enviar sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) e [monitorar sitemaps no Search Console](https://support.google.com/webmasters/answer/7451001).
