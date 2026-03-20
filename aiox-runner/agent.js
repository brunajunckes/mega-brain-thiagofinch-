const readline = require('readline-sync');

console.log('AIOX Agent Terminal');
console.log('Agents disponíveis: dev, qa, architect, pm\n');

while (true) {
  const input = readline.question('agent> ');

  if (input === 'exit') {
    console.log('Encerrando agente...');
    process.exit();
  }

  console.log(`Executando agente para: ${input}`);
}
