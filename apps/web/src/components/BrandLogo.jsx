export function BrandLogo({compact=false,className=''}){
  return <span className={`brand-logo ${compact?'brand-logo-compact':''} ${className}`.trim()} aria-hidden="true">
    <svg className="brand-symbol" viewBox="0 0 48 48">
      <path className="brand-tile" d="M14 4h20c5.5 0 10 4.5 10 10v17.2c0 4.1-2 7.8-5.4 10.1l-11.2 7.4a6.2 6.2 0 0 1-6.8 0L9.4 41.3A12.2 12.2 0 0 1 4 31.2V14C4 8.5 8.5 4 14 4Z"/>
      <path className="brand-route" d="M15 34V18.5c0-3 2.5-5.5 5.5-5.5H33M15 24h13"/>
      <circle className="brand-destination" cx="34" cy="13" r="4.2"/>
    </svg>
    {!compact?<span className="brand-wordmark"><span>faculdade</span> <strong>perto</strong><i>.</i></span>:null}
  </span>;
}
