export function BrandLogo({compact=false,className=''}){
  return <span className={`brand-logo ${compact?'brand-logo-compact':''} ${className}`.trim()} aria-hidden="true">
    <svg className="brand-symbol" viewBox="0 0 48 48">
      <path className="brand-pin" d="M24 3.5C13.2 3.5 6 11.4 6 21.2c0 12.3 13.7 21.9 16.9 24a2 2 0 0 0 2.2 0C28.3 43.1 42 33.5 42 21.2 42 11.4 34.8 3.5 24 3.5Z"/>
      <path className="brand-page" d="M12.5 16.2c4.3-1.5 7.8-.8 11.5 1.8v14.2c-3.7-2.6-7.2-3.3-11.5-1.8V16.2Zm23 0c-4.3-1.5-7.8-.8-11.5 1.8v14.2c3.7-2.6 7.2-3.3 11.5-1.8V16.2Z"/>
      <path className="brand-spine" d="M24 18v14.2"/>
    </svg>
    {!compact?<span className="brand-wordmark">Faculdade <strong>Perto</strong></span>:null}
  </span>;
}
