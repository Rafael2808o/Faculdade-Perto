// @vitest-environment jsdom
import {render,screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {describe,expect,it} from 'vitest';
import {VerifiedOfferingCard} from './VerifiedOfferingCard.jsx';

const offering={
  id:'17',
  course:{name:'Medicina',degree:'bacharelado',modality:'presencial',shift:'integral'},
  institution:{name:'Faculdades Integradas Rui Barbosa',acronym:'FIRB'},
  campus:{name:'Unidade Andradina — Centro',address:{street:'Rua Rodrigues Alves',number:'756',neighborhood:'Centro'}},
  location:{city:'Andradina',state:'SP'},
  source:{name:'Portal oficial Medicina UNIANDRADINA'}
};

describe('oferta atual verificada',()=>{
  it('mostra endereço, fonte e rota de detalhe sem confundir com o Censo',()=>{
    render(<MemoryRouter><VerifiedOfferingCard item={offering}/></MemoryRouter>);
    expect(screen.getByText('Oferta atual verificada')).toBeTruthy();
    expect(screen.getByText('Rua Rodrigues Alves, 756, Centro')).toBeTruthy();
    expect(screen.getByText(/Portal oficial Medicina UNIANDRADINA/)).toBeTruthy();
    expect(screen.getByRole('link').getAttribute('href')).toBe('/ofertas-verificadas/17');
  });
});
