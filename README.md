# Atelier VLAN Aruba

Simulateur de switch Aruba (AOS-CX et AOS-S) en une seule page HTML, pour la formation interne VLAN niveau 1.

- **Comptes** : pseudo + code à 4 chiffres.
- **Parcours** : exercice 1 *Configurer* et exercice 2 *Dépanner*, 150 pts chacun.
- **Challenges** : tickets de panne ou demandes de changement, de ★ Facile à ★★★★ Expert.
- **Classement** : local à l'appareil par défaut, partagé une fois le backend configuré ([backend/README.md](backend/README.md)).
- **Mode projection** : `index.html#classement`.

## Règles de points

| Niveau | Points | Challenges |
|---|---|---|
| ★ Facile | 100 | Bureau 3 : plus de réseau · Un invité sur le réseau interne |
| ★★ Moyen | 200 | Téléphones muets 13–16 · Le VLAN voix a perdu son identité · Nouveau service : la comptabilité |
| ★★★ Difficile | 350 | Audit sécurité : le VLAN fantôme · Accueil et invités coupés du monde |
| ★★★★ Expert | 500 | Le grand ménage du stagiaire (pannes non listées) |

- Les points sont gagnés au premier succès, **par challenge et par switch** : AOS-CX et AOS-S comptent séparément.
- Chaque indice affiché retire 20 % des points, avec un plancher à 40 %.
- On peut rejouer un challenge : seul le meilleur score est conservé.
- Un challenge est validé quand :
  - tous les tickets sont résolus ;
  - le reste du plan de référence est intact (aucun VLAN en trop, aucun port branché coupé, nom du switch correct) ;
  - la configuration est sauvegardée avec `write memory`.

## Ajouter un challenge

1. Dans `index.html`, ajouter une entrée `mkCh({...})` dans `CHALLENGES`. Elle définit :
   - `diff` : la difficulté ;
   - `faults(st, os)` : les pannes à injecter dans le plan de référence ;
   - `story` : le contexte du ticket ;
   - `tickets` : la vérification et l'indice de chaque ticket, en version CX et AOS-S ;
   - `spec`, seulement si le plan cible diffère du plan de référence.
2. Ajouter la même clé dans `CATALOG` de `backend/apps-script.gs`, puis créer une nouvelle version du déploiement.

`Atelier-VLAN-Aruba.html` est une copie identique de `index.html`.
