-- Script de Configuração Manual do Banco de Dados (PostgreSQL)

-- 1. Certificar que as colunas suportam dados grandes (BASE64 das fotos)
ALTER TABLE USUARIO ALTER COLUMN foto_url TYPE TEXT;

-- 2. Inserir ou atualizar os Cargos (Permissões)
-- O sistema agora cria automaticamente, mas estes são os oficiais:
INSERT INTO cargo (id_cargo, titulo) 
SELECT nextval('seq_cargo'), 'USER' WHERE NOT EXISTS (SELECT 1 FROM cargo WHERE titulo = 'USER');

INSERT INTO cargo (id_cargo, titulo) 
SELECT nextval('seq_cargo'), 'ADMIN' WHERE NOT EXISTS (SELECT 1 FROM cargo WHERE titulo = 'ADMIN');

INSERT INTO cargo (id_cargo, titulo) 
SELECT nextval('seq_cargo'), 'GESTAO_QUARTOS' WHERE NOT EXISTS (SELECT 1 FROM cargo WHERE titulo = 'GESTAO_QUARTOS');

INSERT INTO cargo (id_cargo, titulo) 
SELECT nextval('seq_cargo'), 'GESTAO_RESERVAS' WHERE NOT EXISTS (SELECT 1 FROM cargo WHERE titulo = 'GESTAO_RESERVAS');

-- 3. Exemplo de como dar acesso total para um usuário específico
-- Substitua 'EMAIL_DO_USUARIO' pelo email desejado
INSERT INTO usuario_cargo (id_usuario, id_cargo)
SELECT u.id_usuario, c.id_cargo 
FROM usuario u, cargo c
WHERE u.email = 'EMAIL_DO_USUARIO' 
AND c.titulo IN ('ADMIN', 'GESTAO_QUARTOS', 'GESTAO_RESERVAS', 'USER')
ON CONFLICT DO NOTHING;
