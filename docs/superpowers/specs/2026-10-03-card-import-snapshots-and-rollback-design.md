# Diseño: snapshots históricos y rollback de importaciones de cartas

## Objetivo

Actualizar el bounded context `card-import` para que una importación normal descargue
las cartas desde YGOPRODeck, conserve una copia histórica completa en el servidor y
importe esa misma copia en MongoDB. Los snapshots deben permitir recuperar una
importación anterior sin volver a depender de la API externa.

El cambio queda limitado a `src/context/card-import`. No reutiliza ni modifica los
adaptadores SQLite, PostgreSQL o Prisma del contexto `card`.

## Requisitos y decisiones

- La URL por defecto es `https://db.ygoprodeck.com/api/v7/cardinfo.php` y se puede
  cambiar con `YGOPRODECK_API_BASE_URL`.
- Cada sincronización crea un fichero nuevo e inmutable bajo
  `data/card-snapshots/`.
- `data/cards.json` representa el último snapshot publicado y se actualiza mediante
  reemplazo atómico.
- El snapshot es autocontenido y conserva `migrationDate`, `sourceUrl` y `data`.
- La descarga, lectura y migración funcionan en streaming: no se usa
  `response.json()`, `JSON.parse` sobre el documento completo ni un array de 200 MB
  en memoria.
- Los lotes de escritura en Mongo siguen limitados, inicialmente a 100 cartas.
- Solo puede existir una sincronización o restauración activa.
- Los snapshots históricos no se eliminan automáticamente.
- Un fallo antes de publicar el snapshot no altera `cards.json` ni Mongo.
- Un fallo durante Mongo marca el proceso como `FAILED`; no se presenta una
  restauración parcial como completada.

## API

Se conservan:

- `POST /api/v1/card-imports`: inicia una descarga e importación normal y devuelve
  `202 Accepted` con el estado inicial.
- `GET /api/v1/card-imports/:processId`: consulta el estado del proceso.

Se añaden:

- `GET /api/v1/card-imports/snapshots`: lista snapshots disponibles con
  identificador, fecha de migración, URL de origen y tamaño.
- `POST /api/v1/card-imports/rollback`: recibe el identificador de un snapshot
  existente e inicia una importación desde ese fichero. No llama a YGOPRODeck.

El rollback usa el mismo proceso asíncrono, lock, contadores, lotes Mongo y estado
de errores que la sincronización normal. El identificador se trata como nombre
lógico validado por el adaptador; nunca se concatena directamente una ruta recibida
por HTTP sin impedir traversal fuera de `data/card-snapshots`.

## Arquitectura hexagonal

### Dominio

Se conserva `ImportProcess` y se amplía el estado persistido con el tipo de
operación (`SYNC` o `ROLLBACK`) y el snapshot seleccionado, cuando corresponda.
El dominio no conoce URLs, rutas, streams ni Mongo.

### Puertos de aplicación

- `CardSourcePort`: descarga y crea un snapshot, devolviendo una referencia
  preparada para lectura.
- `SnapshotReaderPort`: expone metadatos y un `AsyncIterable<ImportableCard>` para
  leer `data.*` incrementalmente.
- `SnapshotRepositoryPort`: publica snapshots, mantiene `cards.json` y lista/
  resuelve snapshots históricos.
- `CardRepositoryPort`: conserva `upsertMany` por lotes.
- `ImportProcessRepositoryPort` y `ImportWorkerPort`: mantienen el ciclo asíncrono
  actual.

Los casos de uso orquestan puertos. No importan módulos de infraestructura ni
dependen de Node `fs`, `fetch` o el driver de Mongo.

### Adaptadores

- **YGOPRODeck HTTP adapter**: realiza la petición HTTP, valida estado y formato
  raíz, y escribe el cuerpo en un temporal mediante streams.
- **Snapshot filesystem adapter**: genera el envelope JSON con metadatos, valida y
  publica archivos con temporales y `rename`; lee cartas con un parser JSON
  incremental.
- **Mongo adapter**: usa `bulkWrite` con `ordered: false`, upsert por `_id` igual
  al `id` de la carta y devuelve contadores de éxito/error.
- **Controller/DTOs**: valida rollback y traduce conflictos, snapshots
  inexistentes y errores de proceso a respuestas HTTP consistentes.

## Flujo de sincronización

1. El controller crea un proceso y adquiere el lock.
2. El worker solicita al adaptador HTTP un snapshot temporal.
3. El adaptador escribe el snapshot fechado y lo publica atómicamente; después
   actualiza `data/cards.json` atómicamente.
4. El caso de uso abre el snapshot publicado y recorre `data.*` carta a carta.
5. Cada grupo de 100 cartas se envía a Mongo y actualiza los contadores.
6. El proceso se guarda como `COMPLETED`; se libera el lock.

Si la descarga o publicación falla, el temporal se elimina y el proceso termina en
`FAILED` sin iniciar la migración. Si falla Mongo, el proceso termina en `FAILED`
y conserva el snapshot completo para poder reintentar o hacer rollback explícito.

## Flujo de rollback

1. El controller valida el identificador del snapshot y crea un proceso `ROLLBACK`.
2. El worker resuelve el fichero dentro de `data/card-snapshots`.
3. El caso de uso lo lee en streaming y hace upsert en Mongo por los mismos lotes.
4. Solo después de completar Mongo, el snapshot seleccionado se publica como
   `data/cards.json`.
5. El proceso termina en `COMPLETED` y se libera el lock.

El snapshot histórico no se modifica. Si Mongo falla, `cards.json` conserva la
versión previamente publicada.

## Formato de snapshot

```json
{
  "migrationDate": "2026-10-03T13:57:43.731Z",
  "sourceUrl": "https://db.ygoprodeck.com/api/v7/cardinfo.php",
  "data": [ "... cartas YGOPRODeck ..." ]
}
```

Los valores de `data` no se cargan completos en memoria durante la lectura. La
serialización/publicación debe producir JSON válido incluso cuando la descarga
contiene cientos de megabytes.

## Configuración y operación

`.env.example` documentará:

- `MONGODB_URI`
- `MONGODB_DATABASE`
- `YGOPRODECK_API_BASE_URL`
- `CARD_IMPORT_DATA_DIRECTORY` opcional, con `data` como valor por defecto

El directorio de snapshots debe existir o crearse de forma segura al publicar. Los
ficheros temporales usarán nombres no predecibles y se limpiarán en errores.

## Pruebas y documentación

Se añadirán pruebas unitarias para:

- respuesta HTTP no exitosa, stream truncado y JSON raíz inválido;
- escritura atómica y conservación de snapshots anteriores;
- lectura incremental sin requerir el documento completo;
- listado y resolución segura de snapshots;
- sincronización y rollback, incluyendo fallos antes y durante Mongo;
- conflicto cuando ya existe una operación activa.

Se actualizará la documentación del contexto y la colección Postman con los
endpoints y variables nuevos. La validación final cubrirá las suites unitarias,
lint y build.
