CREATE TABLE Usuario (
    usuario_id     INT AUTO_INCREMENT PRIMARY KEY,
    nombreCompleto VARCHAR(40) NOT NULL,
    correo         VARCHAR(40) NOT NULL UNIQUE,
    contrasena     VARCHAR(200) NOT NULL, -- guarda hash, no texto plano
    fecha_registro DATE NOT NULL,
    activo         BOOL NOT NULL DEFAULT TRUE,
    rol            VARCHAR(5) NOT NULL,   -- "admin" / "user"
    apodo          VARCHAR(12)
);

CREATE TABLE Categoria (
    categoria_id INT AUTO_INCREMENT PRIMARY KEY,
    nombre       VARCHAR(40) NOT NULL
);

CREATE TABLE Evento (
    evento_id          INT AUTO_INCREMENT PRIMARY KEY,
	titulo			   VARCHAR(60) NOT NULL,
    descripcion_corta  VARCHAR(200) NOT NULL,
    descripcion_larga  text,
    fecha_evento       DATE NOT NULL,
    hora               VARCHAR(10) NOT NULL,
    url_imagen         VARCHAR(200),
    tipo_evento        VARCHAR(7) NOT NULL, -- "publico"/"privado"
    ubicacion          VARCHAR(200),
    latitud            VARCHAR(40),
    longitud           VARCHAR(40),
    ciudad             VARCHAR(20),
    distrito           VARCHAR(20),
    url_direccion      VARCHAR(200),
    url_recurso        VARCHAR(200),
    estado_evento      BOOL NOT NULL DEFAULT TRUE,
    categoria_id       INT,
    FOREIGN KEY (categoria_id) REFERENCES Categoria(categoria_id)
);
CREATE TABLE Participacion (
    participacion_id INT AUTO_INCREMENT PRIMARY KEY,
    fecha_registro   DATE NOT NULL,
    fecha_actualizada DATE,
    rol_evento       VARCHAR(20) NOT NULL, -- "organizador"/"coorganizador"/"asistente"
    usuario_id       INT NOT NULL,
    evento_id        INT NOT NULL,
    UNIQUE (usuario_id, evento_id),
    FOREIGN KEY (usuario_id) REFERENCES Usuario(usuario_id),
    FOREIGN KEY (evento_id)  REFERENCES Evento(evento_id)
);

CREATE TABLE Invitacion (
    invitacion_id    INT AUTO_INCREMENT PRIMARY KEY,
    estado           ENUM('pendiente','aceptada','rechazada') DEFAULT 'pendiente',
    mensaje          VARCHAR(200),
    fecha_invitacion DATE NOT NULL,
    organizador_id   INT NOT NULL,
    invitado_id      INT NOT NULL,
    evento_id        INT NOT NULL,
    FOREIGN KEY (organizador_id) REFERENCES Usuario(usuario_id),
    FOREIGN KEY (invitado_id)    REFERENCES Usuario(usuario_id),
    FOREIGN KEY (evento_id)      REFERENCES Evento(evento_id)
);

CREATE TABLE EventosGuardado (
    eventosguardado_id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    evento_id  INT NOT NULL,
    UNIQUE (usuario_id, evento_id),
    FOREIGN KEY (usuario_id) REFERENCES Usuario(usuario_id),
    FOREIGN KEY (evento_id)  REFERENCES Evento(evento_id)
);

CREATE TABLE ComentarioEvento (
    comentarioevento_id INT AUTO_INCREMENT PRIMARY KEY,
    mensaje    VARCHAR(200) NOT NULL,
    likes      INT DEFAULT 0,
    dislikes   INT DEFAULT 0,
    usuario_id INT NOT NULL,
    evento_id  INT NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES Usuario(usuario_id),
    FOREIGN KEY (evento_id)  REFERENCES Evento(evento_id)
);

INSERT INTO Usuario (nombreCompleto, correo, contrasena, fecha_registro, activo, rol, apodo)
VALUES 
('Juan Pérez', 'juanperez@mail.com', 'hash123', '2025-09-01', TRUE, 'user', 'juanito'),
('María Gómez', 'mariag@mail.com', 'hash456', '2025-09-05', TRUE, 'user', 'mary'),
('Admin Master', 'admin@mail.com', 'hash789', '2025-09-10', TRUE, 'admin', 'root');

INSERT INTO Categoria (nombre) VALUES
('Conferencia'),
('Concierto'),
('Deportivo'),
('Taller'),
('Networking'),
('Seminario'),
('Webinar'),
('Curso'),
('Feria'),
('Exposición'),
('Festival'),
('Reunión'),
('Congreso'),
('Lanzamiento'),
('Charla'),
('Panel'),
('Mesa Redonda'),
('Campamento'),
('Hackathon'),
('Competencia'),
('Clases Magistrales'),
('Workshop'),
('Retiro'),
('Recaudación de Fondos'),
('Social'),
('Gastronómico'),
('Cultural'),
('Tecnológico'),
('Cine'),
('Literario'),
('Arte'),
('Danza'),
('Teatro'),
('Religioso'),
('Político'),
('Ambiental'),
('Bienestar'),
('Salud'),
('Fitness'),
('Voluntariado'),
('Aniversario'),
('Graduación'),
('Formación Profesional'),
('Demo Day'),
('Tour'),
('Visita Guiada'),
('Coworking'),
('Open House'),
('Startup Pitch');

INSERT INTO Evento 
(titulo, descripcion_corta, descripcion_larga, fecha_evento, hora, url_imagen, 
 tipo_evento, ubicacion, latitud, longitud, ciudad, distrito, url_direccion, url_recurso, estado_evento, categoria_id)
