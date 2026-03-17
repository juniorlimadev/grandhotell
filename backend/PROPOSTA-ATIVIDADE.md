# Verificação – Proposta da Atividade (Desenvolvimento de Software em Nuvem)

Este documento confere o atendimento do projeto **Grand Hotel** aos itens da **Proposta de Atividade – Desenvolvimento de Software em Nuvem** (Atividade Final – ADS/IA EAD Unifor).

---

## 4. Escopo do Projeto

### 4.1 Aplicação Web
| Requisito | Status | Onde está no projeto |
|-----------|--------|----------------------|
| Sistema com caso de uso elaborado (ex.: reservas, múltiplos perfis) | ✅ | Sistema de reservas de hotel com perfis **usuário** e **admin** (cargos USER e ADMIN). Login, gestão de quartos, reservas e usuários. |

### 4.2 Requisitos Funcionais
| Requisito | Status | Onde está no projeto |
|-----------|--------|----------------------|
| Autenticação e autorização | ✅ | Login (e-mail/senha), JWT, `SecurityConfiguration` com roles (USER, ADMIN). Rotas protegidas no back e front. |
| API RESTful documentada (Swagger/OpenAPI) | ✅ | SpringDoc OpenAPI em `OpenApiConfig.java`. Swagger UI: `/swagger-ui.html`. |
| Operações CRUD completas | ✅ | Quartos, Reservas e Usuários: listar, criar, editar, excluir e consultar por ID. |
| Validação de dados no back-end | ✅ | Bean Validation nos DTOs (`@NotBlank`, `@NotNull`, `@Email`, etc.) e `CustomGlobalExceptionHandler` para erros de validação. |
| Registro de logs de acesso e erro | ✅ | `@Slf4j` e `log.info` nos controllers/services; logging do Hibernate e Spring configurável em `application.properties`. |

### 4.3 Arquitetura Técnica Obrigatória
| Requisito | Status | Onde está no projeto |
|-----------|--------|----------------------|
| **Front-end:** framework moderno (React, Vue ou Angular) | ✅ | **React** (Vite) em `frontend/`. |
| **Front-end:** deploy em serviço de nuvem (Netlify, Vercel ou similar) | ✅ | Configuração para deploy: `frontend/vercel.json` e `frontend/netlify.toml`. README e este documento descrevem deploy em Vercel/Netlify. |
| **Back-end:** API REST em ambiente containerizado (Docker) | ✅ | **Dockerfile** na raiz do projeto (build Maven + imagem JRE). Banco fica fora do container (persistência em nuvem). |
| **Back-end:** deploy em serviço de nuvem (Render, Railway, AWS, etc.) | 📋 | Documentado no README (perfil `cloud`, variáveis de ambiente). Deploy efetivo depende de conta em Render/Railway/etc. |
| **Banco de Dados:** serviço gerenciado em nuvem | ✅ | Uso de PostgreSQL em nuvem (Supabase, Neon, ElephantSQL, RDS, etc.) via `application-cloud.properties` e variáveis de ambiente. |
| **Banco de Dados:** persistência fora do container | ✅ | A API em Docker conecta ao banco via URL configurável (banco não roda dentro do container). |

---

## 5. DevOps e Nuvem (Obrigatório)

| Requisito | Status | Onde está no projeto |
|-----------|--------|----------------------|
| Uso de Docker para empacotamento do back-end | ✅ | **Dockerfile** (multi-stage: Maven build + imagem final com JRE). |
| Pipeline CI/CD (GitHub Actions ou similar): Build | ✅ | `.github/workflows/ci.yml`: job **backend** (Maven), job **frontend** (npm build). |
| Pipeline CI/CD: Execução de testes automatizados | ✅ | Job **backend**: `mvn verify -Dspring.profiles.active=test` (testes com H2). |
| Pipeline CI/CD: Deploy automático | 📋 | Pipeline faz build e testes. Deploy automático pode ser configurado no GitHub (ex.: deploy no Render/Vercel vinculado ao repositório). README orienta deploy manual e em nuvem. |

---

## 6. Segurança e Boas Práticas

| Requisito | Status | Onde está no projeto |
|-----------|--------|----------------------|
| Uso de variáveis de ambiente para credenciais | ✅ | `application.properties` usa `${SPRING_DATASOURCE_*}` e `${JWT_SECRET}` com valores padrão apenas para desenvolvimento local. Exemplo de produção em `application-prod.properties.example`. |
| Proteção de rotas autenticadas | ✅ | Back: JWT + `TokenAuthenticationFilter` e `SecurityConfiguration`. Front: rotas protegidas e redirecionamento para login em 401. |
| Tratamento adequado de erros | ✅ | `CustomGlobalExceptionHandler` (validação, regras de negócio, 403). Front: tratamento de erro nas chamadas à API e exibição de mensagens. |
| Separação entre ambientes (dev/prod) | ✅ | Perfis: default (dev local), `test` (H2 para testes), `cloud`/prod (banco e credenciais por variáveis de ambiente). |

---

## 7. Testes e Qualidade (Opcional)

| Requisito | Status | Onde está no projeto |
|-----------|--------|----------------------|
| Testes automatizados no back-end | ✅ | Testes com JUnit 5 e `@SpringBootTest`; perfil `test` com H2. Pipeline executa `mvn verify`. |
| Testes no front-end (componente ou fluxo) | 📋 | Opcional na proposta; pode ser adicionado (ex.: Vitest/React Testing Library). |

---

## 8. Ferramentas Colaborativas

| Requisito | Status | Observação |
|-----------|--------|------------|
| Repositório público no GitHub | 📋 | A ser criado/confirmado pela equipe. |
| Uso de branches por funcionalidade | 📋 | Prática recomendada; a ser adotada pela equipe. |
| Commits semânticos e frequentes | 📋 | Prática recomendada; a ser adotada pela equipe. |
| Issues ou Kanban (GitHub Projects) | 📋 | A ser configurado pela equipe. |

---

## 9. Entregáveis

### 9.1 Código-Fonte
| Item | Status |
|------|--------|
| Repositório público no GitHub | 📋 Equipe |
| Código organizado | ✅ Estrutura back (camadas) e front (componentes, páginas, serviços, contextos). |
| Dockerfile | ✅ Raiz do projeto. |
| Arquivos de configuração | ✅ `application*.properties`, `vercel.json`, `netlify.toml`, `.env.example`, etc. |
| README detalhado | ✅ README com execução local, banco na nuvem, primeiro usuário e deploy. |

### 9.2 Relatório Técnico e 9.3 Vídeo
- Relatório (visão do sistema, arquitetura, tecnologias, deploy, CI/CD, papéis, dificuldades) e vídeo de demonstração são de responsabilidade da equipe, conforme a proposta.

---

## Resumo

- **Atendidos na proposta:** aplicação web (reservas + múltiplos perfis), requisitos funcionais (auth, API documentada, CRUD, validação, logs), arquitetura (React, Docker, banco na nuvem, persistência fora do container), DevOps (Docker, pipeline com build e testes), segurança (env vars, rotas protegidas, erros, perfis).
- **Dependem da equipe:** criar repositório público, configurar deploy automático (Render/Vercel a partir do GitHub), preencher relatório e vídeo, adotar branches/commits/Issues conforme a proposta.

Com os ajustes feitos (Dockerfile, CI com build e testes, credenciais por variáveis de ambiente, config de deploy do front), o **código está alinhado à proposta**; o restante é configuração em nuvem e entregáveis (relatório/vídeo) pela equipe.
