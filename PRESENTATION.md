# 🏨 Grand Hotel - Documentation & Project Overview

Bem-vindo à documentação oficial do **Grand Hotel**, um sistema moderno de gerenciamento hoteleiro de alto desempenho. Este documento apresenta a arquitetura, funcionalidades e as melhorias de engenharia implementadas para garantir escalabilidade e manutenção simplificada.

---

## 🏗️ Arquitetura do Sistema

O projeto adota uma arquitetura **Full Stack Cloud-Native**:

1.  **Frontend (React 18 + Vite)**: SPA (Single Page Application) com interface rica e reativa. Utiliza **Tailwind CSS** para design system flexível, **Context API** para gestão de estado global (Auth e Temas) e **Axios** para consumo da API REST.
2.  **Backend (Java 17 + Spring Boot 3)**: API RESTful robusta seguindo os padrões de camadas (**Controller -> Service -> Repository**). Segurança baseada em **JWT (JSON Web Token)** e **Spring Security**. Documentação integrada com **OpenAPI (Swagger)**.
3.  **Banco de Dados (PostgreSQL)**: Persistência relacional otimizada, com versionamento de schema via **Liquibase**.

---

## 🚀 Funcionalidades Principais Implementadas

| Módulo | Descrição Impactante |
| :--- | :--- |
| **Dashboard Operacional** | Painel central com métricas dinâmicas: taxa de ocupação real, receita projetada e alertas de manutenções. |
| **Check-out Financeiro** | Sistema completo de fechamento de conta, integrando diárias, consumos extras de frigobar e geração de recibos. |
| **Gestão de Produtos** | CRUD completo de inventário com controle de preços históricos e categorias. |
| **Segurança & Perfis** | Gestão de usuários com upload de fotos (processamento Base64 otimizado) e controle de permissões por Role. |
| **Frontend Adaptativo** | UX Premium com animações de entrada, skeletons de carregamento e suporte a Dark/Light Mode. |

---

## 🛠️ Melhores Práticas & Refatoração (Clean Code)

### 1. Centralização e Reuso (DRY)
- **Data Utils**: Padronização global de tratamento de datas através de `frontend/src/utils/date-utils.js`, garantindo consistência entre o backend e os selects do frontend.
- **Layout Unificado**: Estrutura de Sidebar e Navbar persistente que detecta dinamicamente as permissões do usuário logado.

### 2. Otimização Financeira
- **Cálculo de Consumo**: Implementado no backend (Spring Boot) com validação de estoque e vínculo direto com reservas ativas, evitando lançamentos em contas já encerradas.

### 3. Experiência de Desenvolvedor (DX)
- **Logging Inteligente**: Substituição de logs genéricos por tags de diagnóstico estruturadas (`@Slf4j`) no backend.
- **Scripts de Build**: Automação de instâncias e migrações via Maven e Liquibase.

### 4. UI/UX Refinada
- **Impressão de Recibos**: Estilização via @media print para que os comprovantes de check-out saiam perfeitos direto do navegador.
- **Identidade Visual**: Integração de favicon e logotipos personalizados em todas as superfícies da plataforma.

---

## 📦 Como Iniciar o Desenvolvimento

### Backend
Pasta `/backend`.
1. Certifique-se de ter o **JDK 17** e **Maven** configurados.
2. O banco de dados Postgres deve estar ativo (conforme `application.properties`).
3. Execute `./mvnw spring-boot:run`.

### Frontend
Pasta `/frontend`.
1. Execute `npm install`.
2. Execute `npm run dev`.
3. Acesse `http://localhost:5173`.

---

## 📈 Roadmap & Evolução
- [ ] Implementação de **Dashboard Estatístico** (Gráficos Anuais).
- [ ] Módulo de **Controle de Estoque automático** (baixa no produto ao consumir).
- [ ] Integração com **Gateway de Pagamento (PIX API)**.

---
*Documentação atualizada em Março de 2026 para refletir o estado atual do Produto.*
