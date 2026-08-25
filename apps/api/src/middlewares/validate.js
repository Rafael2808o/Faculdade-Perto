export function validate(schema, target = 'query') {
  return (req, _res, next) => {
    req.validated = { ...(req.validated || {}), [target]: schema.parse(req[target]) };
    next();
  };
}
