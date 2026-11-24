import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';

describe('Processo de Build (scripts/build.mjs)', () => {
  it('deve gerar a pasta dist com os arquivos obrigatórios e version.json válido', async () => {
    execFileSync('node', ['scripts/build.mjs']);

    const pkg = JSON.parse(await readFile('package.json', 'utf8'));
    const versionFile = JSON.parse(await readFile('dist/version.json', 'utf8'));

    await assert.doesNotReject(() => stat('dist/index.html'));
    await assert.doesNotReject(() => stat('dist/css/style.css'));
    await assert.doesNotReject(() => stat('dist/js/app.js'));

    assert.equal(versionFile.version, pkg.version);
    assert.equal(typeof versionFile.commit, 'string');
    assert.ok(versionFile.builtAt.length > 0);
  });
});