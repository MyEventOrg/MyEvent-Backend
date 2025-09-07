-- Crear la base de datos en SQL Server
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'MyEvent')
BEGIN
    CREATE DATABASE MyEvent;
END
GO

USE MyEvent;
GO

CREATE TABLE Usuario (
    idUsuario INT PRIMARY KEY IDENTITY(1,1),
    nombreCompleto VARCHAR(100) NOT NULL,
    correo VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, 
    fechaRegistro DATETIME DEFAULT GETDATE(),
    activo BIT DEFAULT 1
);

CREATE TABLE Ubicacion (
    idUbicacion INT PRIMARY KEY IDENTITY(1,1),
    direccion VARCHAR(255) NOT NULL,       
    ciudad VARCHAR(100) NULL,              
    pais VARCHAR(100) NULL, 
    distrito VARCHAR(100) NULL,
    latitud DECIMAL(9,6) NULL,             
    longitud DECIMAL(9,6) NULL,             
    urlMapa AS 
        ('https://www.google.com/maps/search/?api=1&query=' 
         + CAST(latitud AS VARCHAR(20)) + ',' + CAST(longitud AS VARCHAR(20))) 
        PERSISTED  
);

CREATE TABLE Evento (
    idEvento INT PRIMARY KEY IDENTITY(1,1),
    titulo VARCHAR(150) NOT NULL,
    descripcion VARCHAR(MAX),
    fechaHora DATETIME DEFAULT GETDATE(),
    imagen VARCHAR(255),
    estado BIT DEFAULT 1,     
    tipo VARCHAR(20) CHECK (tipo IN ('Publico','Privado')),
    idOrganizador INT NOT NULL,
    idUbicacion INT NULL,
    FOREIGN KEY (idOrganizador) REFERENCES Usuario(idUsuario),
    FOREIGN KEY (idUbicacion) REFERENCES Ubicacion(idUbicacion)
);

CREATE TABLE Participacion (
    idParticipacion INT PRIMARY KEY IDENTITY(1,1),
    idEvento INT NOT NULL,
    idUsuario INT NOT NULL,
    asistencia BIT DEFAULT 1,
    fechaRegistro DATETIME DEFAULT GETDATE(),
    UNIQUE (idEvento, idUsuario),
    FOREIGN KEY (idEvento) REFERENCES Evento(idEvento),
    FOREIGN KEY (idUsuario) REFERENCES Usuario(idUsuario)
);

CREATE TABLE Invitacion (
    idInvitacion INT PRIMARY KEY IDENTITY(1,1),
    estado VARCHAR(20) DEFAULT 'Pendiente', 
    confirmacion BIT DEFAULT 0,
    idEvento INT NOT NULL,
    idUsuario INT NOT NULL,
    fechaInvitacion DATETIME DEFAULT GETDATE(),
    UNIQUE (idEvento, idUsuario),
    FOREIGN KEY (idEvento) REFERENCES Evento(idEvento),
    FOREIGN KEY (idUsuario) REFERENCES Usuario(idUsuario)
);

CREATE TABLE Notificacion (
    idNotificacion INT PRIMARY KEY IDENTITY(1,1),
    mensaje VARCHAR(MAX) NOT NULL,
    fechaHora DATETIME DEFAULT GETDATE(),
    leida BIT DEFAULT 0,
    emisor INT NOT NULL,         
    receptor INT NOT NULL,       
    idEvento INT NULL,                
    idInvitacion INT NULL,           
    FOREIGN KEY (emisor) REFERENCES Usuario(idUsuario),
    FOREIGN KEY (receptor) REFERENCES Usuario(idUsuario),
    FOREIGN KEY (idEvento) REFERENCES Evento(idEvento),
    FOREIGN KEY (idInvitacion) REFERENCES Invitacion(idInvitacion)
);

CREATE TABLE Favorito (
    idFavorito INT PRIMARY KEY IDENTITY(1,1),
    idEvento INT NOT NULL,
    idUsuario INT NOT NULL,
    fechaGuardado DATETIME DEFAULT GETDATE(),
    UNIQUE (idEvento, idUsuario),
    FOREIGN KEY (idEvento) REFERENCES Evento(idEvento),
    FOREIGN KEY (idUsuario) REFERENCES Usuario(idUsuario)
);

