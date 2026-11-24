# Como contribuir com o SmarTown

## Modelo de branches: GitHub Flow com tags de release

```
feature/cadastro-ocorrencia ──┐  PR (CI verde + 1 aprovação)
fix/validacao-bairro ─────────┤
                              ▼
main ──●──────●──────●──────●──────●──▶   cada merge vai para staging.smartown.tech
              │                    │
           v0.1.0               v1.0.0      tag = baseline de release -> aprovação -> smartown.tech
```

| Branch | Uso | Exemplo |
|---|---|---|
| `main` | Protegida e sempre implantável. Só recebe alterações via PR. | — |
| `feature/*` | Nova funcionalidade | `feature/resumo-quantitativo` |
| `fix/*` | Correção de defeito | `fix/filtro-status` |
| `test/*` | Testes automatizados | `test/validacao-bairro` |
| `ci/*` | Pipeline e infraestrutura | `ci/deploy-staging` |
| `docs/*` | Documentação | `docs/readme-pipeline` |

Regras:
- Branches **curtas**: abra o PR assim que a alteração estiver pronta, de preferência no mesmo dia.
- O merge é feito por **merge commit**, para que o histórico mostre de qual branch veio cada alteração.
- Nunca faça `push --force` na `main`. A regra de proteção bloqueia isso.
- **Tags** `vX.Y.Z` (SemVer) são criadas apenas por administradores e não podem ser alteradas nem removidas.

## Passo a passo

```bash
git switch main && git pull
git switch -c feature/minha-funcionalidade
# ... alterações ...
npm run verify                # lint + testes + build, o mesmo que o CI
git add -A && git commit -m "feat: descreve a alteração"
git push -u origin feature/minha-funcionalidade
gh pr create --fill           # ou abra o PR pelo site
```

## Mensagens de commit (Conventional Commits)

| Prefixo | Quando usar |
|---|---|
| `feat:` | Nova funcionalidade |
| `fix:` | Correção de defeito |
| `test:` | Testes |
| `ci:` | Pipeline, Docker, deploy |
| `docs:` | Documentação |
| `refactor:` | Mudança interna sem alterar comportamento |
| `chore:` | Manutenção (dependências, configuração) |

Exemplo: `feat: adiciona filtro por status na listagem`

## Pull Requests (solicitação de mudança)

O PR é a solicitação formal de mudança. Para ser mesclado, ele precisa de:
1. Descrição do que mudou e por quê, usando o template.
2. O check **Build & Test** verde.
3. **1 aprovação** de outro integrante, que faz o papel do comitê de controle de mudanças.
