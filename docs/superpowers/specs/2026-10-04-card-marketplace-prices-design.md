# Bounded context `card-sets`: caché de precios de marketplace

## Estado

Diseño aprobado por el usuario el 2026-10-04. Esta especificación describe
la ampliación de `card-sets`; no modifica el bounded context `card`.

## Objetivo

Permitir que un cliente consulte los productos de marketplace de CardTrader
para un `blueprint_id` y evitar peticiones repetidas durante 24 horas mediante
una caché persistida en MongoDB.

La URL pública será:

```text
GET /api/v1/card-sets/prices/:blueprintId
```

El `blueprintId` lo proporciona directamente el cliente. No se resolverá
ninguna carta ni se consultará la colección `cards` para este flujo.

## Alcance y límites

### Incluido

- Nuevos componentes dentro de `src/context/card-sets/`.
- Cliente HTTP para:
  `https://api.cardtrader.com/api/v2/marketplace/products?blueprint_id=<id>`.
- Agregado y puerto de caché propios para precios de marketplace.
- Colección MongoDB independiente de `card_sets_cache`.
- Caché de aplicación con TTL lógico configurable de 24 horas.
- Revalidación al superar la TTL y actualización únicamente tras una respuesta
  exitosa de CardTrader.
- Fallback a la última respuesta cacheada si falla una renovación.
- Respuesta con el JSON completo de CardTrader, `blueprintId` y `cachedAt`.
- Pruebas unitarias del dominio, caso de uso, cliente HTTP y controlador.
- Documentación de alto nivel y actualización de la especificación de
  `card-sets`.

### Excluido

- Cualquier modificación a `src/context/card/`.
- Uso de PostgreSQL, Prisma o SQLite.
- Dependencias de clases, puertos o repositorios de `card`.
- Normalización o reducción del JSON de CardTrader.
- Índices TTL de MongoDB o borrado automático de entradas.
- Invalidación manual, refresco administrativo, precarga masiva o locks
  distribuidos.
- Cambios en la caché existente de sets.

## Independencia dentro de `card-sets`

El flujo de precios tendrá sus propios nombres y contratos:

- `CardMarketplacePriceCache`
- `CardMarketplacePriceCacheRepositoryPort`
- `CardTraderMarketplaceSourcePort`
- `GetCardMarketplacePricesUseCase`
- adaptadores HTTP y MongoDB específicos

Podrá compartir el proveedor de MongoDB del bounded context `card-sets`, pero
no reutilizará el agregado, repositorio ni caso de uso de la caché de sets. La
separación de colecciones evitará mezclar sets y precios.

## Flujo de aplicación

1. Validar que `blueprintId` sea un entero positivo.
2. Buscar la entrada por `blueprintId`.
3. Si existe y `cachedAt` está dentro de las 24 horas, devolverla sin llamar a
   CardTrader.
4. Si no existe o está caducada, consultar CardTrader con el blueprint.
5. Si CardTrader responde correctamente, guardar la respuesta completa con un
   nuevo `cachedAt` y devolverla.
6. Si la renovación falla y existe una entrada previa, devolver esa entrada sin
   modificarla.
7. Si la renovación falla y no existe caché, producir un error de dependencia
   externa.

La TTL no será un mecanismo de expiración de MongoDB. Las entradas antiguas se
conservarán para permitir fallback y se reemplazarán mediante upsert cuando una
renovación sea exitosa.

## Dominio

El agregado `CardMarketplacePriceCache` conservará:

```text
blueprintId: number
response: unknown
cachedAt: Date
```

Validará un blueprint positivo y una fecha válida. Su método `isFresh(now,
ttlMs)` tratará una entrada exactamente en el límite como caducada. El
agregado no conocerá MongoDB, NestJS, HTTP ni variables de entorno.

## Adaptadores

### MongoDB

El repositorio utilizará la colección:

```text
card_marketplace_prices_cache
```

El documento lógico será:

```json
{
  "_id": 380475,
  "blueprintId": 380475,
  "response": {},
  "cachedAt": "2026-10-04T00:35:01.198Z"
}
```

`_id` será igual a `blueprintId`, de modo que MongoDB garantice una entrada
única. `save` hará upsert y no eliminará documentos por antigüedad.

### HTTP de CardTrader

El adaptador construirá la URL con `URL` y `URLSearchParams`, estableciendo el
parámetro `blueprint_id`. Comprobará el status HTTP y que el cuerpo sea JSON
válido. La respuesta se devolverá sin transformación destructiva.

La autenticación usará `CARDTRADER_API_TOKEN` y el encabezado Bearer configurado
por el adaptador existente. La URL base seguirá siendo configurable mediante
`CARDTRADER_API_BASE_URL`, con valor por defecto
`https://api.cardtrader.com/api/v2`. No se añadirán reintentos automáticos.

## Contrato HTTP

Respuesta exitosa:

```json
{
  "blueprintId": 380475,
  "cachedAt": "2026-10-04T00:35:01.198Z",
  "data": {}
}
```

`data` contendrá el cuerpo completo de
`/marketplace/products?blueprint_id=380475`. `cachedAt` será la fecha de la
respuesta actualmente devuelta, incluida una entrada antigua usada como
fallback.

Errores:

- `400 Bad Request`: blueprint inválido.
- `502 Bad Gateway`: CardTrader no está disponible, devuelve un status no
  exitoso o un JSON inválido cuando no existe una caché previa.
- `200 OK`: respuesta nueva, fresca o antigua usada como fallback.

## Configuración

Se reutilizará la configuración de CardTrader y MongoDB específica de
`card-sets`:

```env
CARDTRADER_API_BASE_URL="https://api.cardtrader.com/api/v2"
CARDTRADER_API_TOKEN="tu-token-de-cardtrader"
CARD_SETS_MONGODB_URI="mongodb://localhost:27017"
CARD_SETS_MONGODB_DATABASE="yugioh-cards"
CARD_SETS_CACHE_TTL_HOURS=24
```

`CARD_SETS_CACHE_TTL_HOURS` se aplicará también a precios. No se añadirá una
configuración de expiración de MongoDB.

## Pruebas

- El dominio valida el blueprint y determina correctamente frescura y límite.
- El caso de uso devuelve una caché fresca sin llamar a CardTrader.
- El caso de uso consulta y persiste cuando no existe caché.
- Una caché caducada se renueva y actualiza tras una respuesta exitosa.
- Una renovación fallida devuelve la caché anterior sin guardarla de nuevo.
- Un fallo sin caché se traduce en error de CardTrader.
- El cliente codifica correctamente `blueprint_id`, token, status y JSON.
- El repositorio hace upsert en `card_marketplace_prices_cache`.
- El controlador traduce los errores a `400`, `502` y respuestas exitosas.

## Criterios de aceptación

1. `GET /api/v1/card-sets/prices/380475` consulta CardTrader solo si no hay
   una entrada fresca.
2. La respuesta exitosa conserva todo el JSON externo en `data`.
3. Una entrada con más de 24 horas no se borra: se revalida.
4. Una respuesta externa exitosa actualiza la misma entrada de MongoDB.
5. Un fallo de renovación conserva y devuelve la entrada anterior.
6. La caché de precios vive en `card_marketplace_prices_cache` y no se mezcla
   con `card_sets_cache`.
7. No se modifica `src/context/card/` ni se añaden dependencias a ese
   bounded context.
