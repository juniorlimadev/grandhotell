# 🏨 Grand Hotel - Documentation & Project Overview

Bem-vindo à documentação oficial do **Grand Hotel**, um sistema moderno de gerenciamento hoteleiro. Este documento apresenta a arquitetura, funcionalidades e as melhorias de código implementadas para garantir escalabilidade e manutenção simplificada.

---

## 🏗️ Arquitetura do Sistema

O projeto adota uma arquitetura **Full Stack** desacoplada:

1.  **Frontend (React + Vite)**: Interface rica e responsiva, utilizando Tailwind CSS para estilização e Axios para comunicação assíncrona com a API.
2.  **Backend (Java + Spring Boot)**: API RESTful robusta, seguindo os padrões de camadas (Controller -> Service -> Repository), com segurança via JWT.
3.  **Banco de Dados (PostgreSQL)**: Persistência de dados relacional.

---

## 🚀 Funcionalidades Principais

| Módulo | Descrição |
| :--- | :--- |
| **Painel (Dashboard)** | Visão em tempo real da ocupação do hotel e receita estimada. |
| **Gestão de Reservas** | Mapa de reservas dinâmico com fluxos de Check-in e Check-out. |
| **Inventário de Quartos** | Cadastro detalhado de quartos, alas e valores de diárias. |
| **Gestão de Usuários** | Controle de acesso via Cargos (Roles), permitindo diferentes níveis de permissão. |

---

## 🛠️ Melhores Práticas & Refatoração Implementada

Durante a fase de limpeza e comentários, foram aplicadas as seguintes melhorias:

### 1. Centralização de Lógica (DRY - Don't Repeat Yourself)
- **Frontend**: Criado o utilitário `frontend/src/utils/date-utils.js` para padronizar o tratamento de datas. Isso eliminou mais de 100 linhas de código duplicado e reduziu bugs de conversão entre formatos BR (DD/MM/YYYY), Backend (DD-MM-YYYY) e Input HTML (YYYY-MM-DD).

### 2. Documentação Técnica (Clean Code)
- **Backend (JavaDocs)**: Foram adicionados comentários técnicos em todos os serviços (`ReservaService`, `UsuarioService`, `QuartoService`), explicando a responsabilidade de cada método e regras de negócio complexas.
- **Frontend (Code Comments)**: Componentes React agora possuem cabeçalhos explicativos sobre seu estado e efeitos (`useEffect`).

### 3. Otimização de Performance
- **Remoção de Código Ineficiente**: No backend, removemos a exclusão automática de registros dentro de métodos de busca ("getters"), o que impactava negativamente a performance e a integridade dos dados (substituído por recomendações de Soft Delete/Scheduled Tasks).

### 4. Limpeza de Arquivos
- Removidos diretórios duplicados (`hotel-api-main/target`) e arquivos de build redundantes para manter o repositório leve e organizado.

---

## 📦 Como Iniciar o Projeto

### Backend
Localizado na pasta `/backend`.
1. Certifique-se de ter o **Java 17** e **Maven** instalados.
2. Execute `./mvnw spring-boot:run`.
3. A API estará disponível em `http://localhost:8080`.

### Frontend
Localizado na pasta `/frontend`.
1. Execute `npm install` para as dependências.
2. Execute `npm run dev` para iniciar o servidor de desenvolvimento.

---

## 👨‍💻 Próximos Passos Sugeridos
- Implementar **Soft Delete** em reservas para manter histórico (em vez de exclusão física).
- Adicionar **Testes Unitários** (JUnit/Mockito) nos serviços refatorados.
- Implementar **Upload de Imagens** para fotos de perfil dos usuários e quartos.

---
*Documentação gerada automaticamente para apresentação do projeto Grand Hotel.*
