/*
 * Valida as trilhas do devocional antes do build: toda referência citada em
 * lib/devotional-trails.ts precisa existir em lib/daily-devotional.ts, senão a
 * trilha mostraria um dia em branco para o membro. Roda no `prebuild`.
 */
const fs = require('fs');
const path = require('path');

const LIB = path.join(__dirname, '..', 'lib');

function devocionais() {
  const src = fs.readFileSync(path.join(LIB, 'daily-devotional.ts'), 'utf8');
  const from = src.indexOf('= [', src.indexOf('DAILY_DEVOTIONALS')) + 2;
  const end = src.indexOf('\n];', from);
  return JSON.parse(src.slice(from, end + 2));
}

function trilhas() {
  const src = fs.readFileSync(path.join(LIB, 'devotional-trails.ts'), 'utf8');
  return [
    ...src.matchAll(/id: '([^']+)',\s*\n\s*title: '([^']+)',[\s\S]*?refs: \[([\s\S]*?)\]/g),
  ].map((m) => ({
    id: m[1],
    title: m[2],
    refs: [...m[3].matchAll(/'([^']+)'/g)].map((x) => x[1]),
  }));
}

const TAMANHO = 7;
const lib = devocionais();
const refs = new Set(lib.map((d) => d.ref));
const lista = trilhas();
const erros = [];

if (!lista.length) erros.push('Nenhuma trilha encontrada.');

for (const t of lista) {
  if (t.refs.length !== TAMANHO) {
    erros.push(`Trilha "${t.title}" tem ${t.refs.length} dias (esperado ${TAMANHO}).`);
  }
  for (const ref of t.refs) {
    if (!refs.has(ref)) {
      erros.push(`Trilha "${t.title}": referência inexistente na biblioteca — "${ref}".`);
    }
  }
}

// Pensamento é o que a tela mostra em destaque: não pode faltar.
const semPensamento = lib.filter((d) => !d.thought || !d.thought.trim());
if (semPensamento.length) {
  erros.push(`${semPensamento.length} devocional(is) sem "thought".`);
}

if (erros.length) {
  console.error('Trilhas inválidas:');
  erros.forEach((e) => console.error('  - ' + e));
  process.exit(1);
}

console.log(
  `Trilhas OK: ${lista.length} trilhas x ${TAMANHO} dias | biblioteca: ${lib.length} devocionais.`,
);
