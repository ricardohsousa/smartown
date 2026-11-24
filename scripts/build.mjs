import { cp, mkdir, rm, stat, writeFile, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

const SRC = 'src';
const DIST = 'dist';
const OBRIGATORIOS = ['index.html', 'css/style.css', 'js/app.js'];

function commitAtual() {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA;
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return 'local';
  }
}

const faltando = [];
for (const arquivo of OBRIGATORIOS) {
  try {
    await stat(`${SRC}/${arquivo}`);
  } catch {
    faltando.push(arquivo);
  }
}
if (faltando.length) {
  console.error(`Build falhou: arquivos obrigatórios ausentes em ${SRC}/: ${faltando.join(', ')}`);
  process.exit(1);
}

const { version } = JSON.parse(await readFile('package.json', 'utf8'));
const info = {
  version,
  commit: commitAtual(),
  builtAt: new Date().toISOString(),
  run: process.env.GITHUB_RUN_ID ?? null,
};

await rm(DIST, { recursive: true, force: true });
await mkdir(DIST, { recursive: true });
await cp(SRC, DIST, { recursive: true });
await writeFile(`${DIST}/version.json`, `${JSON.stringify(info, null, 2)}\n`);

console.log(`Build concluído: ${DIST}/ (v${info.version}, commit ${info.commit.slice(0, 7)})`);