-- Insertar usuarios
INSERT INTO Usuario (nombreCompleto, correo, password, activo)
VALUES 
 ('Carlos P�rez', 'carlos@example.com', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 1),
 ('Mar�a G�mez',  'maria@example.com',  '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 1),
 ('Camila Soto',  'camila@example.com', '2c9341ca4cf3d87b9e4f92595f2a0d5aa9cce7a16ad2d2f6c6b1e9b7d7f9f56e', 1);

 INSERT INTO Usuario (nombreCompleto, correo, password, activo)
 VALUES
 ('Tregear perez',  'tregear@example.com', 'tregearhash', 1);

-- Insertar ubicaciones
INSERT INTO Ubicacion (direccion, ciudad, pais, distrito, latitud, longitud)
VALUES
('Av. Javier Prado Este 4200, San Borja', 'Lima', 'Per�', 'Los olivos', -12.0987, -77.0012),
('Calle 50 #40-20', 'Medell�n', 'Colombia', 'La molina', 6.2518, -75.5636),
('tomas valle 1530', 'Lima', 'Per�', 'Surco', -12.011012071279906, -77.07531262274415);

-- Carlos crea evento p�blico en ubicaci�n 1
INSERT INTO Evento (titulo, descripcion, imagen, estado, tipo, idOrganizador, idUbicacion)
VALUES ('event carlos', 'hola soy carlos', 'carlos.png', 1, 'Publico', 1, 1);

-- Mar�a crea evento privado en ubicaci�n 2
INSERT INTO Evento (titulo, descripcion, imagen, estado, tipo, idOrganizador, idUbicacion)
VALUES ('event maria', 'hola soy maria', 'maria.jpg', 1, 'Privado', 2, 2);

-- camila crea otro evento publico en ubic 3
INSERT INTO Evento (titulo, descripcion, imagen, estado, tipo, idOrganizador, idUbicacion)
VALUES ('event camila', 'hola soy camila', 'amila.jpg', 1, 'Publico', 3, 3);

-- Carlos se inscribe al evento id = 2 -->>evento de maria
INSERT INTO Participacion (idUsuario, idEvento)
VALUES (1, 2);

-- tregear se inscribe al evento de carlos
INSERT INTO Participacion (idUsuario, idEvento)
VALUES (4, 1);

-- Mar�a se inscribe al evento id= 3 ->> evento de camila
INSERT INTO Participacion (idUsuario, idEvento)
VALUES (2, 3);

-- Camila se inscribe al evento de carlos ->> evento de carlos
INSERT INTO Participacion (idUsuario, idEvento)
VALUES (3, 1);


-- Carlos invita a Mar�a a su evento
DECLARE @Inv1 INT;
INSERT INTO Invitacion (estado, confirmacion, idEvento, idUsuario)
VALUES ('Pendiente', 0, 1, 2);
SET @Inv1 = SCOPE_IDENTITY();

INSERT INTO Notificacion (mensaje, emisor, receptor, idEvento, idInvitacion)
VALUES ('Carlos te ha invitado a su evento documental', 1, 2, 1, @Inv1);


-- Mar�a invita a Carlos a su evento
DECLARE @Inv2 INT;
INSERT INTO Invitacion (estado, confirmacion, idEvento, idUsuario)
VALUES ('Pendiente', 0, 2, 1);
SET @Inv2 = SCOPE_IDENTITY();

INSERT INTO Notificacion (mensaje, emisor, receptor, idEvento, idInvitacion)
VALUES ('Mar�a te ha invitado a su evento privado', 2, 1, 2, @Inv2);


-- Camila invita a Mar�a a su evento
DECLARE @Inv3 INT;
INSERT INTO Invitacion (estado, confirmacion, idEvento, idUsuario)
VALUES ('Pendiente', 0, 3, 2);
SET @Inv3 = SCOPE_IDENTITY();

INSERT INTO Notificacion (mensaje, emisor, receptor, idEvento, idInvitacion)
VALUES ('Camila te ha invitado a su evento', 3, 2, 3, @Inv3);


-- Carlos guarda en favoritos el evento de maria
INSERT INTO Favorito (idUsuario, idEvento)
VALUES (1, 2);

-- Carlos guarda en favoritos el evento de camila
INSERT INTO Favorito (idUsuario, idEvento)
VALUES (1, 3);

-- Mar�a guarda en favoritos el evento de camila
INSERT INTO Favorito (idUsuario, idEvento)
VALUES (2, 3);

SELECT * FROM Usuario;
SELECT * FROM Ubicacion;
SELECT * FROM Participacion;
SELECT * FROM Favorito;
SELECT * FROM Evento;
SELECT * FROM Invitacion;
SELECT * FROM Notificacion;

--eventos con su organizador y su ubicacion
SELECT e.idEvento, e.titulo, e.tipo, e.estado, e.fechaHora, 
       u.nombreCompleto AS organizador,
       ub.direccion AS direccionUbicacion, ub.urlMapa
FROM Evento e
JOIN Usuario u ON e.idOrganizador = u.idUsuario
LEFT JOIN Ubicacion ub ON e.idUbicacion = ub.idUbicacion
ORDER BY e.idEvento;

--inscripciones a eventos
SELECT p.idParticipacion, u.nombreCompleto AS participante, e.titulo AS evento, 
       p.asistencia, p.fechaRegistro
FROM Participacion p
JOIN Usuario u ON p.idUsuario = u.idUsuario
JOIN Evento e ON p.idEvento = e.idEvento
ORDER BY p.idParticipacion;

--inscripcion a evetno de carlos
SELECT 
    p.idParticipacion,
    u.nombreCompleto AS Participante,
    p.asistencia,
    p.fechaRegistro
FROM Participacion p
JOIN Usuario u ON p.idUsuario = u.idUsuario
WHERE p.idEvento = 1;