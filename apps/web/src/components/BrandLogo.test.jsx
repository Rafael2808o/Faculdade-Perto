// @vitest-environment jsdom
import {render} from '@testing-library/react';
import {describe,expect,it} from 'vitest';
import {BrandLogo} from './BrandLogo';

describe('BrandLogo',()=>{
  it('renderiza a rota, o destino e a assinatura da marca',()=>{
    const {container}=render(<BrandLogo/>);
    expect(container.querySelector('.brand-route')).toBeTruthy();
    expect(container.querySelector('.brand-destination')).toBeTruthy();
    expect(container.querySelector('.brand-wordmark')?.textContent).toBe('faculdade perto.');
  });

  it('mostra somente o símbolo na versão compacta',()=>{
    const {container}=render(<BrandLogo compact/>);
    expect(container.querySelector('.brand-symbol')).toBeTruthy();
    expect(container.querySelector('.brand-wordmark')).toBeNull();
  });
});
