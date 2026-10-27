# Permissões da API por perfil

Data: 13/10/2026. Relatório baseado nas rotas e regras atuais do backend `0equips`.

As permissões abaixo se referem à API. As rotas protegidas exigem token de acesso válido e usuário ativo. O backend consulta o perfil atual no banco de dados para autorizar a requisição.

| Requisição | Finalidade | Aluno | Gestor | Administrador |
| --- | --- | --- | --- | --- |
| `GET /equipments` | Listar equipamentos | Sim | Sim | Sim |
| `POST /equipments` | Cadastrar equipamento | Não | Sim | Sim |
| `DELETE /equipments/{id}` | Remover equipamento | Não | Sim | Sim |
| `GET /equipments/categories` | Listar categorias | Sim | Sim | Sim |
| `POST /equipments/categories` | Cadastrar categoria | Não | Sim | Sim |
| `DELETE /equipments/categories/{id}` | Remover categoria | Não | Sim | Sim |
| `GET /users` | Listar usuários | Não | Não | Sim |
| `PATCH /users/activate/{user_id}` | Ativar usuário | Não | Não | Sim |
| `PATCH /users/deactivate/{user_id}` | Desativar usuário | Não | Não | Sim |
| `PATCH /users/promote/{user_id}` | Promover aluno a gestor | Não | Não | Sim |
| `GET /loans` | Listar empréstimos | Apenas próprios | Todos | Todos |
| `GET /loans/{loan_id}` | Consultar empréstimo | Apenas próprio | Qualquer | Qualquer |
| `POST /loans` | Solicitar empréstimo | Em nome próprio | Em nome próprio | Em nome próprio |
| `PATCH /loans/allow/{loan_id}` | Aceitar requisição | Não | Sim | Sim |
| `PATCH /loans/deny/{loan_id}` | Negar requisição | Não | Sim | Sim |
| `PATCH /loans/pickup/{loan_id}` | Confirmar retirada | Não | Sim | Sim |
| `PATCH /loans/close/{loan_id}` | Confirmar devolução | Não | Sim | Sim |

## Autenticação e cadastro

Estas rotas não exigem token de acesso nem um perfil específico:

| Requisição | Condição |
| --- | --- |
| `POST /users` | Cadastro público; cria um aluno inicialmente inativo. |
| `POST /auth/login` | Email e senha válidos; usuário ativo. |
| `POST /auth/refresh` | Refresh token válido e não utilizado, sessão válida e usuário ativo. |

## Observações

- A promoção aceita apenas usuários com perfil aluno; não promove para administrador.
- Retirada e devolução dependem do estado do empréstimo: retirada exige aprovação; devolução exige retirada anterior.
- As demais validações de dados e de negócio continuam valendo, mesmo quando o perfil tem permissão.
- Ainda não existe rota para editar equipamentos.
- Há duas diferenças entre frontend e backend: o gestor vê a página de usuários, mas a API permite gerenciá-los apenas ao administrador; a API permite ao gestor cadastrar/remover equipamentos e categorias, mas a página `equipments.html` está disponível apenas ao administrador.

Fontes: `src/core/dependencies.py`, `src/http/{auth,users,equipments,loans}.py`, `src/services/{auth,users,loans}.py` e `src/models/models.py` no backend; `assets/js/app.js` no frontend. Não foram executados testes nem requisições que alteram dados para produzir este relatório.
