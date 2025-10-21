-- Script de inicialización de la base de datos Asistia
-- Este script se ejecuta automáticamente cuando se crea el contenedor

-- Crear extensión para UUIDs (útil para IDs únicos)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear tabla de usuarios del sistema
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'operador',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de estudiantes
CREATE TABLE IF NOT EXISTS students (
    id VARCHAR(20) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    grupo VARCHAR(50),
    email VARCHAR(255),
    telefono VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de asistencia
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id VARCHAR(20) REFERENCES students(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'Ausente' CHECK (status IN ('Presente', 'Ausente', 'Tarde')),
    attendance_date DATE DEFAULT CURRENT_DATE,
    attendance_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_students_grupo ON students(grupo);

-- Insertar usuarios por defecto
INSERT INTO users (username, password, name, role) VALUES 
('admin', 'admin123', 'Administrador', 'administrador'),
('profesor', 'prof123', 'Profesor', 'profesor'),
('operador', 'oper123', 'Operador', 'operador')
ON CONFLICT (username) DO NOTHING;

-- Insertar estudiantes de ejemplo (basados en el database.json actual)
INSERT INTO students (id, nombre, apellido, grupo) VALUES 
('ALU123', 'María', 'García', 'Grupo A'),
('ALU456', 'Carlos', 'Pérez', 'Grupo B'),
('ALU789', 'Lucía', 'Rodríguez', 'Grupo A')
ON CONFLICT (id) DO NOTHING;

-- Insertar asistencia de ejemplo
INSERT INTO attendance (student_id, status, attendance_date, attendance_time) VALUES 
('ALU123', 'Presente', CURRENT_DATE, CURRENT_TIMESTAMP),
('ALU456', 'Ausente', CURRENT_DATE, CURRENT_TIMESTAMP),
('ALU789', 'Ausente', CURRENT_DATE, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
