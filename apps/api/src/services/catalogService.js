import * as repository from '../repositories/catalogRepository.js';
import * as demoRepository from '../repositories/demoRepository.js';
import { AppError } from '../errors/AppError.js';
import { importedField, unconfirmedField } from '../utils/dataField.js';
import { preserveCompetitionModalities } from './cutoffService.js';
import { env } from '../config/env.js';

async function call(name,...args){
  if(env.DATA_MODE==='demo') return demoRepository[name](...args);
  try{return await repository[name](...args)}catch(error){
    if(env.DATA_MODE==='auto'&&['ECONNREFUSED','ENOTFOUND','57P01'].includes(error.code)) return demoRepository[name](...args);
    throw error;
  }
}

const pagination = (rows, page, limit) => ({ page, limit, total: Number(rows[0]?.total || 0), totalPages: Math.ceil(Number(rows[0]?.total || 0) / limit) });
const snapshotFrom = (row) => ({ sourceName: row.source_name, sourceUrl: row.source_url, importedAt: row.imported_at });

function institutionDto(row) {
  const snapshot = snapshotFrom(row);
  return {
    id: row.id, slug: row.slug, inepCode: row.inep_code,
    name: importedField(row.name, snapshot), acronym: importedField(row.acronym, snapshot),
    network: importedField(row.education_network, snapshot), administrativeCategory: importedField(row.administrative_category, snapshot),
    academicOrganization: importedField(row.academic_organization, snapshot),
    headquarters: importedField({ city: row.municipality_name, citySlug: row.municipality_slug, state: row.state_abbreviation, address: row.headquarters_address }, snapshot),
    campusNotice: unconfirmedField('O Censo INEP 2024 informa a sede administrativa, mas não identifica este endereço como campus.')
  };
}

export async function getInstitutions(filters) {
  const rows = await call('listInstitutions',filters);
  return { data: rows.map(institutionDto), pagination: pagination(rows, filters.page, filters.limit) };
}

export async function getInstitution(id,filters={page:1,limit:30}) {
  const row = await call('findInstitution',id);
  if (!row) throw new AppError('INSTITUICAO_NAO_ENCONTRADA','Instituição não encontrada.',{status:404,hint:'Confira o nome ou volte para a busca.'});
  const courses = await call('listInstitutionCourses',row.id,filters);
  return { ...institutionDto(row), maintainer: importedField(row.maintainer_name,snapshotFrom(row)), records: courses.map(({total,...course})=>course), recordsPagination:pagination(courses,filters.page,filters.limit) };
}

export async function getCourses(filters) {
  const rows = await call('listCourses',filters);
  return { data: rows.map(({total,...row}) => row), pagination: pagination(rows,filters.page,filters.limit) };
}

function searchDto(row) {
  const snapshot = snapshotFrom(row);
  return {
    resultType: 'census_course_record', id: row.id,
    course: { id: row.course_id, name: row.canonical_name, slug: row.course_slug, cineCode: row.cine_code },
    institution: { id: row.institution_id, name: row.institution_name, acronym: row.acronym, slug: row.institution_slug, network: row.education_network, administrativeCategory: row.administrative_category },
    location: { city: row.municipality_name, citySlug: row.municipality_slug, state: row.state_abbreviation, lat: row.lat === null ? null : Number(row.lat), lng: row.lng === null ? null : Number(row.lng), distanceKm: row.distance_km === null || row.distance_km === undefined ? null : Number(row.distance_km), status: 'nao_confirmado', reason: row.location_note || 'O Censo não identifica o campus desta oferta.' },
    degree: importedField(row.degree,snapshot), modality: importedField(row.modality,snapshot), free: importedField(row.free_indicator,snapshot),
    censusSeats: importedField(row.census_seats === null ? null : Number(row.census_seats),snapshot),
    tuition: unconfirmedField('O Censo INEP 2024 não publica mensalidades.'),
    cutoff: unconfirmedField('Nenhuma nota de corte por edição e modalidade foi vinculada a este registro.'),
    source: { name: row.source_name, url: row.source_url, importedAt: row.imported_at, referenceYear: row.census_year },
    rawCensusData: row.raw_payload || undefined,
    statistics: row.statistics || undefined,
    granularityNotice: 'Registro agregado do Censo 2024; não representa uma oferta ativa nem um campus confirmado.'
  };
}

export async function search(filters) {
  const rows = await call('searchCatalog',filters);
  if (!rows.length) {
    const place = filters.city || filters.state ? ` em ${filters.city || filters.state}` : '';
    return { data: [], pagination: pagination(rows,filters.page,filters.limit), empty: { message: `Nenhum curso encontrado${place}.`, hint: 'Tente remover um filtro, conferir a grafia ou buscar somente pelo nome do curso.' } };
  }
  return { data: rows.map(searchDto), pagination: pagination(rows,filters.page,filters.limit) };
}

export async function getCatalogRecord(id) {
  const row = await call('findCatalogRecord',id);
  if (!row) throw new AppError('REGISTRO_NAO_ENCONTRADO','Registro de curso não encontrado.',{status:404,hint:'Volte para a busca e escolha outro resultado.'});
  return searchDto(row);
}

export async function getNearby(filters) {
  const rows = await call('nearbyCampuses',filters);
  return { data: rows.map((row) => ({...row,distance_km:Number(row.distance_km)})), radiusKm: filters.radiusKm, notice: rows.length ? null : 'Não há campi com coordenadas verificadas neste raio. Referências aproximadas de município não entram neste cálculo.' };
}

export async function getOfferings(filters) {
  const rows = await call('listOfferings',filters);
  return { data: rows.map(({total,...row})=>row), pagination:pagination(rows,filters.page,filters.limit), notice: rows.length ? null : 'Nenhuma oferta individual foi confirmada por uma fonte complementar.' };
}

export async function getOffering(id) {
  const row=await call('findOffering',id);
  if(!row)throw new AppError('OFERTA_NAO_ENCONTRADA','Oferta individual não encontrada.',{status:404,hint:'Consulte /catalog-records para registros agregados do Censo.'});
  return row;
}

export const getCutoffs = async () => preserveCompetitionModalities(await call('listCutoffs'));
export const getSitemapData = () => call('sitemapData');
export const getSitemapCoreData = () => call('sitemapCoreData');
export const getSitemapRecordCount = () => call('sitemapRecordCount');
export const getSitemapRecordsPage = (page,limit) => call('sitemapRecordsPage',page,limit);
