# Sitio Docusaurus para la documentación del proyecto

## Estado

Diseño aprobado por el usuario el 2026-10-04. Esta especificación precede a
la implementación del contenedor y la reorganización de la colección Postman.

## Objetivo

Servir la documentación Markdown del proyecto mediante Docusaurus para que sea
más fácil de navegar y leer desde un navegador.

El sitio se ejecutará como un servicio independiente de Docker Compose y estará
disponible en:

```text
http://localhost:3000
```

La documentación fuente seguirá viviendo en el directorio raíz `docs/`.

## Alcance

### Incluido

- Sitio Docusaurus aislado en `docs-site/`.
- Manifest y configuración propios para Docusaurus.
- Dockerfile propio para el sitio.
- Servicio `docs` en `docker-compose.yml`.
- Montaje de `./docs` como fuente de documentación del sitio.
- Navegación lateral generada a partir de los documentos existentes.
- Portada del sitio con enlaces a las áreas principales.
- Movimiento de la colección Postman a `.postman/`.
- Actualización de referencias a la nueva ubicación de Postman si existen.
- Validación del arranque y de la compilación del sitio.

### Excluido

- Cambiar la aplicación NestJS o sus endpoints.
- Añadir dependencias de Docusaurus al `package.json` raíz.
- Cambiar el contenido funcional de la documentación existente salvo los
  metadatos Markdown necesarios para Docusaurus.
- Publicar el sitio en Internet.
- Añadir autenticación al sitio local.
- Incluir ficheros `.postman` en la navegación pública de Docusaurus.

## Estructura

La estructura será:

```text
docs/
  card-import-mongodb.md
  superpowers/
    specs/
      *.md
  ...
.postman/
  card-imports.postman_collection.json
docs-site/
  Dockerfile
  package.json
  docusaurus.config.js
  sidebars.js
  src/
    pages/
      index.js
  static/
```

La colección Postman dejará de estar dentro de `docs/`:

```text
docs/card-imports.postman_collection.json
```

se moverá a:

```text
.postman/card-imports.postman_collection.json
```

El fichero conservará exactamente su formato y contenido funcional.

## Configuración de Docusaurus

El sitio utilizará Docusaurus 3 con React y una configuración independiente
del servicio principal.

El plugin de documentación usará:

- `path: '../docs'` desde la configuración ubicada en `docs-site/`;
- `routeBasePath: '/'` para que la documentación sea la página principal;
- `sidebarPath` apuntando a `sidebars.js`;
- enlaces Markdown relativos al documento cuando se necesiten referencias a
  otros documentos.

Los documentos bajo `docs/superpowers/specs/` se mostrarán como una sección
propia del sidebar. Los JSON no se incluirán porque la colección Postman se
habrá movido a `.postman/`.

Los Markdown existentes que no tengan front matter recibirán metadatos
mínimos o una configuración de títulos compatible con Docusaurus, sin
reescribir su contenido técnico.

## Docker

El servicio se llamará `docs` y tendrá estas propiedades:

```yaml
docs:
  build:
    context: .
    dockerfile: docs-site/Dockerfile
  ports:
    - "127.0.0.1:3000:3000"
  volumes:
    - ./docs:/site/docs
    - ./docs-site:/site/docs-site
```

El volumen de `docs/` permitirá editar documentación desde el host y verla
actualizada en el sitio de desarrollo. No se montará `.postman/` dentro del
sitio.

El contenedor ejecutará el servidor de desarrollo de Docusaurus escuchando en
`0.0.0.0`, para que sea accesible desde el puerto publicado por Docker.

El servicio utilizará una red independiente de la aplicación salvo que sea
necesario compartirla; Docusaurus no necesita acceder a NestJS, MongoDB ni
CardTrader para servir documentación estática.

## Desarrollo y producción

La primera implementación priorizará la experiencia local de lectura y edición:

```bash
docker compose up docs
```

La imagen instalará las dependencias del sitio dentro del contenedor, evitando
añadirlas al `node_modules` de NestJS.

La configuración dejará preparado un comando de build de Docusaurus para
validar el sitio:

```bash
npm run build
```

No se añadirá todavía un reverse proxy ni un segundo contenedor para servir los
ficheros estáticos compilados.

## Navegación

La portada incluirá enlaces a:

- Documentación de `card-import`.
- Documentación de `card-sets`.
- Especificaciones arquitectónicas.

El sidebar mantendrá un orden explícito y estable, de modo que la aparición de
nuevos Markdown no cambie inesperadamente la navegación.

## Movimiento de Postman

El movimiento se realizará como una operación de fichero, no como una copia:

```text
docs/card-imports.postman_collection.json
  -> .postman/card-imports.postman_collection.json
```

Se revisarán referencias en documentación y configuración para que ninguna
apunte a la ruta antigua. El directorio `.postman/` será una ubicación
documental de herramientas, no una sección del sitio Docusaurus.

## Validación

La implementación se considerará correcta cuando:

1. `docker compose config` acepte el Compose actualizado.
2. `docker compose up docs` inicie el sitio sin errores.
3. `http://localhost:3000` responda y muestre la portada.
4. La navegación permita abrir `card-import-mongodb.md`.
5. La navegación permita abrir la especificación de `card-sets`.
6. El directorio `.postman/` contenga la colección y `docs/` ya no contenga el
   JSON de Postman.
7. El comando de build de Docusaurus complete correctamente.
8. La aplicación `app` y MongoDB mantengan su configuración y funcionamiento
   existentes.
