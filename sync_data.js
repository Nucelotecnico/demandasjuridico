const fs = require('fs');
const jsonContent = fs.readFileSync('demandas_completo.json', 'utf8');
fs.writeFileSync('initialData.js', 'const INITIAL_DEMANDAS = ' + jsonContent + ';\n');
console.log('initialData.js atualizado com sucesso com todos os 744 registros.');
