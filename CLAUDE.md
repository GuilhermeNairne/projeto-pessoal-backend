# CLAUDE.md

## Back-end

API REST de uma aplicação pessoal de produtividade: autenticação, controle financeiro (painéis, categorias, movimentações),
tarefas semanais e notificações por e-mail. O repositório inteiro é o back-end (não há `apps/api`); o front-end é outro
projeto (`projeto-pessoal-frontend.vercel.app`).

### Stack (versões instaladas)
- Node 24 (sem `engines`/`.nvmrc`), TypeScript 5.9, NestJS 11.1 (Express)
- Prisma 7.2 + `@prisma/adapter-pg` → PostgreSQL (Neon, segundo o README)
- Auth: `@nestjs/jwt` + `passport-jwt` (JWT em cookies httpOnly), `bcrypt`
- `class-validator`/`class-transformer`, `@nestjs/throttler`, `@nestjs/schedule` (cron), `resend` (e-mail), `multer`
- Testes: Jest 30 + ts-jest; e2e com supertest

### Estrutura
```
src/
  main.ts                 bootstrap: cookie-parser, CORS, ValidationPipe global
  app.module.ts           registra módulos + guards globais (ApiKeyGuard, ThrottlerGuard)
  guards/apiKey.guard.ts  exige API key em TODA rota
  generated/prisma/       client Prisma gerado (versionado no git, NÃO editar à mão)
  modules/
    prisma/               PrismaService global
    auth/                 controllers/ services/ repositories/ useCases/ guards/ strategies/ decorators/ dto/
    admin/                gestão de roles (só ADMIN)
    financial/            panel/ category/ movement (controller + service + dto cada)
    tarefas/              tarefas e categorias de tarefa
    notification/         CRUD + cron diário de envio por e-mail
    mail/                 wrapper do Resend
    userInfo/             legado AWS Cognito (a confirmar se ainda é usado)
prisma/schema.prisma, prisma/migrations/   modelo e migrations
test/                     e2e (só o "Hello World")
```

### Comandos
- Instalar: `npm install` (há `package-lock.json` e `yarn.lock` — gerenciador oficial a confirmar)
- Dev: `npm run start:dev` (watch + `--env-file .env`); prod: `npm run build && npm run start:prod`
- Testes unitários: `npm test` (specs em `src/**/*.spec.ts`); e2e: `npm run test:e2e` (precisa de banco e API key)
- Lint: `npm run lint` — **aplica `--fix` e altera arquivos**; formatação: `npm run format`
- Migrations: `npx prisma migrate dev --name <nome>` e depois `npx prisma generate`; produção: `npx prisma migrate deploy`
- Não há scripts npm para Prisma; `prisma.config.ts` lê `DATABASE_URL` via `dotenv`

### Variáveis de ambiente (`.env`, não versionado)
`PORT` (padrão 3000), `API_KEY` (lista separada por vírgula), `DATABASE_URL`, `JWT_SECRET`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`.

### Convenções de código
- Padrão por módulo: `Controller` (rotas, guards, cookies) → `Service` (regra + Prisma) → `PrismaService`.
  Só `auth` tem camada `repositories/` (`UserRepository`) e `useCases/` (`RecoveryPasswordUseCase`).
- DTOs com `class-validator`; `ValidationPipe` global com `whitelist`, `forbidNonWhitelisted`, `transform`.
- Erros: `try/catch` em cada método do service, `console.log(error)` e relançamento como `HttpException`
  (padrão `throw new HttpException(error.response ?? 'Mensagem', error.status ?? 500)`). Mensagens em português.
- Autorização: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('ADMIN', '<Módulo>')` no controller.
  Roles existentes: `ADMIN`, `Financeiro`, `Tarefas`, `Notificações` (as três últimas são dadas no cadastro).
- Usuário autenticado em `req.user` (`{ id, name, email, profilePicture, roles }`).
- Financeiro valida dono do painel (`assertPanelOwnership`) usando `req.user.id`; tarefas e notificações recebem `userId` do cliente.
- Nomes misturados (pt/en, snake/camel: `painel_id`, `userId`, `categoriaId`) — siga o nome que já existe no modelo.
- Imports usam tanto caminho relativo quanto absoluto `src/...` (baseUrl `./`; Jest mapeia `^src/`).
- Prettier: aspas simples, trailing comma. ESLint: `no-explicit-any` desligado.

### Regras e armadilhas
- Toda requisição exige API key (`Authorization: Bearer <key>`, `x-api-key` ou `?api_key=`); o JWT vai **só** no cookie `accessToken`.
- Bodies tipados como `Partial<Dto>` (todos os PATCH) e `@Body('campo')` **não são validados** pelo ValidationPipe.
- `@Query() query: ListTarefasType` é um `type`, não classe → sem validação; `month`/`year` chegam como string.
- `forbidNonWhitelisted`: campo extra num DTO de classe → 400.
- Depois de mudar `schema.prisma`, gere o client (`src/generated/prisma`) e versione o resultado.
- `panels.initial_value` é o **saldo corrente**: criar/excluir movimentação altera o valor; editar não altera.
- Não existe FK entre `users` e `panels`/`tarefas`/`categorias_tarefa`/`notifications`; a exclusão de conta
  apaga tudo em `UserRepository.deleteAccountCascade` — atualize essa função ao criar tabelas ligadas ao usuário.
- Cookies são `secure` + `sameSite: none` + `partitioned`: exigem HTTPS (ou localhost) e `credentials: true` no front.
- CORS está fixo em `main.ts` (`localhost:3001` e o domínio da Vercel).
- Estado atual dos testes: 2 testes falham em `auth.service.spec.ts` (login/refresh esperam objeto sem `profilePicture`/`roles`).
- Sem filtro global de exceções, sem logger estruturado, sem filas, sem WebSocket. Único job: cron `0 8 * * *` de notificações.

### Documentação detalhada
- [Arquitetura](docs/backend/arquitetura.md)
- [Modelo de dados](docs/backend/modelo-de-dados.md)
- [API (endpoints)](docs/backend/api.md)
