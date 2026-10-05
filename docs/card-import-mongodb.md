# Importación asíncrona de cartas en MongoDB

## Propósito

El bounded context `card-import` descarga las cartas de YGOPRODeck, conserva un snapshot histórico y migra ese snapshot a MongoDB `yugioh-cards`. Está aislado del contexto de cartas existente y no depende de PostgreSQL, SQLite, Prisma ni de sus repositorios.

La importación está diseñada para ficheros de cientos de megabytes: descarga y lee el JSON en streaming, por lotes, sin cargarlo completo en memoria.

## API

### Iniciar una importación

`POST /api/v1/card-imports`

Devuelve `202 Accepted` inmediatamente con el identificador y el estado inicial del proceso. El trabajo se ejecuta de forma asíncrona dentro del proceso de la aplicación.

Si ya existe una importación activa, devuelve `409 Conflict`. Solo se permite una importación activa a la vez.

### Listar snapshots

`GET /api/v1/card-imports/snapshots`

Devuelve los snapshots fechados disponibles en `data/card-snapshots`.

### Restaurar un snapshot

`POST /api/v1/card-imports/rollback`

Body:

```json
{ "snapshotId": "cards-2026-10-03T13-57-43-731Z" }
```

Inicia una importación asíncrona desde el fichero histórico, sin llamar a
YGOPRODeck. Al completarse, ese snapshot pasa a ser `data/cards.json`.

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
- **Adaptadores de salida**: el cliente HTTP/snapshot streaming, el repositorio MongoDB y el worker en memoria implementan los puertos de aplicación.
- **Composición**: `CardImportModule` conecta los puertos con sus implementaciones concretas.

El dominio y los casos de uso no conocen NestJS, MongoDB ni detalles HTTP.

## Casos de uso

### StartCardImportUseCase

Crea un proceso con un identificador único, adquiere el bloqueo de importación activa, persiste el proceso y lo entrega al worker. Si el bloqueo ya está ocupado, informa a la capa HTTP para devolver `409 Conflict`.

### RunCardImportUseCase

Ejecuta el proceso fuera de la petición HTTP. En una sincronización descarga y
publica un snapshot fechado; en un rollback abre el snapshot seleccionado. En
ambos casos recorre `data.*` incrementalmente, persiste lotes mediante upsert y
actualiza el progreso después de cada lote. Al terminar marca el proceso como
completado o fallido y libera el bloqueo.

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

La URL de origen se configura mediante `YGOPRODECK_API_BASE_URL` y el directorio
de snapshots mediante `CARD_IMPORT_DATA_DIRECTORY` (por defecto, `data`).

Cada sincronización crea `data/card-snapshots/cards-<timestamp>.json` con
`migrationDate`, `sourceUrl` y `data`. Los snapshots anteriores no se sobrescriben.
`data/cards.json` es una copia atómica del último snapshot publicado.

### Recargar el contenedor Docker

Para probar cambios actuales sin activar el modo desarrollo:

```bash
pnpm run docker:reload
```

El script detiene y elimina únicamente el contenedor `app`, lo reconstruye con
Docker Compose y lo inicia usando el comando de producción configurado en
`docker-compose.yml`. No recrea MongoDB ni elimina sus volúmenes. Requiere que
exista el fichero `.env` en la raíz del proyecto.

## Ciclo de vida operativo

1. Un cliente llama al endpoint de inicio.
2. La API registra el proceso y devuelve su identificador.
3. El worker comienza la ejecución en segundo plano.
4. El cliente consulta periódicamente el endpoint de estado.
5. El proceso actualiza sus contadores durante la importación.
6. El proceso termina en `COMPLETED` o `FAILED` y queda consultable.

El worker actual es local al proceso NestJS. Si la aplicación se reinicia, el trabajo en memoria no se reanuda automáticamente; el puerto `ImportWorkerPort` permite sustituirlo posteriormente por una cola duradera sin mover las reglas de dominio ni los casos de uso.

## Configuración y alcance actual

El worker actual es local al proceso NestJS. Si la aplicación se reinicia, el
trabajo en memoria no se reanuda automáticamente; el puerto `ImportWorkerPort`
permite sustituirlo posteriormente por una cola duradera sin mover las reglas de
dominio ni los casos de uso.

## Bounded context `card-sets`

`card-sets` es un bounded context independiente de `card-import`. No importa
ni reutiliza sus casos de uso, puertos o repositorios. Su responsabilidad es
consultar los sets disponibles para una carta mediante la API de CardTrader y
mantener una caché persistida en MongoDB.

