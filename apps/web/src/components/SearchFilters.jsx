import { categoryOptions,organizationOptions,states } from '../data/searchFilterOptions.js';

const option = ([value,label]) => <option key={value} value={value}>{label}</option>;
const advancedKeys = ['free','organization','category','dimension','minSeats'];

function FilterField({label,value,onChange,children}){
  return <label className="filter-field"><span>{label}</span><select value={value} onChange={onChange}>{children}</select></label>;
}

export function SearchFilters({filters,onChange,onClear}){
  const hasAdvanced = advancedKeys.some((key)=>filters[key]);
  return <div className="filters" aria-label="Filtros">
    <FilterField label="Estado" value={filters.state} onChange={(event)=>onChange('state',event.target.value)}><option value="">Todos os estados</option>{states.map((state)=><option key={state} value={state}>{state}</option>)}</FilterField>
    <FilterField label="Rede" value={filters.network} onChange={(event)=>onChange('network',event.target.value)}><option value="">Pública e privada</option><option value="publica">Pública</option><option value="privada">Privada</option></FilterField>
    <FilterField label="Modalidade" value={filters.modality} onChange={(event)=>onChange('modality',event.target.value)}><option value="">Presencial e EAD</option><option value="presencial">Presencial</option><option value="ead">EAD</option></FilterField>
    <FilterField label="Grau" value={filters.degree} onChange={(event)=>onChange('degree',event.target.value)}><option value="">Todos os graus</option><option value="bacharelado">Bacharelado</option><option value="licenciatura">Licenciatura</option><option value="tecnologo">Tecnólogo</option><option value="nao_confirmado">Não informado</option></FilterField>
    <FilterField label="Turno com vagas" value={filters.shift} onChange={(event)=>onChange('shift',event.target.value)}><option value="">Todos os turnos</option><option value="diurno">Diurno</option><option value="noturno">Noturno</option></FilterField>
    <FilterField label="Ordenação" value={filters.sort} onChange={(event)=>onChange('sort',event.target.value)}><option value="relevance">Mais relevantes</option><option value="name">Nome do curso</option><option value="seats">Mais vagas em 2024</option><option value="distance" disabled={!Number.isFinite(filters.lat)}>Mais perto de mim</option></FilterField>
    <details className="advanced-filters" open={hasAdvanced||undefined}><summary>Mais filtros{hasAdvanced&&<span>ativos</span>}</summary><div className="advanced-filter-grid">
      <FilterField label="Gratuidade" value={filters.free} onChange={(event)=>onChange('free',event.target.value)}><option value="">Gratuitos e não gratuitos</option><option value="sim">Gratuito</option><option value="nao">Não gratuito</option></FilterField>
      <FilterField label="Tipo de instituição" value={filters.organization} onChange={(event)=>onChange('organization',event.target.value)}><option value="">Todos os tipos</option>{organizationOptions.map(option)}</FilterField>
      <FilterField label="Categoria administrativa" value={filters.category} onChange={(event)=>onChange('category',event.target.value)}><option value="">Todas as categorias</option>{categoryOptions.map(option)}</FilterField>
      <FilterField label="Abrangência do registro" value={filters.dimension} onChange={(event)=>onChange('dimension',event.target.value)}><option value="">Todas as abrangências</option><option value="municipio">Município</option><option value="ead_brasil">EAD por município</option><option value="ead_brasil_agregado">EAD Brasil agregado</option><option value="ead_exterior">EAD exterior</option></FilterField>
      <FilterField label="Vagas mínimas em 2024" value={filters.minSeats} onChange={(event)=>onChange('minSeats',event.target.value)}><option value="">Qualquer quantidade</option><option value="1">Com vagas informadas</option><option value="50">50 ou mais</option><option value="100">100 ou mais</option><option value="200">200 ou mais</option></FilterField>
      <button type="button" className="secondary-button clear-filters" onClick={onClear}>Limpar filtros</button>
    </div></details>
  </div>;
}
