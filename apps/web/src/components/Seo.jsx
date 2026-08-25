import { Helmet } from 'react-helmet-async';
export function Seo({title,description,path='/',jsonLd,noindex=false}){const url=`${window.location.origin}${path}`;return <Helmet>
  <title>{title}</title><meta name="description" content={description}/><link rel="canonical" href={url}/>
  <meta property="og:title" content={title}/><meta property="og:description" content={description}/><meta property="og:type" content="website"/><meta property="og:url" content={url}/><meta property="og:image" content={`${window.location.origin}/og.png`}/>
  <meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content={title}/><meta name="twitter:description" content={description}/><meta name="twitter:image" content={`${window.location.origin}/og.png`}/>
  {noindex&&<meta name="robots" content="noindex,follow"/>}{jsonLd&&<script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
  </Helmet>}
