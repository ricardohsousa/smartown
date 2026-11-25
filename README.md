# SmarTown

Aplicação web para **registrar e acompanhar problemas urbanos**, como iluminação pública, buracos na via e descarte irregular. O projeto também implementa um pipeline de **integração e entrega contínuas** que leva cada alteração do commit até a produção de forma automatizada, testada e rastreável.

> Projeto prático **Operação Deploy**, da disciplina Gerência de Configuração e Manutenção de Software (UTFPR), com a Profa. Dra. Eduarda Maganha de Almeida.

| Ambiente | Endereço | Atualização |
|---|---|---|
| **Produção** | https://smartown.tech | Tag `vX.Y.Z` + aprovação manual |
| **Homologação (staging)** | https://staging.smartown.tech | Automática a cada merge na `main` |
| **Pipeline** | [GitHub Actions](https://github.com/ricardohsousa/smartown/actions) | PRs, pushes na `main` e tags |

## 1. Problema e objetivo

Problemas urbanos costumam ser relatados de forma dispersa, sem registro organizado e sem acompanhamento. Por isso, fica difícil saber o que já foi reportado, o que é urgente e o que já foi resolvido.

O SmarTown centraliza esses registros. O cidadão cadastra a ocorrência com categoria, bairro e urgência, consulta a lista com filtros, marca o que foi resolvido e acompanha um resumo dos chamados.

## 2. Funcionalidades

| Funcionalidade | Como funciona |
|---|---|
| Cadastro de ocorrências | Categoria, descrição, bairro e urgência, com mensagem de erro em cada campo |
| Listagem com filtros | Da mais recente para a mais antiga, com filtro por status e por categoria |
| Atualização da situação | Cada ocorrência pode ser marcada como **Resolvida** ou reaberta (**Aberta**) |
| Resumo quantitativo | Abertas, resolvidas e total, além da contagem por categoria |
| Versão publicada | O rodapé mostra a versão e o commit no ar |

### Validação dos dados

| Campo | Regra |
|---|---|
| Categoria | Iluminação Pública, Buracos, Descarte Irregular ou Outros |
| Descrição | De 10 a 500 caracteres |
| Bairro | De 2 a 60 caracteres, com pelo menos uma letra |
| Urgência | Baixa, Média ou Alta |

Espaços no início, no fim ou repetidos não contam. Uma ocorrência inválida não é salva.

Os dados ficam no `localStorage` do navegador. Não há login nem banco de dados remoto.

## 3. Integrantes

| Integrante | Responsabilidade principal |
|---|---|
| Gabriel de Souza Xavier | _a definir_ |
| Gustavo Gomes Pereira dos Santos | _a definir_ |
| Helder de Lima Dantas Neto | _a definir_ |
| Higor Silva Fernandes | _a definir_ |
| Ricardo Henrique Almeida da Silva Sousa | _a definir_ |

## 4. Tecnologias

| Tecnologia | Uso no projeto |
|---|---|
| HTML, CSS e JavaScript (módulos ES) | Aplicação, sem framework e sem compilação |
| `localStorage` | Armazenamento das ocorrências no navegador |
| Onest (licença OFL) | Fonte da interface, hospedada no próprio projeto |
| Node.js 24 (`.nvmrc`) | Lint, testes e script de build |
| `node:test` | Testes automatizados, com o executor nativo do Node |
| ESLint | Análise estática do código |
| npm + `package-lock.json` | Dependências com versões exatas |
| Docker + nginx (unprivileged) | Imagem de entrega da aplicação |
| GitHub Actions | Pipeline de CI/CD |
| GitHub Container Registry | Armazenamento das imagens, uma por commit |
| VPS Oracle Cloud (ARM64) + Docker Compose | Ambientes de staging e produção |
| Cloudflare Tunnel | Publicação dos ambientes sem portas HTTP abertas na VPS |

## 5. Como executar

Requisitos: Node.js 24 e npm.

```bash
npm ci
npm start
```

O `npm start` gera o build e serve a pasta `dist/` localmente.

| Comando | O que faz |
|---|---|
| `npm run lint` | Análise estática |
| `npm test` | Testes automatizados |
| `npm run build` | Gera `dist/` e `dist/version.json` |
| `npm run verify` | Lint + testes + build: o mesmo que o CI executa |

Com Docker, usando a mesma imagem que vai para os ambientes:

```bash
npm run build
docker build -t smartown:local .
docker run --rm -p 8080:80 smartown:local
```

## 6. Estrutura do repositório

```
smartown/
├── src/                      código da aplicação
│   ├── index.html            página única
│   ├── css/style.css         estilos
│   ├── js/ocorrencias.js     regras de negócio, sem acesso à tela
│   ├── js/storage.js         leitura e gravação no localStorage
│   ├── js/app.js             interface
│   ├── img/                  logo, favicon e marca da UTFPR
│   └── fonts/                fonte Onest e sua licença
├── tests/                    testes automatizados (*.test.js)
├── scripts/build.mjs         script de construção
├── Dockerfile                imagem de entrega (nginx + dist/)
├── deploy/
│   ├── compose.app.yml       definição de um ambiente (staging ou produção)
│   ├── compose.edge.yml      conector do Cloudflare Tunnel
│   └── nginx.conf            configuração do servidor web
├── .github/
│   ├── workflows/            pipeline (ci, deploy-staging, deploy-production)
│   ├── pull_request_template.md
│   └── ISSUE_TEMPLATE/
├── docs/evidencias/          capturas usadas no relatório técnico
├── CONTRIBUTING.md           fluxo de branches, commits e PRs
└── package.json / package-lock.json
```

## 7. Pipeline

O pipeline é dividido em três workflows:

| Workflow | Gatilho | Etapas |
|---|---|---|
| [`ci.yml`](.github/workflows/ci.yml) | Pull request para a `main`, e chamado pelos dois deploys | **Build & Test**: `npm ci`, lint, testes, build e `npm audit` |
| [`deploy-staging.yml`](.github/workflows/deploy-staging.yml) | Push na `main` | CI → **Imagem Docker** → **Deploy staging** |
| [`deploy-production.yml`](.github/workflows/deploy-production.yml) | Tag `vX.Y.Z` | CI → **Conferir release** → ⏸ aprovação → **Deploy production** → **GitHub Release** |

```
PR para main  ─▶ CI
push na main  ─▶ CI ─▶ Imagem Docker ─▶ Deploy staging
tag vX.Y.Z    ─▶ CI ─▶ Conferir release ─▶ ⏸ aprovação ─▶ Deploy production ─▶ GitHub Release
```

### Etapas

- **Build & Test**: instala as dependências exatas do lock, roda o lint e os testes (com relatório JUnit), gera o build com `version.json` (versão, commit e run) e audita as dependências.
- **Imagem Docker**: constrói a imagem ARM64 com o build aprovado, testa o container (healthcheck e `version.json`) e publica no GHCR com a tag do commit.
- **Deploy staging / production**: por SSH, envia os arquivos de compose para a VPS, baixa a imagem **pelo digest**, sobe o container com `docker compose up --wait` (espera o healthcheck) e confere na URL pública se o commit no ar é o esperado.
- **Conferir release**: exige que a tag seja igual à versão do `package.json` e que o commit da tag seja **o mesmo que está em staging**.
- **GitHub Release**: publica a release da tag com o build compactado (`.zip`).

### Falhas

- Se o **CI** falhar, os jobs seguintes não executam e nada é publicado. Em PRs, o merge fica bloqueado.
- Se o **deploy** falhar, um step de **rollback** restaura a imagem que estava no ar antes.

### Entrega contínua vs. implantação contínua

Toda alteração mesclada na `main` é publicada automaticamente em staging, então o software está sempre pronto para entrega. A publicação em produção depende de uma tag e da **aprovação de um revisor** no environment `production`, e isso caracteriza **Continuous Delivery**. Sem essa aprovação, o fluxo seria **Continuous Deployment**.

## 8. Testes

```bash
npm test
```

Os testes ficam em `tests/` e usam o executor nativo do Node.

| Arquivo | O que verifica |
|---|---|
| `tests/build.test.js` | O build gera os arquivos obrigatórios e um `version.json` com a versão do `package.json` |

As regras ficam em `src/js/ocorrencias.js`, separadas da interface, para serem testadas sem navegador. No CI, o resultado é salvo em `test-results.xml` e publicado como artefato do run.

## 9. Entrega e publicação

- **Artefato:** a imagem `ghcr.io/ricardohsousa/smartown:<commit>`. Ela é construída uma única vez, no deploy de staging, e a produção recebe **a mesma imagem** pelo digest, sem rebuild.
- **Baseline de release:** cada tag `vX.Y.Z` marca uma versão aprovada e gera uma GitHub Release.
- **Rastreabilidade:** `/version.json` em cada ambiente informa a versão, o commit e o run do build. Na VPS, `~/smartown/deploys.log` registra data, ambiente, commit e imagem de cada deploy.
- **Infraestrutura:** cada ambiente é um projeto Docker Compose isolado (`smartown-staging` e `smartown-production`) criado a partir do mesmo `deploy/compose.app.yml`. O conector `cloudflared` publica os dois pelo túnel, e a VPS não expõe as portas 80 e 443.

### Publicar uma versão

O push de uma tag `vX.Y.Z` dispara o workflow **Deploy production**. O `git push` comum não envia tags, então a tag precisa ser enviada pelo nome.

1. Abra um PR atualizando o campo `version` do `package.json` (por exemplo, `0.1.0` → `0.2.0`) e faça o merge.
2. Aguarde o **Deploy staging** terminar e confira https://staging.smartown.tech.
3. Confira se o commit local é o mesmo que está em staging:
   ```bash
   git switch main && git pull
   git rev-parse HEAD
   curl -s https://staging.smartown.tech/version.json
   ```
4. Crie a tag anotada e envie:
   ```bash
   git tag -a v0.2.0 -m "SmarTown v0.2.0"
   git push origin v0.2.0
   ```
5. Em **Actions → Deploy production**, o run para em *Waiting*. Clique em **Review deployments**, marque **production** e depois em **Approve and deploy**.
6. Confira https://smartown.tech e a release em **Releases**, com o `.zip` do build.

O job **Conferir release** só deixa seguir se:
- o nome da tag for igual a `v` + a versão do `package.json`;
- o commit da tag for o mesmo que está rodando em staging.

Comandos úteis:

```bash
git tag                         # tags locais
git show v0.2.0                 # tag e commit para onde ela aponta
git ls-remote --tags origin     # tags publicadas no GitHub
git tag -d v0.2.0               # apaga uma tag local criada por engano (antes do push)
```

Uma tag já publicada é uma baseline de release e não deve ser alterada nem reaproveitada. Se a versão tiver um problema, corrija pelo fluxo normal e publique uma nova versão (por exemplo, `v0.2.1`).

## 10. Fluxo de trabalho

GitHub Flow com tags de release: a `main` é protegida e todo trabalho entra por pull request, com o CI verde e uma aprovação. Os detalhes estão em [CONTRIBUTING.md](CONTRIBUTING.md).

## 11. Limitações conhecidas

- Os dados ficam no `localStorage`: são locais a cada navegador e se perdem se o navegador for limpo.
- Não há autenticação nem moderação das ocorrências.
- As ocorrências não podem ser editadas nem excluídas.
- Staging e produção rodam na mesma VPS: isolados por container, mas sem redundância de hardware.
- A interface não tem testes automatizados. Nos ambientes publicados, verifica-se apenas se o `version.json` responde com o commit esperado.
- O monitoramento se limita à verificação feita logo após o deploy.