VALUES
('Tech Conference 2025',
 'Conferencia sobre innovación y tendencias tecnológicas.',
 'Una conferencia internacional que reúne a expertos en inteligencia artificial, blockchain y ciberseguridad para discutir el futuro de la tecnología.',
 '2025-11-15', '09:00',
 'https://example.com/img1.jpg', 'publico',
 'Centro de Convenciones de Lima', '-12.0464', '-77.0428',
 'Lima', 'San Borja', 'https://maps.google.com/1', 'https://example.com/resource1', TRUE, 1),

('Rock Fest Lima',
 'Festival de música rock con bandas internacionales.',
 'Una experiencia única con escenarios múltiples, zona gastronómica y artistas de talla mundial en un evento de 8 horas de duración.',
 '2025-12-20', '18:00',
 'https://example.com/img2.jpg', 'publico',
 'Estadio Nacional', '-12.0678', '-77.0332',
 'Lima', 'Cercado de Lima', 'https://maps.google.com/2', 'https://example.com/resource2', TRUE, 2),

('Carrera 10K Lima',
 'Competencia deportiva abierta al público.',
 'Evento deportivo anual donde corredores profesionales y amateurs participan en un recorrido de 10 km por el centro de Lima.',
 '2025-10-05', '07:30',
 'https://example.com/img3.jpg', 'publico',
 'Parque de la Exposición', '-12.0615', '-77.0375',
 'Lima', 'Centro Histórico', 'https://maps.google.com/3', 'https://example.com/resource3', TRUE, 3),

('Taller de Emprendimiento',
 'Capacitación práctica para emprendedores jóvenes.',
 'Un taller intensivo de 6 horas con expertos en modelos de negocio, pitch de startups y marketing digital.',
 '2025-09-30', '14:00',
 'https://example.com/img4.jpg', 'privado',
 'Universidad de Lima', '-12.0840', '-76.9717',
 'Lima', 'Surco', 'https://maps.google.com/4', 'https://example.com/resource4', TRUE, 4),

('Networking Startup Night',
 'Encuentro de emprendedores y profesionales de tecnología.',
 'Un espacio para conectar fundadores de startups, inversores y mentores en un ambiente distendido con música y coffee break.',
 '2025-11-05', '19:00',
 'https://example.com/img5.jpg', 'publico',
 'WeWork Torre Begonias', '-12.0932', '-77.0314',
 'Lima', 'San Isidro', 'https://maps.google.com/5', 'https://example.com/resource5', TRUE, 5),

('Webinar de Ciberseguridad',
 'Seminario virtual sobre seguridad digital.',
 'Evento online con especialistas que explicarán las amenazas más comunes, cómo proteger la información y mejores prácticas en entornos empresariales.',
 '2025-10-22', '16:00',
 'https://example.com/img6.jpg', 'publico',
 'Evento Online - Zoom', '0', '0',
 'Lima', 'Virtual', 'https://zoom.com/webinar123', 'https://example.com/resource6', TRUE, 6),

('Festival Gastronómico Peruano',
 'Muestra culinaria con los mejores chefs del país.',
 'Degustaciones, clases en vivo, venta de productos locales y exhibiciones de cocina internacional fusionada con gastronomía peruana.',
 '2025-12-01', '11:00',
 'https://example.com/img7.jpg', 'publico',
 'Parque de la Amistad', '-12.1440', '-76.9890',
 'Lima', 'Surco', 'https://maps.google.com/7', 'https://example.com/resource7', TRUE, 26);


-- Juan crea el evento Tech Conference (organizador)
INSERT INTO Participacion (fecha_registro, rol_evento, usuario_id, evento_id)
VALUES ('2025-09-15', 'organizador', 1, 1);

-- María participa como asistente en Tech Conference
INSERT INTO Participacion (fecha_registro, rol_evento, usuario_id, evento_id)
VALUES ('2025-09-20', 'asistente', 2, 1);

-- Admin supervisa como coorganizador del Concierto
INSERT INTO Participacion (fecha_registro, rol_evento, usuario_id, evento_id)
VALUES ('2025-09-22', 'coorganizador', 3, 2);

-- Juan invita a María al Taller
INSERT INTO Invitacion (estado, mensaje, fecha_invitacion, organizador_id, invitado_id, evento_id)
VALUES ('pendiente', 'Hola María, te invito a mi taller.', '2025-09-25', 1, 2, 3);


-- María guarda el evento Concierto Rock Fest
INSERT INTO EventosGuardado (usuario_id, evento_id)
VALUES (2, 2);

-- Admin guarda Tech Conference
INSERT INTO EventosGuardado (usuario_id, evento_id)
VALUES (3, 1);


-- María comenta en Tech Conference
INSERT INTO ComentarioEvento (mensaje, likes, dislikes, usuario_id, evento_id)
VALUES ('¡Muy interesante el tema de innovación!', 10, 0, 2, 1);

-- Juan comenta en Concierto Rock Fest
INSERT INTO ComentarioEvento (mensaje, likes, dislikes, usuario_id, evento_id)
VALUES ('Se viene con todo este concierto', 5, 1, 1, 2);


-- OPCIONALLLL

-- ========================
-- OPCIONAL: Refresh Tokens
-- (solo si implementas sesiones largas)
-- ========================
CREATE TABLE RefreshToken (
    token_id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    token VARCHAR(500) NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion DATETIME NOT NULL,
    valido BOOL DEFAULT TRUE,
    FOREIGN KEY (usuario_id) REFERENCES Usuario(usuario_id)
);