-- ============================================================
-- MIGRACIÓN 104-A: PRIMER PASO — Solo agregar el valor al ENUM
-- ⚠️ EJECUTAR ESTE SCRIPT PRIMERO Y SOLO ESTE.
-- Luego ejecutar 104_b_rol_developer_setup.sql
-- ============================================================

ALTER TYPE rol_usuario ADD VALUE IF NOT EXISTS 'developer';
