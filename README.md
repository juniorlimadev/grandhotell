# 🏨 Grand Hotel - Gestão Hoteleira Completa

Este é um projeto **Full Stack** desenvolvido com **Java Spring Boot 17** e **React (Vite/Tailwind)**. Oferece um sistema completo para controle de reservas, inventário de quartos e permissões de usuários.

---

## 📂 Estrutura do Repositório

Organizado em subdiretórios específicos para frontend e backend:

- **/frontend**: Aplicação React com interface moderna e responsiva.
- **/backend**: API REST robusta com persistência em PostgreSQL.

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- Node.js 18+
- JDK 17
- PostgreSQL 14+

### Backend
1. Navegue até a pasta `backend/`.
2. Configure as credenciais do banco em `src/main/resources/application-local.properties` (ou similar).
3. Execute o comando:
   ```bash
   ./mvnw spring-boot:run
   ```

### Frontend
1. Navegue até a pasta `frontend/`.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

---

## 📖 Documentação Detalhada

Para uma visão técnica completa, arquitetura e detalhes das melhorias implementadas, consulte o arquivo:
👉 [**PRESENTATION.md**](./PRESENTATION.md)

---

## 🌐 Deploy Ativo

O projeto está configurado e rodando em produção:
- **Frontend**: [Vercel](https://vercel.com)
- **Backend**: [Render](https://render.com)
- **Banco**: [PostgreSQL](https://postgresql.org)

Consulte `deployment_guide.md` para instruções de CI/CD.

---

*Desenvolvido com foco em Clean Code e Performance.*

