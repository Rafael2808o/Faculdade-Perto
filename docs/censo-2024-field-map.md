# Censo Superior 2024 — mapeamento completo de campos

Este documento cobre todas as 307 colunas dos dois CSVs publicados no pacote oficial examinado. Nenhum nome de coluna foi inventado. O valor original de toda linha permanece em `source_records.raw_payload`, mesmo quando também existe uma projeção normalizada.

Legenda:

- **direto:** projeta o valor para entidade/observação com status `importado`;
- **enum:** preserva o código e traduz pelo dicionário versionado do snapshot;
- **estatística:** grava métrica histórica agregada; nunca cria oferta, bolsa ou vaga vigente;
- **raw:** conserva no registro-fonte e não publica como atributo nuclear na Fase 1.

A palavra “direto” não significa “confirmado”: todo dado deste snapshot nasce como `importado`. Na implementação nacional, a linha completa fica em `institutions.raw_payload` ou `course_catalog_records.raw_payload`; `source_records` permanece disponível para fontes complementares e trilhas de observação.

## MICRODADOS_ED_SUP_IES_2024.CSV

Granularidade: uma IES por ano. O endereço é da sede administrativa/reitoria.

| # | Coluna INEP | Destino | Tratamento | Observação |
|---:|---|---|---|---|
| 1 | `NU_ANO_CENSO` | `source_snapshots.reference_period`; `field_observations.observed_at` | direto | Ano de referência; não é data de atualização. |
| 2 | `NO_REGIAO_IES` | raw + validação geográfica | raw | Texto redundante; região é derivada da UF somente para navegação. |
| 3 | `CO_REGIAO_IES` | raw + validação geográfica | raw | Código redundante; preservar no registro-fonte. |
| 4 | `NO_UF_IES` | `states.name` | direto | Validar contra `CO_UF_IES`. |
| 5 | `SG_UF_IES` | `states.abbreviation` | direto | Validar contra código IBGE. |
| 6 | `CO_UF_IES` | `states.ibge_code` | direto | Chave preferida da UF. |
| 7 | `NO_MUNICIPIO_IES` | `municipalities.name` | direto | Município da sede/reitoria, não de campus. |
| 8 | `CO_MUNICIPIO_IES` | `municipalities.ibge_code` | direto | FK de `institutions.headquarters_municipality_id`. |
| 9 | `IN_CAPITAL_IES` | observação da sede | enum | 0/1; não necessário para inferir geografia. |
| 10 | `NO_MESORREGIAO_IES` | raw | raw | Classificação geográfica histórica; não compõe o núcleo. |
| 11 | `CO_MESORREGIAO_IES` | raw | raw | Preservar para auditoria. |
| 12 | `NO_MICRORREGIAO_IES` | raw | raw | Classificação geográfica histórica; não compõe o núcleo. |
| 13 | `CO_MICRORREGIAO_IES` | raw | raw | Preservar para auditoria. |
| 14 | `TP_ORGANIZACAO_ACADEMICA` | `institutions.academic_organization` | enum | Traduzir pelo dicionário 2024 e preservar código. |
| 15 | `TP_REDE` | `institutions.education_network` | enum | Pública/privada; não implica gratuidade. |
| 16 | `TP_CATEGORIA_ADMINISTRATIVA` | `institutions.administrative_category` | enum | Não colapsar categorias. |
| 17 | `IN_COMUNITARIA` | observação da instituição | enum | 0/1; não inferir pela categoria. |
| 18 | `IN_CONFESSIONAL` | observação da instituição | enum | 0/1; não inferir pela categoria. |
| 19 | `NO_MANTENEDORA` | `maintainers.name` | direto | Histórico por observação. |
| 20 | `CO_MANTENEDORA` | `maintainers.inep_code` | direto | Chave externa. |
| 21 | `CO_IES` | `institutions.inep_code` | direto | Chave externa da IES. |
| 22 | `NO_IES` | `institutions.name` | direto | Nome oficial do snapshot. |
| 23 | `SG_IES` | `institutions.acronym` | direto | Pode ser nulo; não fabricar sigla. |
| 24 | `DS_ENDERECO_IES` | observação `headquarters.address_line` | direto | Endereço da sede/reitoria; nunca criar campus. |
| 25 | `DS_NUMERO_ENDERECO_IES` | observação `headquarters.number` | direto | Tratar como texto. |
| 26 | `DS_COMPLEMENTO_ENDERECO_IES` | observação `headquarters.complement` | direto | Pode ser nulo. |
| 27 | `NO_BAIRRO_IES` | observação `headquarters.neighborhood` | direto | Pode ser nulo. |
| 28 | `NU_CEP_IES` | observação `headquarters.postal_code` | direto | Tratar como texto de 8 dígitos. |
| 29 | `QT_TEC_TOTAL` | `institution_statistics(metric, value, year)` | estatística | Quadro técnico agregado da IES; histórico, fora da superfície nuclear da 1A. |
| 30 | `QT_TEC_FUNDAMENTAL_INCOMP_FEM` | `institution_statistics(metric, value, year)` | estatística | Quadro técnico agregado da IES; histórico, fora da superfície nuclear da 1A. |
| 31 | `QT_TEC_FUNDAMENTAL_INCOMP_MASC` | `institution_statistics(metric, value, year)` | estatística | Quadro técnico agregado da IES; histórico, fora da superfície nuclear da 1A. |
| 32 | `QT_TEC_FUNDAMENTAL_COMP_FEM` | `institution_statistics(metric, value, year)` | estatística | Quadro técnico agregado da IES; histórico, fora da superfície nuclear da 1A. |
| 33 | `QT_TEC_FUNDAMENTAL_COMP_MASC` | `institution_statistics(metric, value, year)` | estatística | Quadro técnico agregado da IES; histórico, fora da superfície nuclear da 1A. |
| 34 | `QT_TEC_MEDIO_FEM` | `institution_statistics(metric, value, year)` | estatística | Quadro técnico agregado da IES; histórico, fora da superfície nuclear da 1A. |
| 35 | `QT_TEC_MEDIO_MASC` | `institution_statistics(metric, value, year)` | estatística | Quadro técnico agregado da IES; histórico, fora da superfície nuclear da 1A. |
| 36 | `QT_TEC_SUPERIOR_FEM` | `institution_statistics(metric, value, year)` | estatística | Quadro técnico agregado da IES; histórico, fora da superfície nuclear da 1A. |
| 37 | `QT_TEC_SUPERIOR_MASC` | `institution_statistics(metric, value, year)` | estatística | Quadro técnico agregado da IES; histórico, fora da superfície nuclear da 1A. |
| 38 | `QT_TEC_ESPECIALIZACAO_FEM` | `institution_statistics(metric, value, year)` | estatística | Quadro técnico agregado da IES; histórico, fora da superfície nuclear da 1A. |
| 39 | `QT_TEC_ESPECIALIZACAO_MASC` | `institution_statistics(metric, value, year)` | estatística | Quadro técnico agregado da IES; histórico, fora da superfície nuclear da 1A. |
| 40 | `QT_TEC_MESTRADO_FEM` | `institution_statistics(metric, value, year)` | estatística | Quadro técnico agregado da IES; histórico, fora da superfície nuclear da 1A. |
| 41 | `QT_TEC_MESTRADO_MASC` | `institution_statistics(metric, value, year)` | estatística | Quadro técnico agregado da IES; histórico, fora da superfície nuclear da 1A. |
| 42 | `QT_TEC_DOUTORADO_FEM` | `institution_statistics(metric, value, year)` | estatística | Quadro técnico agregado da IES; histórico, fora da superfície nuclear da 1A. |
| 43 | `QT_TEC_DOUTORADO_MASC` | `institution_statistics(metric, value, year)` | estatística | Quadro técnico agregado da IES; histórico, fora da superfície nuclear da 1A. |
| 44 | `IN_ACESSO_PORTAL_CAPES` | raw; futuro enriquecimento de instituição | raw | Infraestrutura/biblioteca agregada à IES; não atribuir a campus na Fase 1. |
| 45 | `IN_ACESSO_OUTRAS_BASES` | raw; futuro enriquecimento de instituição | raw | Infraestrutura/biblioteca agregada à IES; não atribuir a campus na Fase 1. |
| 46 | `IN_ASSINA_OUTRA_BASE` | raw; futuro enriquecimento de instituição | raw | Infraestrutura/biblioteca agregada à IES; não atribuir a campus na Fase 1. |
| 47 | `IN_REPOSITORIO_INSTITUCIONAL` | raw; futuro enriquecimento de instituição | raw | Infraestrutura/biblioteca agregada à IES; não atribuir a campus na Fase 1. |
| 48 | `IN_BUSCA_INTEGRADA` | raw; futuro enriquecimento de instituição | raw | Infraestrutura/biblioteca agregada à IES; não atribuir a campus na Fase 1. |
| 49 | `IN_SERVICO_INTERNET` | raw; futuro enriquecimento de instituição | raw | Infraestrutura/biblioteca agregada à IES; não atribuir a campus na Fase 1. |
| 50 | `IN_PARTICIPA_REDE_SOCIAL` | raw; futuro enriquecimento de instituição | raw | Infraestrutura/biblioteca agregada à IES; não atribuir a campus na Fase 1. |
| 51 | `IN_CATALOGO_ONLINE` | raw; futuro enriquecimento de instituição | raw | Infraestrutura/biblioteca agregada à IES; não atribuir a campus na Fase 1. |
| 52 | `QT_PERIODICO_ELETRONICO` | raw; futuro enriquecimento de instituição | raw | Infraestrutura/biblioteca agregada à IES; não atribuir a campus na Fase 1. |
| 53 | `QT_LIVRO_ELETRONICO` | raw; futuro enriquecimento de instituição | raw | Infraestrutura/biblioteca agregada à IES; não atribuir a campus na Fase 1. |
| 54 | `QT_DOC_TOTAL` | `institution_statistics(metric, value, year)` | estatística | Docentes agregados da IES; histórico, não atributo de campus. |
| 55 | `QT_DOC_EXE` | `institution_statistics(metric, value, year)` | estatística | Docentes agregados da IES; histórico, não atributo de campus. |
| 56 | `QT_DOC_EX_FEMI` | `institution_statistics(metric, value, year)` | estatística | Docentes agregados da IES; histórico, não atributo de campus. |
| 57 | `QT_DOC_EX_MASC` | `institution_statistics(metric, value, year)` | estatística | Docentes agregados da IES; histórico, não atributo de campus. |
| 58 | `QT_DOC_EX_SEM_GRAD` | `institution_statistics(metric, value, year)` | estatística | Docentes agregados da IES; histórico, não atributo de campus. |
| 59 | `QT_DOC_EX_GRAD` | `institution_statistics(metric, value, year)` | estatística | Docentes agregados da IES; histórico, não atributo de campus. |
| 60 | `QT_DOC_EX_ESP` | `institution_statistics(metric, value, year)` | estatística | Docentes agregados da IES; histórico, não atributo de campus. |
| 61 | `QT_DOC_EX_MEST` | `institution_statistics(metric, value, year)` | estatística | Docentes agregados da IES; histórico, não atributo de campus. |
| 62 | `QT_DOC_EX_DOUT` | `institution_statistics(metric, value, year)` | estatística | Docentes agregados da IES; histórico, não atributo de campus. |
| 63 | `QT_DOC_EX_INT` | `institution_statistics(metric, value, year)` | estatística | Docentes agregados da IES; histórico, não atributo de campus. |
| 64 | `QT_DOC_EX_INT_DE` | `institution_statistics(metric, value, year)` | estatística | Docentes agregados da IES; histórico, não atributo de campus. |
| 65 | `QT_DOC_EX_INT_SEM_DE` | `institution_statistics(metric, value, year)` | estatística | Docentes agregados da IES; histórico, não atributo de campus. |
| 66 | `QT_DOC_EX_PARC` | `institution_statistics(metric, value, year)` | estatística | Docentes agregados da IES; histórico, não atributo de campus. |
| 67 | `QT_DOC_EX_HOR` | `institution_statistics(metric, value, year)` | estatística | Docentes agregados da IES; histórico, não atributo de campus. |
| 68 | `QT_DOC_EX_0_29` | `institution_statistics(metric, value, year)` | estatística | Docentes agregados da IES; histórico, não atributo de campus. |
| 69 | `QT_DOC_EX_30_34` | `institution_statistics(metric, value, year)` | estatística | Docentes agregados da IES; histórico, não atributo de campus. |
| 70 | `QT_DOC_EX_35_39` | `institution_statistics(metric, value, year)` | estatística | Docentes agregados da IES; histórico, não atributo de campus. |
| 71 | `QT_DOC_EX_40_44` | `institution_statistics(metric, value, year)` | estatística | Docentes agregados da IES; histórico, não atributo de campus. |
| 72 | `QT_DOC_EX_45_49` | `institution_statistics(metric, value, year)` | estatística | Docentes agregados da IES; histórico, não atributo de campus. |
| 73 | `QT_DOC_EX_50_54` | `institution_statistics(metric, value, year)` | estatística | Docentes agregados da IES; histórico, não atributo de campus. |
| 74 | `QT_DOC_EX_55_59` | `institution_statistics(metric, value, year)` | estatística | Docentes agregados da IES; histórico, não atributo de campus. |
| 75 | `QT_DOC_EX_60_MAIS` | `institution_statistics(metric, value, year)` | estatística | Docentes agregados da IES; histórico, não atributo de campus. |
| 76 | `QT_DOC_EX_BRANCA` | `institution_statistics(metric, value, year)` | estatística | Docentes agregados da IES; histórico, não atributo de campus. |
| 77 | `QT_DOC_EX_PRETA` | `institution_statistics(metric, value, year)` | estatística | Docentes agregados da IES; histórico, não atributo de campus. |
| 78 | `QT_DOC_EX_PARDA` | `institution_statistics(metric, value, year)` | estatística | Docentes agregados da IES; histórico, não atributo de campus. |
| 79 | `QT_DOC_EX_AMARELA` | `institution_statistics(metric, value, year)` | estatística | Docentes agregados da IES; histórico, não atributo de campus. |
| 80 | `QT_DOC_EX_INDIGENA` | `institution_statistics(metric, value, year)` | estatística | Docentes agregados da IES; histórico, não atributo de campus. |
| 81 | `QT_DOC_EX_COR_ND` | `institution_statistics(metric, value, year)` | estatística | Docentes agregados da IES; histórico, não atributo de campus. |
| 82 | `QT_DOC_EX_BRA` | `institution_statistics(metric, value, year)` | estatística | Docentes agregados da IES; histórico, não atributo de campus. |
| 83 | `QT_DOC_EX_EST` | `institution_statistics(metric, value, year)` | estatística | Docentes agregados da IES; histórico, não atributo de campus. |
| 84 | `QT_DOC_EX_COM_DEFICIENCIA` | `institution_statistics(metric, value, year)` | estatística | Docentes agregados da IES; histórico, não atributo de campus. |

