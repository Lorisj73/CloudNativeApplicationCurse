# Monitoring & Observabilité

## 1. Concepts clefs
- **Monitoring** : collecte de signaux connus (CPU, mémoire, requêtes) pour vérifier la santé d’un système. On vérifie que "tout est vert" et on déclenche des alertes.
- **Observabilité** : capacité à comprendre *pourquoi* le système se comporte d’une certaine façon. Elle repose sur l’analyse corrélée des **3 piliers** :
  - **Métriques** : séries temporelles chiffrées (requêtes/s, latence, erreurs).
  - **Logs** : événements textuels détaillés (pino pour le backend, stdout conteneurs).
  - **Traces** : suivis distribués d’une requête (non implémenté dans ce TP mais mentionné pour la culture générale).

## 2. Composants de la stack
| Composant | Rôle | Port |
|-----------|------|------|
| **Prometheus** | Scrape et stocke les métriques exposées par les services (backend `/metrics`, cAdvisor). | 9090 |
| **Grafana** | Visualisation, dashboards, corrélation métriques/logs. | 3000 |
| **Loki** | Stockage index-free des logs (concept "labels + chunks"). | 3100 (interne) |
| **Promtail** | Agent qui lit les logs Docker et les pousse vers Loki. | 9080 (HTTP de contrôle) |
| **cAdvisor** | Expose les métriques des conteneurs Docker (CPU, mémoire, IO) consommées par Prometheus. | 8080 |

## 3. Architecture
```
+-------------+       scrape        +------------+
| app-front-* |-------------------->|            |
+-------------+                     |            |
                                     |            |
+-------------+   /metrics   +-----> | Prometheus |
| app-back-*  |-------------/       |            |
+-------------+                    ^|            |
                                   ||            |
+-------------+  container stats   ||            |
|  cAdvisor   |--------------------+|            |
+-------------+                     +------------+
       ^                                   |
       | logs (stdout via Docker)          | datasource
+----------------+     push                v
|   Promtail     |----------------> +-------------+
+----------------+                   |   Grafana   |
                                     +-------------+
                                            ^
                                            |
                                            v
                                      +-----------+
                                      |   Loki    |
                                      +-----------+
```

- Les services applicatifs (blue/green) et le proxy partagent `gym_back_network`. La stack monitoring s’y connecte via `docker-compose.monitoring.yml`.
- Prometheus cible `app-back-blue:3000` et `app-back-green:3000`. La nouvelle route `/metrics` (prom-client) expose les KPI HTTP.
- Promtail lit les logs Docker (`/var/lib/docker/containers` + socket Docker), les labellise (nom du conteneur, stream) puis les pousse vers Loki.
- Grafana consomme simultanément Prometheus (métriques) et Loki (logs) et charge automatiquement deux dashboards (`backend-metrics`, `logs-overview`).

## 4. Intégration avec l’application
1. **Backend** : instrumentation `prom-client` (histogrammes, compteurs, gauge) + endpoint `/metrics` disponible dans toutes les piles (`app-back-blue/green`).
2. **Compose blue/green** : rien à changer, il suffit d’exposer les services sur `gym_back_network` (déjà le cas). Prometheus les contacte depuis la stack monitoring.
3. **Reverse proxy** : continue de router le trafic utilisateur ; monitoring fonctionne hors bande et ne modifie pas la stratégie blue/green.
4. **Runner CI** : peut lancer `docker compose -f docker-compose.monitoring.yml up -d` avant les tests de charge pour capturer les métriques.

## 5. Ports & accès
| Service | URL locale |
|---------|------------|
| Grafana | http://localhost:3000 (admin/admin par défaut) |
| Prometheus | http://localhost:9090 |
| Promtail UI (diagnostic) | http://localhost:9080/targets |
| cAdvisor | http://localhost:8080 |

> ⚠️ **Windows / Docker Desktop** : les montages (`/var/run/docker.sock`, `/var/lib/docker/containers`, `/:/rootfs`) nécessitent WSL2 ou un environnement Linux. Sur Windows natif, lancer la stack dans WSL (ou adapter les chemins avec `\\.\pipe\docker_engine`).

## 6. Déploiement de la stack monitoring
```bash
# Démarrer/rafraîchir la stack monitoring
 docker compose -f docker-compose.monitoring.yml up -d

# Arrêt complet
 docker compose -f docker-compose.monitoring.yml down -v
```

La stack doit être prête (tous les conteneurs `healthy`) avant d’explorer Grafana. Les dashboards pré-provisionnés apparaissent dans le dossier **Observability**.
