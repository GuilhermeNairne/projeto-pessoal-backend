# 📋 Projeto Pessoal — Backend

API REST desenvolvida para servir a aplicação pessoal de produtividade, responsável pela autenticação, regras de negócio e persistência dos dados dos módulos de controle financeiro, tarefas e notificações.

---

## 🧩 Módulos

### 💰 Controle Financeiro
- CRUD de contas e categorias
- Registro de movimentações de entrada e saída
- Consultas agregadas para geração de gráficos

### ✅ Tarefas
- CRUD de categorias de tarefas
- Gerenciamento de tarefas por semana
- Atualização de status (pendente / concluída)

### 🔔 Notificações
- Cadastro de e-mail e número de WhatsApp por usuário
- Criação de notificações recorrentes ou únicas
- Envio automatizado nos canais configurados

---

## 🛠️ Tecnologias

- [NestJS](https://nestjs.com/)
- [Prisma ORM](https://www.prisma.io/)
- [PostgreSQL](https://www.postgresql.org/) via [Neon](https://neon.tech/)
- [TypeScript](https://www.typescriptlang.org/)

---

## 🔐 Autenticação

A autenticação utiliza dois tokens JWT:

- **Access Token** — token de curta duração para autenticação das requisições
- **Refresh Token** — token de longa duração para renovação do access token, armazenado na tabela do usuário no banco de dados

Ambos os tokens são gravados em **HTTP-only cookies**, impedindo acesso via JavaScript e aumentando a segurança contra ataques XSS.

## 👨‍💻 Autor

**Guilherme Men Linhares Nairne**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-guilherme--men--nairne-blue?style=flat&logo=linkedin)](https://www.linkedin.com/in/guilherme-men-nairne-332aa7181)
[![Gmail](https://img.shields.io/badge/Gmail-guilhermemen2003@gmail.com-red?style=flat&logo=gmail)](mailto:guilhermemen2003@gmail.com)
