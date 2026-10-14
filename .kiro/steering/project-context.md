---
inclusion: always
---

# Contexto del Proyecto — Sistema de Préstamos de Recursos de Laboratorio

## ¿Qué es este proyecto?

Aplicación web frontend para gestionar el préstamo de recursos (equipos, herramientas, materiales) en un laboratorio universitario. Desarrollada con **React 18 + TypeScript + Vite**. No tiene backend real — toda la persistencia es en `localStorage` con mock data, por restricción académica.

## Ubicación del código

La raíz del proyecto React está en `sistemas-informacion/` (ahí corre `npm run dev`). Los specs están en `.kiro/specs/frontend-sistema-prestamos-laboratorio/` (requirements.md, design.md, tasks.md).

## Stack Tecnológico

React 18 + TypeScript strict + Vite + React Router v6 + React Hook Form + Zod + fast-check + Vitest + @testing-library/react

## Usuarios y Roles

- `Estudiante`: consultar disponibilidad, solicitar préstamos, ver mis préstamos
- `Técnico_Laboratorio`: registrar entregas y devoluciones
- `Administrador_Laboratorio`: todo + gestión de inventario, sanciones, reportes

## Tipos Principales

```typescript
type UserRole = 'Estudiante' | 'Técnico_Laboratorio' | 'Administrador_Laboratorio';
type ResourceStatus = 'Disponible' | 'Reservado' | 'En_Préstamo' | 'En_Mantenimiento' | 'Dado_de_Baja';
type ResourceType = 'Equipo' | 'Herramienta' | 'Material';
type LoanStatus = 'Reservado' | 'En_Préstamo' | 'Devuelto' | 'Cancelado' | 'Vencido';
type ResourceCondition = 'Bueno' | 'Regular' | 'Dañado';
```

## Máquina de Estados de Recursos

Disponible → Reservado (createLoan) → En_Préstamo (registerDelivery) → Disponible (devolución buena) o En_Mantenimiento (devolución dañada) → Disponible o Dado_de_Baja. También: Disponible → Dado_de_Baja directamente por admin.

## Arquitectura

Cuatro capas: Pages → Features (auth/inventory/loans/operations/dashboard) → Infrastructure (contexts/mockDb/router) → Shared (ui/layout/types/utils). Estado con React Context + useReducer sincronizado con localStorage.

## Claves localStorage

Namespace `sistema-prestamos-lab-`: users, resources, loans, status-history, sanctions, session, initialized.

## Rutas

- Públicas: /login, /register
- Todos los roles: /dashboard, /availability
- Estudiante: /loans/new/:id, /loans/my
- Técnico: /deliveries, /returns
- Admin: /inventory, /inventory/new, /inventory/:id/edit, /sanctions [Post-MVP], /reports [Post-MVP]
- Utilitarias: /access-denied, * (404)

## Estado de Implementación

MVP en desarrollo (tareas 1–22 del tasks.md). Post-MVP pendiente (tareas 23–31).

## Reglas de Negocio Clave

1. Préstamo: mínimo 1h, máximo 24h
2. Cancelación: solo hasta 2h antes del inicio
3. Devolución dañada → recurso a En_Mantenimiento (no Disponible)
4. Retraso = max(0, devolucionReal - finProgramada) en horas
5. Sanción [Post-MVP]: demora > 24h → bloqueo por días_demora × 2 días
6. Dar de baja: rechazado si hay préstamos Reservado o En_Préstamo activos
7. Error de login: siempre genérico (no revelar si falla correo o contraseña)

## Convenciones

- Commits en **español**, Conventional Commits, máximo 50 chars en subject
- No usar `any` en TypeScript
- Servicios retornan `OperationResult<T>`, nunca lanzan excepciones
- Tests PBT con fast-check, mínimo 100 iteraciones
- Tag PBT: `// Feature: frontend-sistema-prestamos-laboratorio, Property N`

## Glosario

- **Préstamo**: ciclo completo de uso de un recurso
- **Reserva**: préstamo en estado "Reservado" (no entregado físicamente aún)
- **Entrega**: acto de dar físicamente el recurso → cambia a "En_Préstamo"
- **Devolución**: acto de recibir físicamente el recurso de vuelta
- **Retraso/Demora**: horas extra tras la hora de fin programada
- **Seed data**: datos iniciales en localStorage cargados la primera vez
