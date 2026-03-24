# Plan blue/green (docker compose + traefik)

## Architecture de fichiers
- `docker-compose.base.yml` : infra partagée (Postgres + reverse-proxy Nginx), réseaux/volumes.
- `docker-compose.blue.yml` : backend/frontend blue (`app-back-blue`, `app-front-blue`).
- `docker-compose.green.yml` : backend/frontend green (`app-back-green`, `app-front-green`).
- `reverse-proxy/active-upstream.conf` : choisit la couleur active pour Nginx (include dynamique).

## Lancement
- Proxy (une fois) :
  ```bash
  docker compose -f docker-compose.base.yml up -d reverse-proxy postgres
  ```
- Couleur :
  ```bash
  docker compose -f docker-compose.base.yml -f docker-compose.blue.yml up -d
  docker compose -f docker-compose.base.yml -f docker-compose.green.yml up -d
  ```
- Chaque couleur est gérée par son fichier, le proxy reste en place.

## Bascule proxy (choix : Nginx + include dynamique)
- Deux upstreams définis dans `reverse-proxy/nginx.conf` : `app_back_blue/green` et `app_front_blue/green`.
- Le fichier monté `reverse-proxy/active-upstream.conf` fixe les upstreams actifs :
  ```nginx
  set $active_backend app_back_blue;   # ou app_back_green
  set $active_frontend app_front_blue; # ou app_front_green
  ```
- Switch : éditer `active-upstream.conf`, puis `docker exec reverse-proxy nginx -s reload` (pas de redémarrage complet).

## Scénario de déploiement
- État initial : blue active (`active-upstream.conf` pointe sur blue), green éteinte ou inactive.
- Nouveau déploiement :
  1) Déployer green (base + green) avec la nouvelle image/tag.
  2) Tests santé/smoke sur green.
  3) Switch : mettre `active-upstream.conf` sur green puis `nginx -s reload`. Le trafic bascule sans couper blue.
- Rollback : remettre blue dans `active-upstream.conf`, reload Nginx. Blue n’ayant jamais été stoppée, retour immédiat.

## Points clefs
- Proxy séparé, jamais redémarré pour un déploiement applicatif.
- Deux stacks app indépendantes, démarrables l’une sans toucher l’autre.
- Bascule par labels/priorités (ou enable=true/false) sur Traefik ; pas de recréation du proxy.
- Aucune donnée perdue : Postgres reste dans `docker-compose.base.yml` (volume unique, non supprimé).
- Idempotence : relancer le déploiement sur une couleur ne modifie pas l’autre et ne casse pas le routage en place.
