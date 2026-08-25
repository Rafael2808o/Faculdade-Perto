// @vitest-environment jsdom
import React from 'react';import { render,screen } from '@testing-library/react';import { describe,expect,it } from 'vitest';import { DataBadge } from './DataBadge.jsx';
describe('DataBadge',()=>{it('torna a ausência sempre visível',()=>{render(<DataBadge field={{status:'nao_confirmado',reason:'Fonte não publica'}}/>);expect(screen.getByRole('button',{name:/não confirmado/i})).toBeTruthy()})});
