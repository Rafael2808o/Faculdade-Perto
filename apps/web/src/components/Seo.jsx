import { Helmet } from 'react-helmet-async';
export function Seo({title,description,path='/',jsonLd,noindex=false}){const origin=window.location.origin;const url=`${origin}${path}`;const siteLd={'@context':'https://schema.org','@graph':[{'@type':'WebSite',name:'Faculdade Perto',url:origin,inLanguage:'pt-BR',description:'Catálogo brasileiro de cursos e instituições de ensino superior com fontes identificadas.'},{'@type':'Organization',name:'Faculdade Perto',url:origin,logo:`${origin}/brand-logo.svg`} ]};return <Helmet>
  <title>{title}</title><meta name="description" content={description}/><link rel="canonical" href={url}/>
  <meta property="og:title" content={title}/><meta property="og:description" content={description}/><meta property="og:type" content="website"/><meta property="og:url" content={url}/><meta property="og:image" content={`${window.location.origin}/og.png`}/>
  <meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content={title}/><meta name="twitter:description" content={description}/><meta name="twitter:image" content={`${origin}/og.png`}/>
  {noindex&&<meta name="robots" content="noindex,follow"/>}<script type="application/ld+json">{JSON.stringify(siteLd)}</script>{jsonLd&&<script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
  </Helmet>}
