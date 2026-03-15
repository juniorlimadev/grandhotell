# Grand Hotell - Sistema de Reservas

Este é um projeto completo de gerenciamento de hotel, composto por um frontend em React e um backend em Java Spring Boot.

## 📂 Estrutura do Projeto

- **/frontend**: Aplicação React construída com Vite e Tailwind CSS.
- **/hotel-api-main**: API REST construída com Spring Boot, JPA/Hibernate e PostgreSQL.

## 🚀 Como Executar Localmente

### Pré-requisitos
- Node.js 18+
- JDK 17
- PostgreSQL (ou Supabase)

### Backend
1. Entre na pasta `hotel-api-main`.
2. Configure as credenciais do banco em `src/main/resources/application.properties`.
3. Execute o comando:
   ```bash
   ./mvnw spring-boot:run
   ```

### Frontend
1. Entre na pasta `frontend`.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Execute o projeto:
   ```bash
   npm run dev
   ```

## 🌐 Deploy

O projeto está configurado para deploy em:
- **Vercel** (Frontend)
- **Render** (Backend)

Consulte o arquivo `deployment_guide.md` para instruções detalhadas de configuração.
