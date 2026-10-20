# API HTTP

Estado atual dos endpoints (fonte: controllers em `src/modules/**`). Não há eventos em tempo real (sem WebSocket/SSE);
o único processo assíncrono é o cron de notificações (ver [arquitetura](arquitetura.md#jobs-agendados)).

## Convenções gerais

**Base URL:** a raiz do servidor (`http://localhost:3000` em dev). Não há prefixo global (`/api`) nem versionamento.

**API key (obrigatória em todas as rotas, inclusive login):** use uma das opções abaixo.
```
Authorization: Bearer <API_KEY>      # ou "ApiKey <API_KEY>"
x-api-key: <API_KEY>
?api_key=<API_KEY>
```
Erros (401): `API key não informada!`, `API key não configurada!` (variável vazia no servidor), `API KEY inválida!`.

**Sessão (JWT):** vai no cookie `accessToken` (httpOnly), gravado pelo login. O cliente precisa enviar cookies
(`credentials: 'include'`). O JWT **não** é lido do header `Authorization`.

**Legenda de autenticação nas tabelas:**
- `API key`: só a API key.
- `JWT`: API key + cookie `accessToken` válido.
- `JWT + roles X`: além disso, o usuário precisa ter pelo menos uma das roles listadas.

**Status de sucesso:** o padrão do Nest (`POST` → 201, demais → 200). Nenhuma rota define `@HttpCode`.

**Rate limit:** 100 req / 60 s por cliente (global). Excedido → `429 { "statusCode": 429, "message": "ThrottlerException: Too Many Requests" }`.

**Formato de erro (padrão do Nest):**
```json
{ "statusCode": 400, "message": ["email must be an email"], "error": "Bad Request" }
```
- Erro de validação de DTO de classe → 400 com `message` em array. Campo não declarado no DTO → 400 (`property X should not exist`).
- JWT ausente/inválido → `401 { "statusCode": 401, "message": "Unauthorized" }`.
- Sem a role exigida → `403 { "statusCode": 403, "message": "Acesso negado", "error": "Forbidden" }`.
- Erros inesperados (ex.: Prisma) viram 500 com uma mensagem fixa em português. Em alguns services o corpo do erro é o próprio
  objeto de erro serializado (ver [arquitetura](arquitetura.md#tratamento-de-erros)).
- Rotas PATCH recebem `Partial<Dto>` e **não validam** o body.

**Tipos:** valores `Decimal` (`value`, `initial_value`) são serializados como string (ex.: `"150.00"`). Datas em ISO 8601.

---

## Health

| Método | Rota | Auth | Resposta |
|---|---|---|---|
| GET | `/` | API key | `200` texto `Hello World!` |

---

## Auth (`/auth`)

| Método | Rota | Auth | Throttle |
|---|---|---|---|
| POST | `/auth/login` | API key | 5 / 15 min |
| POST | `/auth/register` | API key | 5 / 1 h |
| POST | `/auth/refresh` | API key + cookie `refreshToken` | global |
| POST | `/auth/logout` | JWT | global |
| GET | `/auth/me` | JWT | global |
| PATCH | `/auth/me` | JWT | global |
| POST | `/auth/me/picture` | JWT | global |
| DELETE | `/auth/me` | JWT | global |
| POST | `/auth/change-password` | JWT | 5 / 15 min |
| GET | `/auth/list` | JWT (sem role) | global |
| PATCH | `/auth/:id` | JWT (sem role) | global |
| DELETE | `/auth/:id` | JWT (sem role) | global |
| POST | `/auth/send-email-password-recovery` | API key | 3 / 15 min |
| POST | `/auth/validate-code` | API key | 5 / 15 min |
| POST | `/auth/reset-password` | API key + cookie `resetPasswordToken` | global |

Objeto `user` retornado pelas rotas de sessão:
```json
{
  "id": "6f1c…-uuid",
  "name": "Maria",
  "email": "maria@exemplo.com",
  "profilePicture": null,
  "roles": [{ "id": 1, "name": "Financeiro", "created_at": "2026-08-10T19:00:00.000Z" }]
}
```

### POST `/auth/login`
Request (`LoginDto`: `email` válido, `password` com 6+ caracteres):
```json
{ "email": "maria@exemplo.com", "password": "segredo123" }
```
Response `201`: `{ "user": { …user } }`, com os cookies:
- `accessToken` (1 h, path `/`)
- `refreshToken` (7 d, path `/auth/refresh`)

Erros: `400` validação · `401` "Email ou senha inválidos" · `500` "Erro ao realizar login".

### POST `/auth/register`
Request (`RegisterDto`):
```json
{ "name": "Maria", "email": "maria@exemplo.com", "password": "segredo123", "profile_picture": "opcional" }
```
Response `201` (**não grava cookies**; os tokens voltam no corpo):
```json
{ "user": { …user }, "accessToken": "eyJ…", "refreshToken": "eyJ…" }
```
O usuário recebe as roles `Financeiro`, `Notificações` e `Tarefas`, e um e-mail de boas-vindas é enviado (uma falha no envio é ignorada).
Erros: `400` validação · `409` "Email já cadastrado".
O mapeamento de `profile_picture` (DTO) para `profilePicture` (modelo) não existe no repositório; enviar o campo provavelmente gera erro do Prisma (_a confirmar_).

### POST `/auth/refresh`
Sem body. Lê o cookie `refreshToken`. Response `201`: `{ "user": { …user } }` e um novo cookie `accessToken`.
O refresh token não é rotacionado. Erros: `401` (cookie ausente ou hash não confere); token expirado ou inválido → erro do JWT
repassado (status _a confirmar_).

### POST `/auth/logout`
Sem body. Apaga `users.refreshToken` e limpa os cookies `accessToken` e `refreshToken`. Response `201` sem corpo.

### GET `/auth/me`
Response `200`: `{ "user": { …user } }` (o mesmo objeto de `req.user`).

### PATCH `/auth/me`
Request (`UpdateNameDto`: string de 2 a 100 caracteres): `{ "name": "Maria Silva" }`
Response `200`: `{ "user": { …user, "name": "Maria Silva" } }`. Erros: `400` · `500` "Erro ao atualizar nome de usuário".

### POST `/auth/me/picture`
`multipart/form-data` com o campo **`file`** (imagem, até 5 MB; guardada em memória e salva como data URI).
Response `201`: `{ "profilePicture": "data:image/png;base64,iVBOR…" }`
Erros: `415` "Nenhum arquivo enviado" / "O arquivo enviado deve ser uma imagem" · `413` "A imagem deve ter no máximo 5MB".

### DELETE `/auth/me`
Request (`DeleteAccountDto`): `{ "currentPassword": "segredo123" }`
Apaga o usuário e todos os seus dados (tarefas, categorias de tarefa, painéis, notificações) e limpa os cookies.
Response `200`: `{ "message": "Conta excluída com sucesso" }`. Erros: `401` "Senha incorreta" · `500` "Erro ao excluir conta".

### POST `/auth/change-password`
Request (`ChangePasswordDto`): `{ "currentPassword": "segredo123", "newPassword": "novaSenha1" }` (a nova com 6+ caracteres)
Invalida o refresh token salvo. O access token atual continua válido até expirar.
Response `201`: `{ "message": "Senha alterada com sucesso" }`. Erros: `400` · `401` "Senha atual incorreta".

### GET `/auth/list`
Response `200`: lista de todos os usuários.
```json
[{ "id": "…", "name": "Maria", "email": "…", "profilePicture": null, "roles": [{ "id": 1, "name": "Tarefas" }], "createdAt": "…" }]
```

### PATCH `/auth/:id`
Body livre (`Partial<RegisterDto>`, sem validação), repassado direto ao `prisma.user.update`.
Response `200`: o registro **completo** do usuário (inclui `password` e `refreshToken` em hash). A senha não é re-hasheada.

### DELETE `/auth/:id`
Response `200`: o registro completo do usuário apagado. Não apaga os dados de domínio do usuário.

### POST `/auth/send-email-password-recovery`
Request: `{ "email": "maria@exemplo.com" }` (sem validação de DTO).
Gera um código de 6 dígitos válido por 15 min e envia por e-mail. Response `201` sem corpo.
Erros: `500` "Erro ao validar e-mail" (também quando o e-mail não existe).

### POST `/auth/validate-code`
Request: `{ "email": "maria@exemplo.com", "code": "123456" }` (`code` como string).
Response `201`: `{ "message": "Código válido" }` e o cookie `resetPasswordToken` (10 min, path `/auth/reset-password`).
Erros: sempre com a mensagem "Erro ao validar código", status `404` (usuário inexistente), `400` (código inválido ou expirado) ou `500`.

### POST `/auth/reset-password`
Request: `{ "newPassword": "novaSenha1" }` (sem validação de tamanho). Lê o cookie `resetPasswordToken`.
Response `201`: `{ "message": "Senha atualizada com sucesso" }`, e o cookie é limpo.
Erros: `401` (token ausente, inválido ou com `purpose` diferente) · `404` "Usuário não encontrado".

---

## Admin (`/admin`) — JWT + roles `ADMIN`

| Método | Rota | Body | Response `2xx` | Erros |
|---|---|---|---|---|
| GET | `/admin/users` | — | usuários (`id, name, email, profilePicture, roles[{id,name}], createdAt`), do mais recente | 500 |
| GET | `/admin/roles` | — | `[{ id, name, created_at }]` em ordem de nome | 500 |
| POST | `/admin/roles` | `{ "name": "Relatorios" }` (`CreateRoleDto`) | a role criada | 400, 409 "Já existe uma role com esse nome" |
| PATCH | `/admin/roles/:id` | `{ "name": "Novo" }` (sem validação) | a role atualizada | 400 (id não numérico), 404 "Role não encontrada", 409 |
| DELETE | `/admin/roles/:id` | — | a role apagada (remove os vínculos com usuários) | 400, 404 |
| POST | `/admin/users/:id/roles` | `{ "roleId": 2 }` (`AssignRoleDto`, número) | o usuário (mesmo formato de `/admin/users`) | 400, 404 "Usuário ou role não encontrados" |
| DELETE | `/admin/users/:id/roles/:roleId` | — | o usuário atualizado | 400, 404 |

`:id` de role e `:roleId` usam `ParseIntPipe` (400 se não for numérico). `:id` de usuário é o UUID.

---

## Financeiro — painéis (`/financial-panel`) — JWT (sem role)

Todas as rotas com `:id` verificam se o painel pertence ao usuário (`403 "Acesso negado a este painel"`).

| Método | Rota | Descrição |
|---|---|---|
| POST | `/financial-panel/create` | cria um painel |
| GET | `/financial-panel/list` | lista os painéis do usuário com categorias e movimentações |
| PATCH | `/financial-panel/update/:id` | atualiza `name`/`initial_value` (`user_id` é ignorado) |
| DELETE | `/financial-panel/delete/:id` | apaga o painel (o banco leva categorias e movimentações junto) |
| GET | `/financial-panel/fees/:id` | soma mensal das categorias cujo nome contém "juros" |
| GET | `/financial-panel/expenses-graphics/:id?month=&year=` | gastos (`OUT`) por categoria no mês |
| GET | `/financial-panel/salary/:id?month=&year=` | entradas (`IN`) da categoria "Salário" no mês |

**POST `/create`.** Request (`PanelDTO`; `user_id` é obrigatório no DTO, mas o servidor usa o do JWT):
```json
{ "user_id": "qualquer-string", "name": "Conta corrente", "initial_value": 1500 }
```
Response `201`: `{ "id": 3, "user_id": "<id do JWT>", "name": "Conta corrente", "initial_value": "1500", "created_at": "…" }`

**GET `/list`.** Response `200`:
```json
[{
  "id": 3, "user_id": "…", "name": "Conta corrente", "initial_value": "1320.5", "created_at": "…",
  "categories": [{ "id": 7, "painel_id": 3, "name": "Mercado", "color": "#ff0000", "created_at": "…",
                   "movements": [{ "value": "179.5" }], "totalSpent": 179.5 }],
  "movements": [{ "id": 11, "painel_id": 3, "category_id": 7, "name": "Feira", "value": "179.5",
                  "movement_type": "OUT", "date": "2026-10-01T00:00:00.000Z", "created_at": "…",
                  "categories": { "name": "Mercado" } }]
}]
```
`categories[].movements` traz só as saídas; `movements` vem em ordem de `date` decrescente.

**GET `/fees/:id`.** Response `200`: `[{ "year": 2026, "month": 9, "total": "45.9" }]` (`total` vem de `SUM` em SQL cru; o tipo serializado está _a confirmar_).

**GET `/expenses-graphics/:id?month=10&year=2026`.** Response `200`:
```json
{ "categories": [{ "x": "Mercado", "y": 179.5, "color": "#ff0000" }], "total_expenses": 179.5 }
```
Categorias com total 0 ficam de fora. Os limites do mês usam o fuso local do servidor.

**GET `/salary/:id?month=10&year=2026`.** Response `200`: `{ "total_salary": 5000 }`

Erros comuns: `400` validação · `403` · `500` com mensagens como "Erro ao criar painel", "Erro ao listar gráfico de gastos".

---

## Financeiro — categorias (`/financial-category`) — JWT + roles `ADMIN` ou `Financeiro`

| Método | Rota | Body / Query | Response |
|---|---|---|---|
| POST | `/financial-category/create` | `{ "panel_id": 3, "name": "Mercado", "color": "#ff0000" }` (`CategoryDTO`) | a categoria criada (`id, painel_id, name, color, created_at`) |
| GET | `/financial-category/list?painel_id=3,4` | IDs separados por vírgula (`ParseArrayPipe`) | categorias dos painéis |
| PATCH | `/financial-category/update/:id` | `Partial<CategoryDTO>` (sem validação) | a categoria atualizada |
| DELETE | `/financial-category/delete/:id` | — | a categoria apagada |

Erros: `400` (validação ou `painel_id` ausente/inválido) · `403` "Acesso negado a este painel" / "Categoria não encontrada" · `500`.
Observações:
- Apagar uma categoria que tem movimentações falha (FK `NO ACTION`) e retorna erro 500.
- No PATCH, enviar `panel_id` vai direto ao Prisma, onde a coluna se chama `painel_id` (resultado _a confirmar_).

---

## Financeiro — movimentações (`/financial-movement`) — JWT (sem role)

| Método | Rota | Descrição |
|---|---|---|
| POST | `/financial-movement/create` | cria uma movimentação e ajusta o saldo do painel |
| GET | `/financial-movement/list/:panel_id` | lista paginada (15 por página) com filtros |
| GET | `/financial-movement/expenses/:panel_id?month=` | gastos por categoria no mês do **ano corrente** |
| PATCH | `/financial-movement/update/:id` | atualiza (não ajusta o saldo) |
| DELETE | `/financial-movement/delete/:id` | apaga e reverte o saldo |

**POST `/create`.** Request (`MovementDTO`):
```json
{ "name": "Feira", "value": 179.5, "movement_type": "OUT", "painel_id": 3, "category_id": 7, "date": "2026-10-01" }
```
Response `201`: a movimentação criada. `movement_type`: `IN` soma ao saldo; qualquer outro valor subtrai.

**GET `/list/:panel_id`.** Query (`MovementsFilterDTO`; outros parâmetros → 400):
`name` (contém, sem diferenciar maiúsculas), `movement_type`, `category_id`, `order_date` (`ASC`/`DESC`; padrão `desc`), `page`.
Com qualquer filtro ativo, `page` é forçado para 1.
```json
{
  "movements": [{ "id": 11, "painel_id": 3, "category_id": 7, "name": "Feira", "value": "179.5",
                  "movement_type": "OUT", "date": "2026-10-01T00:00:00.000Z", "created_at": "…",
                  "categories": { "id": 7, "name": "Mercado" } }],
  "pagination": { "total": 31, "page": 1, "perPage": 15, "totalPages": 3 }
}
```
Atenção: a API key via `?api_key=` nesta rota seria rejeitada por `forbidNonWhitelisted` (_a confirmar_); use o header.

**GET `/expenses/:panel_id?month=10`.** Response `200`:
```json
{ "total": 179.5, "data": [{ "x": "Mercado", "y": 179.5, "color": "#ff0000" }] }
```
Movimentações sem categoria aparecem como `x: "Unknown"`, `color: "#000"`.

Erros: `400` · `403` "Acesso negado a este painel" / "Movimento não encontrado" · `500`.

---

## Tarefas (`/tarefas`) — JWT + roles `ADMIN` ou `Tarefas`

O dono é informado pelo cliente (`userId`/`user_id`); o servidor não compara com o usuário do JWT.

| Método | Rota | Body / Query | Response |
|---|---|---|---|
| POST | `/tarefas` | `TarefasDTO` | a tarefa criada |
| GET | `/tarefas?user_id=&month=&year=` | sem validação | tarefas do mês com `categoria { nome, cor }`; **404** "Nenhum resultado encontrado" se vazio |
| GET | `/tarefas/semana?primeiroDia=DD/MM/YYYY&ultimoDia=DD/MM/YYYY&user_id=` | — | tarefas agrupadas por dia do mês |
| GET | `/tarefas/list-cards?user_id=&month=&year=` | — | contadores do mês |
| PATCH | `/tarefas/:id` | `Partial<TarefasDTO>` | a tarefa atualizada |
| DELETE | `/tarefas/:id` | — | a tarefa apagada |
| POST | `/tarefas/create-categoria` | `CategoriasTarefaDTO` | a categoria criada |
| GET | `/tarefas/list-categorias/:user_id` | — | categorias com `tarefasPendentes` |
| GET | `/tarefas/grafico-categorias/:user_id` | — | `[{ nome, total, cor }]` (total = concluídas) |
| PATCH | `/tarefas/patch-categoria/:id` | `Partial<CategoriasTarefaDTO>` | a categoria atualizada |
| DELETE | `/tarefas/delete-categoria/:id` | — | a categoria apagada (as tarefas ficam com `categoriaId = null`) |

**POST `/tarefas`.** Request:
```json
{ "nome": "Estudar", "userId": "<uuid>", "categoriaId": 2, "data": "2026-10-20T00:00:00.000Z",
  "status": "Pendente", "descricao": "opcional", "tempo": 90 }
```
Obrigatórios: `nome`, `userId`, `categoriaId` (número), `data`. Padrões no DTO: `status = "Pendente"`, `tempo = 0` (minutos).
Status usados pelo código: `Pendente`, `Concluida`.

**GET `/tarefas/semana`.** Response `200` (a chave é o dia do mês em UTC):
```json
{
  "20": { "tarefas": [{ "id": 5, "nome": "Estudar", "status": "Pendente", "tempo": 90, "…": "…" }],
          "tempoRestante": "01h30m", "totalTarefas": 1, "totalConcluidas": 0 }
}
```
`tempoRestante` soma o `tempo` das tarefas `Pendente`.

**GET `/tarefas/list-cards`.** Response `200`: `{ "totalPendente": 4, "totalMes": 10, "totalMinutosConcluidos": 320 }`

**GET `/tarefas/list-categorias/:user_id`.** Response `200`:
`[{ "id": 2, "nome": "Estudos", "cor": "#00f", "user_id": "…", "tarefasPendentes": 3 }]`

Observação: um PATCH em `/tarefas/:id` sem `categoriaId` envia `categoriaId: NaN` ao Prisma (`Number(undefined)`); resultado _a confirmar_.
Erros: `400` · `404` · `500` ("Erro ao criar tarefa", "Erro ao listar tarefa", …).

---

## Notificações (`/notifications`) — JWT + roles `ADMIN` ou `Notificações`

| Método | Rota | Body | Response |
|---|---|---|---|
| POST | `/notifications` | `NotificationDTO` | a notificação criada |
| GET | `/notifications/:userId` | — | notificações do usuário em ordem de `date`; **404** "Nenhuma notificação encontrada" se vazio |
| PATCH | `/notifications/:id` | `Partial<NotificationDTO>` | a notificação atualizada |
| DELETE | `/notifications/:id` | — | a notificação apagada |
| POST | `/notifications/send` | — | dispara o envio do dia: `{ "sent": 2, "message": "2 notificação(ões) enviada(s)" }` ou `{ "sent": 0, "message": "Nenhuma notificação para enviar hoje" }` |
| POST | `/notifications/send-test/:email` | — | envia um e-mail de teste: `{ "success": true, "message": "Email de teste enviado para x@y.com" }` |
| GET | `/notifications/debug` | — | diagnóstico: `{ serverNow, queryRange: { startOfDay, endOfDay }, allCurrentNotifications: [{ id, title, date, method, isCurrent }] }` (todas as notificações ativas, de **todos** os usuários) |

**POST `/notifications`.** Request:
```json
{ "userId": "<uuid>", "title": "Pagar aluguel", "description": "Vence dia 10",
  "date": "2026-11-10T00:00:00.000Z", "method": "EMAIL", "isCurrent": true }
```
`method`: `EMAIL` | `WHATSAPP` | `BOTH`. `isCurrent` é opcional (padrão `true`). Só `EMAIL` e `BOTH` são enviadas, e sempre por e-mail.
Erros: `400` · `404` · `500` ("Erro ao criar notificação", …).

---

## User info (`/user-info`) — JWT

| Método | Rota | Response |
|---|---|---|
| GET | `/user-info` | `{ "name": "…", "picture": "…", "userId": "<sub do Cognito>" }` |

Usa o cookie `idToken` ou, se ausente, o valor do header `Authorization` (que hoje carrega a API key) como access token do AWS Cognito
(`us-east-2`). Parece ser legado de uma autenticação anterior; uso atual _a confirmar_.

---

## Eventos em tempo real

Não existem. Não há gateway WebSocket, SSE nem webhooks.
