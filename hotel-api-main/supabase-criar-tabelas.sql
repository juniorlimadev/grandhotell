-- ============================================
-- Grand Hotel - Criar todas as tabelas no Supabase
-- Cole e execute no Supabase: SQL Editor > New query
-- ============================================

-- 1) Tabelas principais
CREATE TABLE IF NOT EXISTS usuario (
    id_usuario INTEGER NOT NULL,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL,
    data_nascimento TIMESTAMPTZ NOT NULL,
    CONSTRAINT pk_usuario PRIMARY KEY (id_usuario)
);

CREATE TABLE IF NOT EXISTS quarto (
    id_quarto INTEGER NOT NULL,
    nome TEXT NOT NULL,
    ala TEXT NOT NULL,
    CONSTRAINT pk_quarto PRIMARY KEY (id_quarto)
);

CREATE TABLE IF NOT EXISTS reserva (
    id_reserva INTEGER NOT NULL,
    id_usuario INTEGER NOT NULL,
    id_quarto INTEGER,
    dt_inicio TIMESTAMPTZ NOT NULL,
    dt_fim TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL,
    CONSTRAINT pk_reserva PRIMARY KEY (id_reserva),
    CONSTRAINT fk_reserva_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    CONSTRAINT fk_reserva_quarto FOREIGN KEY (id_quarto) REFERENCES quarto(id_quarto)
);

-- 2) Cargos e relação usuário–cargo
CREATE TABLE IF NOT EXISTS cargo (
    id_cargo INTEGER NOT NULL,
    titulo TEXT NOT NULL,
    CONSTRAINT pk_cargo PRIMARY KEY (id_cargo)
);

CREATE TABLE IF NOT EXISTS usuario_cargo (
    id_usuario INTEGER NOT NULL,
    id_cargo INTEGER NOT NULL,
    CONSTRAINT pk_usuario_cargo PRIMARY KEY (id_usuario, id_cargo),
    CONSTRAINT fk_uc_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    CONSTRAINT fk_uc_cargo FOREIGN KEY (id_cargo) REFERENCES cargo(id_cargo)
);

-- 3) Sequências (para os IDs)
CREATE SEQUENCE IF NOT EXISTS seq_usuario START 1 NO CYCLE;
CREATE SEQUENCE IF NOT EXISTS seq_quarto START 1 NO CYCLE;
CREATE SEQUENCE IF NOT EXISTS seq_reserva START 1 NO CYCLE;
CREATE SEQUENCE IF NOT EXISTS seq_cargo START 1 NO CYCLE;

-- 4) Cargos iniciais (USER e ADMIN)
INSERT INTO cargo (id_cargo, titulo)
SELECT nextval('seq_cargo'), 'USER'
WHERE NOT EXISTS (SELECT 1 FROM cargo WHERE titulo = 'USER');

INSERT INTO cargo (id_cargo, titulo)
SELECT nextval('seq_cargo'), 'ADMIN'
WHERE NOT EXISTS (SELECT 1 FROM cargo WHERE titulo = 'ADMIN');
