import { ZodError } from 'zod';
import { AppError } from '../errors/AppError.js';

export function notFoundHandler(req, _res, next) {
  next(new AppError('ROTA_NAO_ENCONTRADA', 'Esta rota não existe.', {
    status: 404,
    hint: 'Consulte a documentação em /api/docs para ver as rotas disponíveis.'
  }));
}

export function errorHandler(error, req, res, _next) {
  if (error instanceof ZodError) {
    const fields = Object.fromEntries(error.issues.map((issue) => [issue.path.join('.'), issue.message]));
    return res.status(422).json({
      error: {
        code: 'DADOS_INVALIDOS',
        message: 'Alguns campos precisam ser corrigidos.',
        hint: 'Revise os campos indicados e envie novamente.',
        fields
      }
    });
  }

  if (error?.type === 'entity.too.large') {
    return res.status(413).json({ error: { code:'CORPO_MUITO_GRANDE', message:'O conteúdo enviado excede o limite permitido.', hint:'Reduza o tamanho e tente novamente.' } });
  }

  if (error instanceof SyntaxError && error?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code:'JSON_INVALIDO', message:'O corpo JSON está malformado.', hint:'Confira vírgulas, aspas e chaves antes de reenviar.' } });
  }

  const known = error instanceof AppError;
  const status = known ? error.status : 500;
  if (!known) console.error(JSON.stringify({ level: 'error', requestId: req.id, message: error.message, stack: error.stack }));
  return res.status(status).json({
    error: {
      code: known ? error.code : 'ERRO_INTERNO',
      message: known ? error.message : 'Não foi possível concluir esta solicitação.',
      hint: known ? error.hint : 'Tente novamente em alguns instantes.',
      ...(known && error.fields ? { fields: error.fields } : {})
    }
  });
}
