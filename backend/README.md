# Grand Hotel - Sistema de Gestão Hoteleira

Sistema simples de hotel para apresentação acadêmica: **backend** em Java (Spring Boot) e **frontend** em React (Vite), com login por usuário, gestão de quartos, reservas e usuários.

## Estrutura do projeto

- **Backend**: `src/` — API REST (Spring Boot 2.7, PostgreSQL, JWT, Liquibase)
- **Frontend**: `frontend/` — Painel administrativo React (Tailwind, estilo Grand Hotel)

## Pré-requisitos

- **Backend**: Java 17+, Maven, PostgreSQL (local ou na nuvem)
- **Frontend**: Node.js 18+

---

## 1. Banco de dados (PostgreSQL)

### Opção A: Banco local (Docker)

Na raiz do projeto:

```bash
docker-compose up -d
```

Isso sobe um PostgreSQL em `localhost:5432` (usuário `postgres`, senha `password`, banco `postgres`). O backend já está configurado para isso em `application.properties`.

### Opção B: Banco na nuvem

1. Crie um banco PostgreSQL em um provedor (ex: [Neon](https://neon.tech), [Supabase](https://supabase.com), [ElephantSQL](https://www.elephantsql.com)).
2. Copie o arquivo de exemplo do perfil cloud:
   ```bash
   cp src/main/resources/application-cloud.properties.example src/main/resources/application-cloud.properties
   ```
3. Edite `application-cloud.properties` e preencha:
   - `spring.datasource.url` — URL JDBC do seu banco (geralmente com `?sslmode=require`)
   - `spring.datasource.username`
   - `spring.datasource.password`
4. Rode o backend com o perfil `cloud`:
   ```bash
   mvn spring-boot:run -Dspring-boot.run.profiles=cloud
   ```

O Liquibase cria as tabelas na primeira execução (`usuario`, `quarto`, `reserva`, `cargo`, `usuario_cargo`).

---

## 2. Backend (API)

```bash
# Na raiz do projeto (hotel-api-main)
mvn spring-boot:run
```

- API: **http://localhost:8080**
- Swagger: **http://localhost:8080/swagger-ui.html**

Para usar banco na nuvem:

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=cloud
```

### Primeiro usuário (cadastro e login)

- **Cadastro**: `POST /usuario` (público) — corpo exemplo:
  ```json
  {
    "nome": "Admin",
    "email": "admin@hotel.com",
    "senha": "senha123",
    "dataNascimento": "01-01-1990"
  }
  ```
- **Login**: `POST /auth` — corpo:
  ```json
  { "login": "admin@hotel.com", "senha": "senha123" }
  ```
  Resposta: `{ "token": "..." }`. Use o token no header: `Authorization: Bearer <token>`.

O primeiro usuário é criado com cargo **USER**. Para acesso total (quartos, reservas, listar usuários), atribua o cargo **ADMIN** no banco após criar o usuário:

```sql
-- Troque 1 pelo id_usuario do seu usuário e 2 pelo id_cargo do ADMIN (consulte: SELECT * FROM cargo;)
INSERT INTO usuario_cargo (id_usuario, id_cargo) VALUES (1, 2);
```

---

## 3. Frontend (React)

```bash
cd frontend
npm install
```

Crie o arquivo de ambiente (opcional; se não criar, usa `http://localhost:8080`):

```bash
cp .env.example .env
# Edite .env e defina VITE_API_URL se a API estiver em outra URL
```

Subir o frontend:

```bash
npm run dev
```

Acesse: **http://localhost:5173**

- **Login**: use o e-mail e a senha de um usuário cadastrado.
- **Dashboard**: visão geral (quartos, ocupação, reservas).
- **Quartos**: listar, criar, editar e excluir quartos (nome, ala: ALTA/MEDIA/BAIXA).
- **Reservas**: listar reservas por período e criar nova reserva (usuário, quarto, datas). Quartos listados são os livres no período escolhido.
- **Usuários**: listar e criar usuários (perfil ADMIN).
- **Análise de Receita**: placeholder para relatórios.

---

## 4. Deixar rodando “certinho”

1. **Banco**: use Docker local ou um PostgreSQL na nuvem com `application-cloud.properties`.
2. **Backend**: `mvn spring-boot:run` (ou com `-Dspring-boot.run.profiles=cloud`).
3. **Frontend**: `cd frontend && npm run dev` (ou `npm run build` e sirva a pasta `dist` em produção).
4. **CORS**: o backend já permite `*` em CORS; para produção, restrinja a origem no `SecurityConfiguration` e configure `VITE_API_URL` para a URL real da API.

---

## Resumo de funcionalidades

| Funcionalidade        | Descrição                                      |
|-----------------------|------------------------------------------------|
| Login                 | E-mail + senha, JWT no header                  |
| Dashboard             | Total de quartos, ocupação, reservas ativas    |
| Gestão de Quartos     | CRUD (nome, ala)                               |
| Reservas              | Listar por período, criar (usuário + quarto)   |
| Gestão de Usuários    | Listar e criar usuários (ADMIN)                 |
| Banco na nuvem        | Perfil `cloud` + `application-cloud.properties` |

Se algo não conectar, confira: URL do banco, usuário/senha, e se o backend está na URL configurada no frontend (`VITE_API_URL`).
