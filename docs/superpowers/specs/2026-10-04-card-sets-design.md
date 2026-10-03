# Bounded context card-sets: caché de sets de CardTrader

## Estado

Diseño aprobado por el usuario el 2026-10-04. Esta especificación precede al
plan de implementación y no modifica todavía el código de producción.

## Objetivo

Crear el bounded context `card-sets`, independiente de `card-import` y de
`card`, para consultar información de sets de una carta de Yu-Gi-Oh! a través
de CardTrader y reducir las peticiones repetidas mediante una caché persistida
en MongoDB.

El endpoint público será:

```text
GET /api/v1/card-sets/:cardId
```

El `cardId` identifica una carta almacenada en la colección MongoDB `cards`.
El contexto resolverá su nombre, consultará CardTrader usando ese nombre y
guardará la respuesta externa en una colección propia.

## Alcance y límites

### Incluido

- Nuevo bounded context `src/context/card-sets/`.
- Módulo NestJS propio.
- Endpoint `GET /card-sets/:cardId`.
- Lectura del identificador y nombre desde la colección `cards`.
- Cliente HTTP de CardTrader.
- Agregado de dominio para la entrada cacheada.
- Caché MongoDB con una validez de 24 horas.
- Fallback a la caché antigua cuando CardTrader no responde.
- Pruebas unitarias de dominio, caso de uso, adaptadores y controlador según
  los patrones del proyecto.
- Configuración específica de MongoDB y CardTrader.

### Excluido

- Cualquier modificación a `src/context/card/`.
- Reutilización de puertos, casos de uso, agregados o repositorios de `card`.
- Reutilización de puertos, casos de uso o repositorios de `card-import`.
- Cambios en la lógica de importación de cartas.
- Cambios en PostgreSQL, Prisma o SQLite.
- Transformación o normalización del modelo de CardTrader más allá de guardar y
  devolver su respuesta.
- Invalidación manual, refresco administrativo o precarga masiva.
- Indicación pública de que una respuesta procede de una caché caducada.
- Actualización de la documentación general de `card-import`; se hará después
  de aprobar y completar la implementación.

## Independencia entre bounded contexts

`card-sets` será un módulo y contexto de dominio independiente. No importará
`CardImportModule`, ninguna clase de `card-import` ni ninguna clase de
`card`.

El único acoplamiento operativo será la colección MongoDB `cards`, que contiene
los documentos de carta necesarios para resolver `cardId` a `name`. Ese acceso
se implementará mediante un adaptador propio de `card-sets`, con su propio
puerto. No se reutilizará el `CardRepositoryPort` existente ni ningún otro
repositorio anterior.

`card-sets` tendrá sus propios tokens y proveedor de conexión MongoDB para que
un cambio futuro de nombre o de implementación de `card-import` no afecte a
este contexto.

## Arquitectura

### Dominio

El agregado raíz será `CardSetCache`.

Responsabilidades:

- Representar la identidad `cardId` de la carta.
- Conservar el nombre resuelto de la carta.
- Conservar la respuesta recibida de CardTrader.
- Conservar `cachedAt`.
- Determinar si la caché ha superado la ventana de 24 horas.
- Exponer una representación segura para los adaptadores.

El agregado no conocerá MongoDB, NestJS, HTTP ni variables de entorno.

La ventana de validez se expresará mediante una dependencia de tiempo
inyectable en el caso de uso o mediante una fecha recibida explícitamente, para
que las pruebas no dependan del reloj real.

### Aplicación

El caso de uso principal será:

```text
GetCardSetsUseCase
```

Puertos propios:

```text
CardReaderPort
CardSetCacheRepositoryPort
CardTraderSourcePort
```

Responsabilidades de los puertos:

- `CardReaderPort`: obtener una carta mínima por `cardId`, al menos su
  identificador y nombre.
