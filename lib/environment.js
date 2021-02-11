
const drawToConsole = (string) => {
  if (process.env.HIDE_ENV !== 'true') {
   console.log(string);
 }
}

const parseVariable = (value, type = string) => {
  switch(type) {
    case 'string':
      return value;
    case 'number':
      return parseFloat(value);
    case 'boolean':
      const isBoolean = ['true', 'false'].includes(value.toLowerCase());
      if (!isBoolean) return false;
      return value.toLowerCase() === 'true';
  }
}

const loadVariable = (name, type = 'string', secret = false) => {
  const value = parseVariable(process.env[name], type);

  if (!value) {
    drawToConsole(`  ${name}: !! ERROR !! - Required Variable Not Set!`);
    process.exit(400);
  }


  drawToConsole(`  ${name}: ${ secret ? '********' : value }`);
  return value;
}

const loadOptionalVariable = (name, defaultValue = '', type = 'string', secret = false) => {
  if (!process.env[name]) {
    drawToConsole(`  ${name}: [Default] ${ secret ? '********' : defaultValue }`);
    return defaultValue;
  }

  return loadVariable(name, type, secret);
}

const globalVariables = () => {
  drawToConsole('=== Global Variables ===');
  const variables = {
    PORT: loadVariable('PORT', 'number'),
    LOG_LEVEL: loadOptionalVariable('LOG_LEVEL', 'debug'),
    DATA_DIR: loadOptionalVariable('DATA_DIR', `${process.cwd()}/data`),
    REPORT_DIR: loadOptionalVariable('REPORT_DIR', `${process.cwd()}/reports`),
    JSON_REPORT_DIR: loadOptionalVariable('JSON_REPORT_DIR', `${process.cwd()}/reports/json`),
  }
  
  drawToConsole('');
  return variables;
}

module.exports = () => ({ ...globalVariables() })
