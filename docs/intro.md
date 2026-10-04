---
id: intro
title: Card Sync Service
slug: /
sidebar_position: 1
---

# Documentación de Card Sync Service

Esta documentación describe la arquitectura, configuración y funcionamiento
del servicio de sincronización de cartas de Yu-Gi-Oh!

## Contextos disponibles

- [Card import](./card-import-mongodb): importación asíncrona de cartas y
  snapshots en MongoDB.
- [Card sets](./superpowers/specs/2026-10-04-card-sets-design): consulta y
  caché de sets mediante CardTrader.

La colección de Postman está fuera del sitio de documentación, en
`.postman/card-imports.postman_collection.json`.