- `CardSetCacheRepositoryPort`: buscar y guardar una entrada de caché.
- `CardTraderSourcePort`: consultar CardTrader y devolver su respuesta
  estructurada como un valor externo sin detalles de transporte.

El caso de uso coordinará los puertos con este flujo:

1. Validar que `cardId` sea numérico y positivo.
2. Buscar la carta mediante `CardReaderPort`.
3. Si no existe, producir un error de carta no encontrada.
4. Buscar la entrada mediante `CardSetCacheRepositoryPort`.
5. Si la entrada existe y tiene como máximo 24 horas, devolverla.
6. Si no existe o está caducada, consultar CardTrader con el nombre de la
   carta.
7. Si la consulta tiene éxito, crear o actualizar la entrada con un nuevo
   `cachedAt` y persistirla.
8. Si CardTrader falla y existe una entrada previa, devolver la entrada previa
   sin modificarla.
9. Si CardTrader falla y no existe caché, propagar un error de dependencia
   externa para que el adaptador HTTP produzca un error apropiado.

El caso de uso no añadirá campos como `stale` a la respuesta pública.

### Adaptadores de entrada

`CardSetsController` expondrá:

```text
GET /card-sets/:cardId
```

Conversión de errores:

- `400 Bad Request`: identificador no numérico, no entero o no positivo.
- `404 Not Found`: no existe una carta con ese identificador en `cards`.
- `502 Bad Gateway` o el error estándar equivalente del proyecto: no existe
  caché y CardTrader no está disponible o devuelve una respuesta inválida.
- `200 OK`: respuesta nueva o respuesta cacheada, incluyendo una caché antigua
  usada como fallback.

El controlador solo traducirá errores de aplicación a HTTP. No resolverá
cartas, decidirá la caducidad ni realizará peticiones externas.

### Adaptadores de salida

#### MongoDB: cartas importadas

`MongoDbCardReaderAdapter` consultará la colección `cards` por el identificador
que utiliza el importador. La implementación debe soportar el formato actual,
en el que la carta se guarda con `_id` numérico, y devolver únicamente los
campos necesarios para el caso de uso.

#### MongoDB: caché

`MongoDbCardSetCacheRepositoryAdapter` utilizará la colección:

```text
card_sets_cache
```

El documento tendrá esta forma lógica:

```json
{
  "_id": 80181649,
  "cardId": 80181649,
  "cardName": "A Case for K9",
  "response": {},
  "cachedAt": "2026-10-04T00:35:01.198Z"
}
```

`_id` será igual a `cardId`, garantizando una entrada única. La escritura será
un upsert por carta. Los datos de CardTrader se conservarán sin una
transformación destructiva.

La colección deberá tener un índice único sobre la identidad de la carta si la
implementación usa un campo distinto de `_id`; si usa `_id`, la unicidad queda
garantizada por MongoDB.

#### HTTP: CardTrader

`CardTraderHttpAdapter` construirá la petición mediante `URL` y
`URLSearchParams`, evitando concatenar manualmente el nombre:

```text
https://api.cardtrader.com/api/v2/blueprints?name=<encoded-name>&game=yugioh
```

El nombre se enviará como el valor original de `cards.name`, sin añadir
comillas al parámetro. El adaptador:

- comprobará el status HTTP;
- comprobará que la respuesta pueda interpretarse como JSON;
- devolverá el cuerpo externo sin acoplar el dominio a `fetch`;
- producirá un error explícito ante respuestas no válidas;
- respetará una configuración de URL base para pruebas y despliegues.

No se incorporará autenticación ni reintentos automáticos hasta que exista un
requisito específico de CardTrader para ello.

## Caché y concurrencia

La validez será de 24 horas desde `cachedAt`. Una entrada exactamente en el
límite se considerará caducada para evitar servir información antigua más allá
de la ventana configurada.

El caso de uso solo persistirá una respuesta nueva cuando CardTrader haya
respondido correctamente. Un fallo de CardTrader nunca sobrescribirá ni
eliminará una caché existente.

