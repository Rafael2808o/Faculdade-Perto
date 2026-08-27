export const openapi = {
  openapi:'3.1.0',
  info:{title:'Faculdade Perto API',version:'1.0.0',description:'API pública com proveniência explícita. Dados do Censo nascem como importados; ausências são não confirmadas.'},
  servers:[{url:'/api/v1'}],
  tags:[{name:'Busca'},{name:'Instituições'},{name:'Cursos'},{name:'Geografia'},{name:'Ingresso'},{name:'Participação'},{name:'Conta'},{name:'Administração'}],
  components:{
    securitySchemes:{bearerAuth:{type:'http',scheme:'bearer',bearerFormat:'opaque'}},
    schemas:{
      DataField:{type:'object',required:['value','status','source','sourceUrl','updatedAt'],properties:{value:{},status:{type:'string',enum:['confirmado','importado','nao_confirmado']},source:{type:['string','null']},sourceUrl:{type:['string','null'],format:'uri'},updatedAt:{type:['string','null'],format:'date-time'},reason:{type:'string'}}},
      Error:{type:'object',properties:{error:{type:'object',required:['code','message'],properties:{code:{type:'string'},message:{type:'string'},hint:{type:'string'},fields:{type:'object',additionalProperties:{type:'string'}}}}}},
      EnemRequest:{type:'object',required:['scores'],properties:{scores:{type:'object',required:['languages','humanities','naturalSciences','mathematics','essay'],additionalProperties:{type:'number',minimum:0,maximum:1000}},weights:{type:'object',additionalProperties:{type:'number',exclusiveMinimum:0}},trainee:{type:'boolean'}}}
    },
    responses:{Invalid:{description:'Entrada inválida',content:{'application/json':{schema:{$ref:'#/components/schemas/Error'}}}}}
  },
  paths:{
    '/search':{get:{tags:['Busca'],summary:'Busca cursos e instituições sem transformar agregados em ofertas',parameters:[['q','string'],['city','string'],['state','string'],['network','string'],['modality','string'],['degree','string'],['organization','string'],['category','string'],['free','string'],['shift','string'],['dimension','string'],['minSeats','integer'],['sort','string'],['page','integer'],['limit','integer']].map(([name,type])=>({name,in:'query',schema:{type}})),responses:{200:{description:'Resultados paginados'}}}},
    '/institutions':{get:{tags:['Instituições'],summary:'Lista instituições',responses:{200:{description:'Instituições paginadas'}}}},
    '/institutions/{id}':{get:{tags:['Instituições'],summary:'Detalha instituição',parameters:[{name:'id',in:'path',required:true,schema:{type:'string'}}],responses:{200:{description:'Instituição e registros de curso'},404:{description:'Não encontrada'}}}},
    '/courses':{get:{tags:['Cursos'],summary:'Lista cursos canônicos CINE',responses:{200:{description:'Cursos'}}}},
    '/campuses':{get:{tags:['Geografia'],summary:'Lista somente campi sustentados por fonte complementar',responses:{200:{description:'Campi ou aviso de indisponibilidade'}}}},
    '/offerings':{get:{tags:['Cursos'],summary:'Lista somente ofertas individualizadas por fonte complementar',responses:{200:{description:'Ofertas ou aviso de indisponibilidade'}}}},
    '/offerings/{id}':{get:{tags:['Cursos'],summary:'Detalha oferta ou representação agregada',parameters:[{name:'id',in:'path',required:true,schema:{type:'string'}}],responses:{200:{description:'Detalhe'}}}},
    '/catalog-records/{id}':{get:{tags:['Cursos'],summary:'Detalha um registro agregado do Censo',parameters:[{name:'id',in:'path',required:true,schema:{type:'string'}}],responses:{200:{description:'Registro com proveniência'},404:{description:'Não encontrado'}}}},
    '/campuses/nearby':{get:{tags:['Geografia'],summary:'Busca campi com coordenadas verificáveis',parameters:['lat','lng','radiusKm'].map((name)=>({name,in:'query',required:true,schema:{type:'number'}})),responses:{200:{description:'Campi e distâncias geodésicas'}}}},
    '/cutoffs':{get:{tags:['Ingresso'],summary:'Notas separadas por modalidade de concorrência',responses:{200:{description:'Notas sem agregação'}}}},
    '/enem/score':{post:{tags:['Ingresso'],summary:'Calcula média simples ou ponderada',requestBody:{required:true,content:{'application/json':{schema:{$ref:'#/components/schemas/EnemRequest'},example:{scores:{languages:650,humanities:620,naturalSciences:700,mathematics:760,essay:800},trainee:false}}}},responses:{200:{description:'Resultado com aviso obrigatório'},422:{$ref:'#/components/responses/Invalid'}}}},
    '/contact':{post:{tags:['Participação'],summary:'Envia contato',responses:{201:{description:'Recebido'},422:{$ref:'#/components/responses/Invalid'},429:{description:'Rate limit'}}}},
    '/corrections':{post:{tags:['Participação'],summary:'Envia correção para moderação',responses:{201:{description:'Recebida'},422:{$ref:'#/components/responses/Invalid'}}}},
    '/auth/register':{post:{tags:['Conta'],summary:'Cria conta e inicia sessão',responses:{201:{description:'Conta criada'},409:{description:'E-mail em uso'},422:{$ref:'#/components/responses/Invalid'}}}},
    '/auth/login':{post:{tags:['Conta'],summary:'Inicia sessão',responses:{200:{description:'Sessão criada'},401:{description:'Credenciais inválidas'}}}},
    '/auth/session':{delete:{tags:['Conta'],summary:'Encerra e revoga a sessão atual',security:[{bearerAuth:[]}],responses:{204:{description:'Sessão encerrada'}}}},
    '/me':{get:{tags:['Conta'],summary:'Obtém a pessoa autenticada',security:[{bearerAuth:[]}],responses:{200:{description:'Perfil'},401:{description:'Autenticação necessária'}}}},
    '/me/plan':{get:{tags:['Conta'],summary:'Lista itens do Meu Plano',security:[{bearerAuth:[]}],responses:{200:{description:'Itens salvos'}}},post:{tags:['Conta'],summary:'Salva um registro no Meu Plano',security:[{bearerAuth:[]}],responses:{201:{description:'Item salvo'}}}},
    '/me/plan/{id}':{delete:{tags:['Conta'],summary:'Remove um item do Meu Plano',security:[{bearerAuth:[]}],parameters:[{name:'id',in:'path',required:true,schema:{type:'string',pattern:'^[1-9][0-9]{0,19}$'}}],responses:{204:{description:'Removido'},404:{description:'Item não encontrado'}}}},
    '/admin/corrections':{get:{tags:['Administração'],summary:'Lista fila de correções',security:[{bearerAuth:[]}],responses:{200:{description:'Fila'},403:{description:'Acesso negado'}}}},
    '/admin/corrections/{id}':{patch:{tags:['Administração'],summary:'Modera uma correção e registra auditoria',security:[{bearerAuth:[]}],parameters:[{name:'id',in:'path',required:true,schema:{type:'integer'}}],responses:{200:{description:'Correção atualizada'},403:{description:'Acesso negado'}}}},
    '/sitemap-data':{get:{tags:['Busca'],summary:'Resumo das entidades publicáveis para sitemap',responses:{200:{description:'Slugs institucionais, municípios e total de registros'}}}}
  }
};