## MICRODADOS_CADASTRO_CURSOS_2024.CSV

Granularidade: agregado de curso por IES/dimensão geográfica e demais dimensões presentes. Não há campus, polo, endereço do local de oferta, turno identificador nem situação regulatória ativa/inativa.

| # | Coluna INEP | Destino | Tratamento | Observação |
|---:|---|---|---|---|
| 1 | `NU_ANO_CENSO` | `course_catalog_records.census_year` | direto | Ano de referência. |
| 2 | `NO_REGIAO` | raw + validação geográfica | raw | Pode estar vazio para EAD conforme dimensão. |
| 3 | `CO_REGIAO` | raw + validação geográfica | raw | Pode estar vazio para EAD conforme dimensão. |
| 4 | `NO_UF` | `states.name` quando aplicável | direto | Não aplicável em dimensões EAD agregadas. |
| 5 | `SG_UF` | `states.abbreviation` quando aplicável | direto | Não preencher quando o arquivo traz não aplicável. |
| 6 | `CO_UF` | `states.ibge_code` quando aplicável | direto | FK somente quando informado. |
| 7 | `NO_MUNICIPIO` | `municipalities.name` quando aplicável | direto | Município do agregado; não é campus/polo. |
| 8 | `CO_MUNICIPIO` | `municipalities.ibge_code` quando aplicável | direto | FK somente quando informado. |
| 9 | `IN_CAPITAL` | observação do agregado | enum | 0/1/(.) conforme dicionário. |
| 10 | `TP_DIMENSAO` | `course_catalog_records.dimension` | enum | Define granularidade geográfica real. |
| 11 | `TP_ORGANIZACAO_ACADEMICA` | checagem redundante de `institutions` | enum | Conflito gera rejeição/diff; não sobrescrever silenciosamente. |
| 12 | `TP_REDE` | checagem redundante de `institutions` | enum | Não confundir pública com gratuita. |
| 13 | `TP_CATEGORIA_ADMINISTRATIVA` | checagem redundante de `institutions` | enum | Preservar categoria. |
| 14 | `IN_COMUNITARIA` | checagem redundante de `institutions` | enum | Não inferir. |
| 15 | `IN_CONFESSIONAL` | checagem redundante de `institutions` | enum | Não inferir. |
| 16 | `CO_IES` | `course_catalog_records.institution_id` | direto | Join por código INEP. |
| 17 | `NO_CURSO` | `course_catalog_records.original_name` | direto | Nome institucional; não usar sozinho para canonizar. |
| 18 | `CO_CURSO` | `course_catalog_records.inep_course_code` | direto | Identidade externa do curso no registro. |
| 19 | `NO_CINE_ROTULO` | `courses.canonical_name` | direto | Nome CINE do curso abstrato. |
| 20 | `CO_CINE_ROTULO` | `courses.cine_code` | direto | Chave canônica preferida; preservar zeros. |
| 21 | `CO_CINE_AREA_GERAL` | `courses.cine_general_area_code` | direto | Texto/código com zeros. |
| 22 | `NO_CINE_AREA_GERAL` | `courses.cine_general_area_name` | direto | Histórico por snapshot. |
| 23 | `CO_CINE_AREA_ESPECIFICA` | `courses.cine_specific_area_code` | direto | Preservar zeros. |
| 24 | `NO_CINE_AREA_ESPECIFICA` | `courses.cine_specific_area_name` | direto | Histórico por snapshot. |
| 25 | `CO_CINE_AREA_DETALHADA` | `courses.cine_detailed_area_code` | direto | Preservar zeros. |
| 26 | `NO_CINE_AREA_DETALHADA` | `courses.cine_detailed_area_name` | direto | Histórico por snapshot. |
| 27 | `TP_GRAU_ACADEMICO` | `course_catalog_records.degree` | enum | Bacharelado/licenciatura/tecnólogo/ABI nunca agregados. |
| 28 | `IN_GRATUITO` | `course_catalog_records.free_indicator` | enum | Gratuidade é independente de rede pública/privada. |
| 29 | `TP_MODALIDADE_ENSINO` | `course_catalog_records.modality` | enum | Presencial/EAD nunca agregados. |
| 30 | `TP_NIVEL_ACADEMICO` | `course_catalog_records.academic_level` | enum | Preservar nível. |
| 31 | `QT_CURSO` | `course_statistics(metric, value, year)` | estatística | Contagem agregada; não criar N ofertas. |
| 32 | `QT_VG_TOTAL` | `course_statistics(metric, value, year)` | estatística | Vagas no ano do Censo; nunca anunciar como vagas abertas atuais. |
| 33 | `QT_VG_TOTAL_DIURNO` | `course_statistics(metric, value, year)` | estatística | Vagas no ano do Censo; nunca anunciar como vagas abertas atuais. |
| 34 | `QT_VG_TOTAL_NOTURNO` | `course_statistics(metric, value, year)` | estatística | Vagas no ano do Censo; nunca anunciar como vagas abertas atuais. |
| 35 | `QT_VG_TOTAL_EAD` | `course_statistics(metric, value, year)` | estatística | Vagas no ano do Censo; nunca anunciar como vagas abertas atuais. |
| 36 | `QT_VG_NOVA` | `course_statistics(metric, value, year)` | estatística | Vagas no ano do Censo; nunca anunciar como vagas abertas atuais. |
| 37 | `QT_VG_PROC_SELETIVO` | `course_statistics(metric, value, year)` | estatística | Vagas no ano do Censo; nunca anunciar como vagas abertas atuais. |
| 38 | `QT_VG_REMANESC` | `course_statistics(metric, value, year)` | estatística | Vagas no ano do Censo; nunca anunciar como vagas abertas atuais. |
| 39 | `QT_VG_PROG_ESPECIAL` | `course_statistics(metric, value, year)` | estatística | Vagas no ano do Censo; nunca anunciar como vagas abertas atuais. |
| 40 | `QT_INSCRITO_TOTAL` | `course_statistics(metric, value, year)` | estatística | Inscritos agregados no ano; não é demanda atual. |
| 41 | `QT_INSCRITO_TOTAL_DIURNO` | `course_statistics(metric, value, year)` | estatística | Inscritos agregados no ano; não é demanda atual. |
| 42 | `QT_INSCRITO_TOTAL_NOTURNO` | `course_statistics(metric, value, year)` | estatística | Inscritos agregados no ano; não é demanda atual. |
| 43 | `QT_INSCRITO_TOTAL_EAD` | `course_statistics(metric, value, year)` | estatística | Inscritos agregados no ano; não é demanda atual. |
| 44 | `QT_INSC_VG_NOVA` | `course_statistics(metric, value, year)` | estatística | Inscritos agregados no ano; não é demanda atual. |
| 45 | `QT_INSC_PROC_SELETIVO` | `course_statistics(metric, value, year)` | estatística | Inscritos agregados no ano; não é demanda atual. |
| 46 | `QT_INSC_VG_REMANESC` | `course_statistics(metric, value, year)` | estatística | Inscritos agregados no ano; não é demanda atual. |
| 47 | `QT_INSC_VG_PROG_ESPECIAL` | `course_statistics(metric, value, year)` | estatística | Inscritos agregados no ano; não é demanda atual. |
| 48 | `QT_ING` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 49 | `QT_ING_FEM` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 50 | `QT_ING_MASC` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 51 | `QT_ING_DIURNO` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 52 | `QT_ING_NOTURNO` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 53 | `QT_ING_VG_NOVA` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 54 | `QT_ING_VESTIBULAR` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 55 | `QT_ING_ENEM` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 56 | `QT_ING_AVALIACAO_SERIADA` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 57 | `QT_ING_SELECAO_SIMPLIFICA` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 58 | `QT_ING_EGR` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 59 | `QT_ING_OUTRO_TIPO_SELECAO` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 60 | `QT_ING_PROC_SELETIVO` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 61 | `QT_ING_VG_REMANESC` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 62 | `QT_ING_VG_PROG_ESPECIAL` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 63 | `QT_ING_OUTRA_FORMA` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 64 | `QT_ING_0_17` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 65 | `QT_ING_18_24` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 66 | `QT_ING_25_29` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 67 | `QT_ING_30_34` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 68 | `QT_ING_35_39` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 69 | `QT_ING_40_49` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 70 | `QT_ING_50_59` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 71 | `QT_ING_60_MAIS` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 72 | `QT_ING_BRANCA` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 73 | `QT_ING_PRETA` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 74 | `QT_ING_PARDA` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 75 | `QT_ING_AMARELA` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 76 | `QT_ING_INDIGENA` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 77 | `QT_ING_CORND` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 78 | `QT_MAT` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 79 | `QT_MAT_FEM` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 80 | `QT_MAT_MASC` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 81 | `QT_MAT_DIURNO` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 82 | `QT_MAT_NOTURNO` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 83 | `QT_MAT_0_17` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 84 | `QT_MAT_18_24` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 85 | `QT_MAT_25_29` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 86 | `QT_MAT_30_34` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 87 | `QT_MAT_35_39` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 88 | `QT_MAT_40_49` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 89 | `QT_MAT_50_59` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 90 | `QT_MAT_60_MAIS` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 91 | `QT_MAT_BRANCA` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 92 | `QT_MAT_PRETA` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 93 | `QT_MAT_PARDA` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 94 | `QT_MAT_AMARELA` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 95 | `QT_MAT_INDIGENA` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 96 | `QT_MAT_CORND` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 97 | `QT_CONC` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 98 | `QT_CONC_FEM` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 99 | `QT_CONC_MASC` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 100 | `QT_CONC_DIURNO` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 101 | `QT_CONC_NOTURNO` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 102 | `QT_CONC_0_17` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 103 | `QT_CONC_18_24` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 104 | `QT_CONC_25_29` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 105 | `QT_CONC_30_34` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 106 | `QT_CONC_35_39` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 107 | `QT_CONC_40_49` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 108 | `QT_CONC_50_59` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 109 | `QT_CONC_60_MAIS` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 110 | `QT_CONC_BRANCA` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 111 | `QT_CONC_PRETA` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 112 | `QT_CONC_PARDA` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 113 | `QT_CONC_AMARELA` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 114 | `QT_CONC_INDIGENA` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 115 | `QT_CONC_CORND` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 116 | `QT_ING_NACBRAS` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 117 | `QT_ING_NACESTRANG` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 118 | `QT_MAT_NACBRAS` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 119 | `QT_MAT_NACESTRANG` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 120 | `QT_CONC_NACBRAS` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 121 | `QT_CONC_NACESTRANG` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 122 | `QT_ALUNO_DEFICIENTE` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 123 | `QT_ING_DEFICIENTE` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 124 | `QT_MAT_DEFICIENTE` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 125 | `QT_CONC_DEFICIENTE` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 126 | `QT_ING_FINANC` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 127 | `QT_ING_FINANC_REEMB` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 128 | `QT_ING_FIES` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 129 | `QT_ING_RPFIES` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 130 | `QT_ING_FINANC_REEMB_OUTROS` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 131 | `QT_ING_FINANC_NREEMB` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 132 | `QT_ING_PROUNII` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 133 | `QT_ING_PROUNIP` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 134 | `QT_ING_NRPFIES` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 135 | `QT_ING_FINANC_NREEMB_OUTROS` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 136 | `QT_MAT_FINANC` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 137 | `QT_MAT_FINANC_REEMB` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 138 | `QT_MAT_FIES` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 139 | `QT_MAT_RPFIES` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 140 | `QT_MAT_FINANC_REEMB_OUTROS` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 141 | `QT_MAT_FINANC_NREEMB` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 142 | `QT_MAT_PROUNII` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 143 | `QT_MAT_PROUNIP` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 144 | `QT_MAT_NRPFIES` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 145 | `QT_MAT_FINANC_NREEMB_OUTROS` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 146 | `QT_CONC_FINANC` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 147 | `QT_CONC_FINANC_REEMB` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 148 | `QT_CONC_FIES` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 149 | `QT_CONC_RPFIES` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 150 | `QT_CONC_FINANC_REEMB_OUTROS` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 151 | `QT_CONC_FINANC_NREEMB` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 152 | `QT_CONC_PROUNII` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 153 | `QT_CONC_PROUNIP` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 154 | `QT_CONC_NRPFIES` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 155 | `QT_CONC_FINANC_NREEMB_OUTROS` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 156 | `QT_ING_RESERVA_VAGA` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 157 | `QT_ING_RVREDEPUBLICA` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 158 | `QT_ING_RVPPI` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 159 | `QT_ING_RVQUILO` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 160 | `QT_ING_RVREFU` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 161 | `QT_ING_RVPOVT` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 162 | `QT_ING_RVPDEF` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 163 | `QT_ING_RVSOCIAL_RF` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 164 | `QT_ING_RVIDOSO` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 165 | `QT_ING_RVINTERN` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 166 | `QT_ING_RVMEDAL` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 167 | `QT_ING_RVTRANS` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 168 | `QT_ING_RVOUTROS` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 169 | `QT_MAT_RESERVA_VAGA` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 170 | `QT_MAT_RVREDEPUBLICA` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 171 | `QT_MAT_RVPPI` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 172 | `QT_MAT_RVQUILO` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 173 | `QT_MAT_RVREFU` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 174 | `QT_MAT_RVPOVT` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 175 | `QT_MAT_RVPDEF` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 176 | `QT_MAT_RVSOCIAL_RF` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 177 | `QT_MAT_RVIDOSO` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 178 | `QT_MAT_RVINTERN` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 179 | `QT_MAT_RVMEDAL` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 180 | `QT_MAT_RVTRANS` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 181 | `QT_MAT_RVOUTROS` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 182 | `QT_CONC_RESERVA_VAGA` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 183 | `QT_CONC_RVREDEPUBLICA` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 184 | `QT_CONC_RVPPI` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 185 | `QT_CONC_RVQUILO` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 186 | `QT_CONC_RVREFU` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 187 | `QT_CONC_RVPOVT` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 188 | `QT_CONC_RVPDEF` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 189 | `QT_CONC_RVSOCIAL_RF` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 190 | `QT_CONC_RVIDOSO` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 191 | `QT_CONC_RVINTERN` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 192 | `QT_CONC_RVMEDAL` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 193 | `QT_CONC_RVTRANS` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 194 | `QT_CONC_RVOUTROS` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 195 | `QT_SIT_TRANCADA` | `course_statistics(metric, value, year)` | estatística | Situação agregada de vínculos; não é situação regulatória do curso. |
| 196 | `QT_SIT_DESVINCULADO` | `course_statistics(metric, value, year)` | estatística | Situação agregada de vínculos; não é situação regulatória do curso. |
| 197 | `QT_SIT_TRANSFERIDO` | `course_statistics(metric, value, year)` | estatística | Situação agregada de vínculos; não é situação regulatória do curso. |
| 198 | `QT_SIT_FALECIDO` | `course_statistics(metric, value, year)` | estatística | Situação agregada de vínculos; não é situação regulatória do curso. |
| 199 | `QT_ING_PROCESCPUBLICA` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 200 | `QT_ING_PROCESCPRIVADA` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 201 | `QT_ING_PROCNAOINFORMADA` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 202 | `QT_MAT_PROCESCPUBLICA` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 203 | `QT_MAT_PROCESCPRIVADA` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 204 | `QT_MAT_PROCNAOINFORMADA` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 205 | `QT_CONC_PROCESCPUBLICA` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 206 | `QT_CONC_PROCESCPRIVADA` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 207 | `QT_CONC_PROCNAOINFORMADA` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 208 | `QT_PARFOR` | `course_statistics(metric, value, year)` | estatística | Métrica agregada do registro de curso; preservar ano, dimensão e fonte. |
| 209 | `QT_ING_PARFOR` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 210 | `QT_MAT_PARFOR` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 211 | `QT_CONC_PARFOR` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 212 | `QT_APOIO_SOCIAL` | `course_statistics(metric, value, year)` | estatística | Métrica agregada do registro de curso; preservar ano, dimensão e fonte. |
| 213 | `QT_ING_APOIO_SOCIAL` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 214 | `QT_MAT_APOIO_SOCIAL` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 215 | `QT_CONC_APOIO_SOCIAL` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 216 | `QT_ATIV_EXTRACURRICULAR` | `course_statistics(metric, value, year)` | estatística | Métrica agregada do registro de curso; preservar ano, dimensão e fonte. |
| 217 | `QT_ING_ATIV_EXTRACURRICULAR` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 218 | `QT_MAT_ATIV_EXTRACURRICULAR` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 219 | `QT_CONC_ATIV_EXTRACURRICULAR` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |
| 220 | `QT_MOB_ACADEMICA` | `course_statistics(metric, value, year)` | estatística | Métrica agregada do registro de curso; preservar ano, dimensão e fonte. |
| 221 | `QT_ING_MOB_ACADEMICA` | `course_statistics(metric, value, year)` | estatística | Ingressantes agregados; manter recortes separados. |
| 222 | `QT_MAT_MOB_ACADEMICA` | `course_statistics(metric, value, year)` | estatística | Matrículas agregadas; manter recortes separados. |
| 223 | `QT_CONC_MOB_ACADEMICA` | `course_statistics(metric, value, year)` | estatística | Concluintes agregados; manter recortes separados. |