La primera implementación mantendrá la coordinación dentro de una única
petición y usará el upsert de MongoDB como operación idempotente. No se
introducirá todavía un sistema distribuido de locks o leases; si el despliegue
requiere múltiples instancias y se observan peticiones simultáneas duplicadas,
se podrá añadir posteriormente como una evolución aislada del repositorio.

## Configuración

Se añadirá una variable para la URL de CardTrader, con valor por defecto:

```text
CARDTRADER_API_BASE_URL=https://api.cardtrader.com/api/v2
```

El nombre de la base de datos y la URI de MongoDB serán configuración propia de
`card-sets`, con valores por defecto compatibles con el entorno actual si no
se requiere una base separada:

```text
CARD_SETS_MONGODB_URI=mongodb://localhost:27017
CARD_SETS_MONGODB_DATABASE=yugioh-cards
CARD_SETS_CACHE_TTL_HOURS=24
```

La TTL se mantendrá configurable, pero el valor por defecto y el contrato
inicial serán 24 horas.

## Contrato de respuesta

Una respuesta exitosa devolverá la información de CardTrader junto con la
fecha de caché necesaria para conocer cuándo se guardó la información. El
formato exacto conservará el cuerpo externo y añadirá metadatos de caché sin
exponer estados internos de fallback.

La implementación deberá fijar un único formato de respuesta antes de crear
las pruebas de controlador. Como mínimo incluirá:

```json
{
  "cardId": 80181649,
  "cardName": "A Case for K9",
  "cachedAt": "2026-10-04T00:35:01.198Z",
  "data": []
}
```

`cachedAt` indicará cuándo se guardó la respuesta actualmente devuelta. Si se
usa una caché antigua por error externo, conservará su fecha original.

## Pruebas

### Dominio

- Una caché reciente se considera válida.
- Una caché en el límite de 24 horas se considera caducada.
- Una caché con fecha posterior al límite se considera caducada.
- La representación conserva `cardId`, nombre, respuesta y fecha.

### Caso de uso

- Rechaza identificadores inválidos.
- Devuelve error cuando no existe la carta.
- Devuelve una caché reciente sin llamar a CardTrader.
- Consulta CardTrader cuando no existe caché.
- Consulta CardTrader cuando la caché está caducada.
- Guarda una respuesta correcta con un nuevo `cachedAt`.
- Devuelve la caché antigua cuando CardTrader falla.
- No guarda ni modifica la caché cuando CardTrader falla.
- Devuelve error cuando CardTrader falla y no existe caché.

### Adaptadores

- El lector MongoDB usa el `_id` numérico esperado.
- El repositorio hace upsert por `cardId`.
- El cliente construye correctamente la URL y codifica nombres especiales.
- El cliente rechaza statuses HTTP no exitosos y JSON inválido.

### Controlador

- Expone `GET /card-sets/:cardId`.
- Traduce validaciones a `400`.
- Traduce carta inexistente a `404`.
- Devuelve `200` tanto para datos nuevos como para caché antigua de fallback.
- Traduce el fallo sin caché a un error de gateway.

## Criterios de aceptación

1. Una petición para una carta existente sin caché consulta CardTrader, guarda
   la respuesta en `card_sets_cache` y devuelve `cachedAt`.
2. Una segunda petición durante las siguientes 24 horas no consulta
   CardTrader.
3. Después de 24 horas, una petición consulta CardTrader y actualiza la misma
   entrada de MongoDB.
4. Si la renovación falla, la respuesta devuelve la entrada previa y la fecha
   previa, sin modificar MongoDB.
5. Una carta inexistente produce `404`.
6. No se modifica ni importa código de `src/context/card/`.
7. `card-sets` no depende de clases de `card-import` ni de sus puertos.
8. Los casos de uso y el dominio pueden probarse sin MongoDB ni llamadas HTTP
   reales.
