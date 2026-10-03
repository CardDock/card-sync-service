# Importación asíncrona de cartas en MongoDB

## Propósito

El bounded context `card-import` importa el contenido de `data/cards.json` en la base de datos MongoDB `yugioh-cards`. Está aislado del contexto de cartas existente y no depende de PostgreSQL, SQLite, Prisma ni de sus repositorios.

La importación está diseñada para procesar desde unas pocas cartas hasta miles de documentos sin mantener abierta la petición HTTP durante todo el trabajo.

## API

### Iniciar una importación

`POST /api/v1/card-imports`

Devuelve `202 Accepted` inmediatamente con el identificador y el estado inicial del proceso. El trabajo se ejecuta de forma asíncrona dentro del proceso de la aplicación.

Si ya existe una importación activa, devuelve `409 Conflict`. Solo se permite una importación activa a la vez.

### Consultar el estado

`GET /api/v1/card-imports/:processId`

Devuelve el estado persistido del proceso:

- `PENDING`: proceso creado y pendiente de ejecución.
- `RUNNING`: lectura y persistencia en curso.
- `COMPLETED`: todas las cartas fueron procesadas.
- `FAILED`: el proceso terminó con un error.

También informa de los contadores `total`, `processed`, `succeeded` y `failed`, además de las fechas de creación, inicio y finalización. Un identificador inexistente devuelve `404 Not Found`.

## Arquitectura

El contexto sigue un modelo hexagonal:

- **Dominio**: `ImportProcess` representa el proceso de importación y controla sus transiciones y contadores.
- **Aplicación**: los casos de uso coordinan el inicio, la ejecución y la consulta del proceso mediante puertos.
- **Adaptadores de entrada**: `CardImportController` expone los endpoints HTTP.
- **Adaptadores de salida**: el lector de archivo, los repositorios MongoDB y el worker en memoria implementan los puertos de aplicación.
- **Composición**: `CardImportModule` conecta los puertos con sus implementaciones concretas.

El dominio y los casos de uso no conocen NestJS, MongoDB ni detalles HTTP.

## Casos de uso

### StartCardImportUseCase

Crea un proceso con un identificador único, adquiere el bloqueo de importación activa, persiste el proceso y lo entrega al worker. Si el bloqueo ya está ocupado, informa a la capa HTTP para devolver `409 Conflict`.

### RunCardImportUseCase

Ejecuta el proceso fuera de la petición HTTP. Lee el archivo fuente, registra el total, persiste las cartas en lotes mediante upsert y actualiza el progreso después de cada lote. Al terminar marca el proceso como completado o fallido y libera el bloqueo.

### GetCardImportStatusUseCase

Recupera el estado de un proceso por su identificador y devuelve una representación preparada para la API.

## Dominio

`ImportProcess` es el agregado del contexto. Su raíz controla:

- Las transiciones válidas entre estados.
- Los contadores de progreso.
- Las fechas de ciclo de vida.
- El error final cuando la ejecución falla.

No se modela la carta como agregado de este contexto: la importación trata cada documento de entrada como una unidad de persistencia y conserva su estructura original.

## Persistencia MongoDB

Se utilizan tres colecciones:

- `cards`: documentos completos de `cards.json`; el campo `id` de la fuente se usa como `_id` numérico para garantizar upsert idempotente.
- `card_import_processes`: estado y progreso de cada proceso.
- `card_import_locks`: documento singleton que impide dos importaciones simultáneas.

La conexión se configura mediante `MONGODB_URI` y la base de datos mediante `MONGODB_DATABASE`. Docker utiliza `yugioh-cards` como base de datos.

## Ciclo de vida operativo

1. Un cliente llama al endpoint de inicio.
2. La API registra el proceso y devuelve su identificador.
3. El worker comienza la ejecución en segundo plano.
4. El cliente consulta periódicamente el endpoint de estado.
5. El proceso actualiza sus contadores durante la importación.
6. El proceso termina en `COMPLETED` o `FAILED` y queda consultable.

El worker actual es local al proceso NestJS. Si la aplicación se reinicia, el trabajo en memoria no se reanuda automáticamente; el puerto `ImportWorkerPort` permite sustituirlo posteriormente por una cola duradera sin mover las reglas de dominio ni los casos de uso.

## Configuración y alcance actual

Esta entrega no incluye autenticación específica del endpoint, reanudación de procesos interrumpidos, reintentos por carta ni tests, según el alcance solicitado. La colección y los documentos se preparan para que esas capacidades puedan añadirse en una evolución posterior.