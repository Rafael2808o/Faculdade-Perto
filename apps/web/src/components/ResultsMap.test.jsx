// @vitest-environment jsdom
import {render} from '@testing-library/react';
import {describe,expect,it,vi} from 'vitest';
vi.mock('react-leaflet',()=>({
  MapContainer:({children})=><div data-testid="map">{children}</div>,
  Popup:({children,maxHeight})=><div data-max-height={maxHeight}>{children}</div>,
  CircleMarker:({children})=><div>{children}</div>,Circle:()=> <div data-testid="radius-circle"/>,TileLayer:()=>null,ZoomControl:()=>null,
  useMap:()=>({flyTo:()=>{}})
}));
import {ResultsMap} from './ResultsMap.jsx';
describe('ResultsMap layout',()=>{
  it('separa controles do mapa e limita a lista longa no popup',()=>{
    const {container}=render(<ResultsMap items={[]} groups={[{city:'Andradina',state:'SP',lat:-20.8,lng:-51.3,records:40,institutions:Array.from({length:40},(_,id)=>({id,name:`Instituição ${id}`,records:1}))}]} radiusKm={25} setRadiusKm={()=>{}} onUserLocation={()=>{}} onActive={()=>{}}/>);
    const viewport=container.querySelector('.map-viewport');
    expect(viewport.contains(container.querySelector('.radius-control'))).toBe(false);
    expect(viewport.contains(container.querySelector('.map-notice'))).toBe(false);
    expect(container.querySelector('#radius').getAttribute('aria-valuetext')).toBe('25 quilômetros');
    expect(container.querySelector('[data-testid="radius-circle"]')).toBeNull();
    expect(container.querySelector('[data-max-height="180"]')).toBeTruthy();
    expect(container.querySelectorAll('.map-popup-item')).toHaveLength(40);
  });
});