## Campos exigidos pelo produto que não existem nesses CSVs

| Campo desejado | Resultado da importação |
|---|---|
| código/nome/endereço de campus | `nao_confirmado`; não derivar da sede |
| código/nome/endereço de polo | `nao_confirmado` |
| latitude/longitude de campus ou polo | `nao_confirmado` |
| turno de uma oferta individual | `nao_confirmado`; totais diurno/noturno são estatísticas |
| status regulatório ativo/inativo | `nao_confirmado` |
| mensalidade regular/promocional | `nao_confirmado` |
| nota de corte por edição/modalidade | `nao_confirmado` |
| vagas atualmente abertas | `nao_confirmado`; `QT_VG_*` é histórico do Censo |
| telefone, e-mail e site | `nao_confirmado` |
| fonte de verificação manual | inexistente até uma `verification` ser criada |

## Validação do importador derivada deste mapa

- falhar fechado se os cabeçalhos não coincidirem com esta versão;
- tratar códigos CINE, CEP e códigos com zeros à esquerda como identificadores textuais;
- tratar `(.)` e vazio conforme o dicionário, sem convertê-los em zero;
- manter dimensões de grau, modalidade, rede, gratuidade e recortes de reserva separadas;
- rejeitar qualquer tentativa de projetar `QT_*` em `course_offerings`, `tuitions`, `admission_offers` ou `cutoff_scores`;
- registrar divergência quando os atributos redundantes de IES no arquivo de cursos não coincidirem com o cadastro de IES do mesmo snapshot.
