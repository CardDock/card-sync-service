# Diseño: inyección de dependencias del módulo de importación

## Problema

`POST /api/v1/card-imports` falla al ejecutar `StartCardImportUseCase` porque
NestJS crea el caso de uso sin metadatos de inyección de dependencias. Por eso
`processRepository` llega como `undefined` y la llamada a
`acquireActiveLock()` lanza un `TypeError`.

## Solución aprobada

Marcar con `@Injectable()` los tres casos de uso del módulo:

- `StartCardImportUseCase`
- `RunCardImportUseCase`
- `GetCardImportStatusUseCase`

Esto habilita a NestJS a leer los tipos de los constructores y resolver los
providers existentes para los puertos abstractos. Los providers explícitos de
los puertos en `CardImportModule` no cambian, ni tampoco los contratos,
controladores, flujo de importación o persistencia.

## Manejo de errores

No se modifica el manejo de errores. Una vez resuelta la dependencia, los
errores de MongoDB y los conflictos de importación continúan propagándose por
los filtros estándar de NestJS.

## Validación

La validación se limitará a comprobar que el cambio no altera la compilación
ni el comportamiento existente. No se añadirán pruebas en esta iteración, de
acuerdo con el alcance solicitado.
