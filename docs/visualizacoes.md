# Páginas e scripts por visualização

Mapeamento do frontend em 14/10/2026, conforme as permissões definidas em `assets/js/app.js`. Os caminhos abaixo são relativos à raiz do projeto.

As páginas compartilhadas usam os mesmos arquivos HTML e JavaScript para todos os perfis autorizados; não existem cópias separadas por perfil.

## Aluno

Página inicial após o login: `loans.html`.

| Página HTML | JavaScript da página | Finalidade |
| --- | --- | --- |
| `loans.html` | `assets/js/loans.js` | Consultar equipamentos disponíveis, montar o carrinho, informar as datas e solicitar um empréstimo. |

## Gestor

Página inicial após o login: `loan-management.html`.

| Página HTML | JavaScript da página | Finalidade |
| --- | --- | --- |
| `users.html` | `assets/js/users.js` | Consultar alunos e ativar ou desativar seus cadastros. A API restringe quais usuários o gestor pode consultar e alterar. |
| `loans.html` | `assets/js/loans.js` | Montar e enviar uma solicitação de empréstimo em nome próprio. |
| `loan-management.html` | `assets/js/loan-management.js` | Filtrar empréstimos, consultar detalhes e equipamentos, aceitar ou negar solicitações e confirmar retiradas e devoluções. |

## Administrador

Página inicial após o login: `equipments.html`.

| Página HTML | JavaScript da página | Finalidade |
| --- | --- | --- |
| `equipments.html` | `assets/js/equipments.js` | Gerenciar equipamentos e cadastrar categorias. |
| `users.html` | `assets/js/users.js` | Consultar usuários, ativar ou desativar cadastros e promover alunos a gestor pelo diálogo de detalhes. |
| `loans.html` | `assets/js/loans.js` | Montar e enviar uma solicitação de empréstimo em nome próprio. |
| `loan-management.html` | `assets/js/loan-management.js` | Filtrar empréstimos, consultar detalhes e equipamentos, aceitar ou negar solicitações e confirmar retiradas e devoluções. |

## Não logado

Página de entrada: `login.html`.

| Página HTML | JavaScript da página | Finalidade |
| --- | --- | --- |
| `login.html` | `assets/js/login.js` | Autenticar o usuário e direcioná-lo à página inicial do seu perfil. |
| `register.html` | `assets/js/register.js` | Cadastrar um usuário e apresentar o acesso ao login após o cadastro. |

Essas duas páginas são públicas e também podem ser abertas por usuários autenticados. As demais páginas exigem sessão válida; quem não estiver autenticado será redirecionado para `login.html`.

## Código compartilhado

Todas as páginas carregam `assets/js/app.js`, responsável pela sessão, leitura das claims do JWT, controle de acesso às páginas, navbar por perfil, logout, chamadas à API com Bearer e busca de equipamentos por nome ou categoria. Também carregam Alpine.js pelo CDN.

O acesso a uma página protegida não permitida para o perfil redireciona o usuário para sua página inicial. As permissões das operações na API são validadas pelo backend.

## Página antiga de catálogo

`index.html` e `assets/js/index.js` ainda existem, mas não pertencem à navegação atual de nenhum perfil. A página não está na lista de acessos permitidos de `app.js`.

Ao acessar `index.html`, o aluno é redirecionado para `loans.html`, o gestor para `loan-management.html`, o administrador para `equipments.html` e o usuário não autenticado para `login.html`.
