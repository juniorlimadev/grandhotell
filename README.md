# 🏨 Grand Hotel - Gestão Hoteleira Completa

Este é um projeto **Full Stack** desenvolvido com **Java Spring Boot 17** e **React (Vite/Tailwind)**. Oferece um sistema completo para controle de reservas, inventário de quartos, consumo de hóspedes e permissões de usuários.

---

## 📂 Estrutura do Repositório

Organizado em subdiretórios específicos para frontend e backend:

- **/frontend**: Aplicação React estruturada com Context API, Tailwind CSS e interface moderna com suporte a **Dark Mode**.
- **/backend**: API REST robusta com persistência em PostgreSQL, segurança JWT e documentação Swagger através do OpenApi.

---

## ✨ Funcionalidades Em Destaque

- **Dashboard Inteligente**: Indicadores de ocupação, receita realizada, check-ins e check-outs pendentes em tempo real.
- **Gestão de Consumo**: Lançamento dinâmico de produtos (bebidas, snacks) diretamente na ficha do hóspede com cálculo automático de saldo e histórico de preços.
- **Fluxo de Check-in/Out Moderno**: Processos simplificados com geração de comprovante de estadia (layout pronto para impressão térmica ou A4).
- **Inventário de Quartos**: Controle de estados (Disponível, Ocupado, Limpeza, Manutenção) com transições automáticas conforme o status da reserva.
- **Segurança Robusta**: Autenticação via JWT com níveis de acesso diferenciados para Administradores e Recepcionistas, integrando gerenciamento de perfis e fotos.
- **Experiência Premium**: Interface ultra-responsiva, animações fluidas, micro-interações e suporte nativo a temas claros e escuros.

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- Node.js 18+
- JDK 17
- PostgreSQL 14+

### Backend
1. Navegue até a pasta `backend/`.
2. Configure as credenciais do banco em `src/main/resources/application.properties`.
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

Para uma visão técnica técnica profunda, arquitetura e detalhes das melhorias implementadas, consulte:
👉 [**PRESENTATION.md**](./PRESENTATION.md)

---

## 🌐 Deploy
O projeto está configurado para deploy contínuo em ambientes Cloud:
- **Frontend**: [Vercel](https://vercel.com)
- **Backend/API**: [Render (WS)](https://render.com)
- **Base de Dados**: [PostgreSQL (Neon/Cloud)](https://postgresql.org)

---

*Desenvolvido com foco em Clean Code, Performance e UX State-of-the-Art.*