Aunque actualmente ambos contextos viven en la misma aplicación, `card-sets`
dispone de sus propios puertos, adaptadores, caso de uso, controlador y
proveedores de MongoDB. El único dato que lee de la colección `cards` es el
identificador y el nombre de la carta necesarios para realizar la consulta
externa.

### Consultar los sets de una carta

```text
GET /api/v1/card-sets/:cardId
```

Ejemplo:

```bash
curl --location \
  'http://localhost:8080/api/v1/card-sets/17217034'
```

El flujo es:

1. Busca la carta por su identificador en la colección MongoDB `cards`.
2. Obtiene su nombre.
3. Busca una entrada para la carta en `card_sets_cache`.
4. Si la entrada tiene menos de 24 horas, devuelve la respuesta cacheada.
5. Si no existe o tiene 24 horas o más, consulta CardTrader.
6. Si la consulta tiene éxito, actualiza la entrada y su fecha `cachedAt`.
7. Si CardTrader falla y existe una entrada antigua, devuelve esa entrada sin
   modificarla.

La respuesta contiene el identificador, el nombre, la fecha de caché y la
respuesta completa de CardTrader:

```json
{
  "cardId": 17217034,
  "cardName": "Combined Maneuver - Engage Zero!",
  "cachedAt": "2026-10-04T00:01:14.652Z",
  "data": []
}
```

El campo `data` se muestra vacío en el ejemplo, pero contiene los blueprints
devueltos por CardTrader en una respuesta real. La API no indica si los datos
son recientes o proceden de una caché antigua utilizada como fallback.

### Colección de caché

La colección utilizada es:

```text
card_sets_cache
```

Cada carta tiene una única entrada, identificada por su `cardId`:

```json
{
  "_id": 17217034,
  "cardId": 17217034,
  "cardName": "Combined Maneuver - Engage Zero!",
  "response": [],
  "cachedAt": "2026-10-04T00:01:14.652Z"
}
```

La respuesta de CardTrader se conserva sin transformación destructiva. Las
actualizaciones utilizan un upsert para que la renovación de una carta no cree
duplicados.

### Autenticación de CardTrader

CardTrader requiere un token Bearer. El adaptador envía:

```http
Authorization: Bearer <CARDTRADER_API_TOKEN>
```

El token nunca debe escribirse en el código, en Postman ni en un fichero
versionado. Debe configurarse en `.env` o en el gestor de secretos del entorno:

```env
CARDTRADER_API_BASE_URL="https://api.cardtrader.com/api/v2"
CARDTRADER_API_TOKEN="tu-token-de-cardtrader"
```

Si la variable no está configurada, o CardTrader devuelve un error y no existe
una caché previa, el endpoint responde con `502 Bad Gateway`. Si existe una
entrada anterior, se devuelve esa información y no se sobrescribe.

### Configuración de `card-sets`

Variables disponibles:

```env
CARD_SETS_MONGODB_URI="mongodb://localhost:27017"
CARD_SETS_MONGODB_DATABASE="yugioh-cards"
CARD_SETS_CACHE_TTL_HOURS=24
```

En Docker Compose, la URI de MongoDB se sobrescribe para utilizar el nombre del
servicio:

```text
mongodb://mongodb:27017
```

Después de cambiar variables de entorno es necesario recrear o reiniciar la
aplicación para que NestJS vuelva a cargar el token y la configuración.

### Consultar precios de marketplace por blueprint

El mismo bounded context expone una caché separada para los productos de
marketplace asociados a un blueprint de CardTrader:

```text
GET /api/v1/card-sets/prices/:blueprintId
```

Ejemplo:

```bash
curl --location \
  'http://localhost:8080/api/v1/card-sets/prices/380475'
```

El `blueprintId` se recibe directamente del cliente. El flujo no busca una
carta ni depende del bounded context `card`:

1. Busca el blueprint en `card_marketplace_prices_cache`.
2. Si la entrada tiene menos de 24 horas, devuelve la respuesta guardada.
3. Si no existe o está caducada, consulta
   `GET /api/v2/marketplace/products?blueprint_id=<id>` en CardTrader.
4. Si la respuesta es correcta, reemplaza la entrada mediante upsert.
5. Si la renovación falla y ya existía una entrada, devuelve la última
   respuesta sin modificarla.

La antigüedad se controla en la aplicación mediante `cachedAt`. MongoDB no
utiliza un índice TTL, por lo que una entrada caducada no se elimina y puede
servir como fallback:

```json
{
  "blueprintId": 380475,
  "cachedAt": "2026-10-04T00:35:01.198Z",
  "data": []
}
```

`data` conserva el JSON completo devuelto por CardTrader. La colección de
precios es independiente de `card_sets_cache`:

```text
card_marketplace_prices_cache
```
