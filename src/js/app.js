async function mostrarVersao() {
  const resposta = await fetch('version.json', { cache: 'no-store' });
  if (!resposta.ok) return;
  const { version, commit } = await resposta.json();
  document.querySelector('#versao').textContent = `v${version} · ${commit.slice(0, 7)}`;
}

mostrarVersao().catch(() => {});
