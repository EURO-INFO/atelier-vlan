# Classement partagé : Google Sheets + Apps Script (environ 10 minutes)

Sans cette étape, l'atelier fonctionne en **mode local** : chaque appareil a ses propres comptes et son propre classement, et personne ne voit les points des autres.

## 1. Créer le serveur

1. Créer un Google Sheet vide, par exemple « Atelier VLAN – Classement ».
2. Menu **Extensions → Apps Script**.
3. Remplacer tout le contenu de `Code.gs` par celui de [`apps-script.gs`](apps-script.gs).
4. Changer la valeur de `SALT` (n'importe quelle phrase), puis enregistrer.
5. **Déployer → Nouveau déploiement** → type **Application Web** :
   - Exécuter en tant que : **Moi**
   - Qui a accès : **Tout le monde**
6. Autoriser l'accès au Sheet (écran « Google n'a pas validé cette application » → *Paramètres avancés* → *Accéder au projet*).
7. Copier l'URL qui se termine par `/exec`.

## 2. Brancher le simulateur

Dans `index.html`, remplacer la ligne :

```js
var API_URL='';
```

par :

```js
var API_URL='https://script.google.com/macros/s/XXXXXXXX/exec';
```

Puis publier (commit + push si le site est sur GitHub Pages).

## 3. Vérifier

- Ouvrir l'URL `/exec` dans un navigateur : la page doit afficher `{"ok":true,"rows":[],...}`.
- Se connecter sur deux téléphones différents avec deux prénoms : chacun doit voir l'autre dans l'onglet **Classement**.
- Les onglets `Joueurs` et `Resolutions` apparaissent dans le Sheet à la première connexion.

## Pendant la séance

- **Écran du formateur** : ouvrir `…/index.html#classement`. Le classement s'affiche en grand et se rafraîchit toutes les 15 secondes, sans connexion.
- **Remise à zéro** : supprimer les lignes de `Resolutions` (garder la ligne d'en-tête).
- **Retirer un joueur** : supprimer sa ligne dans `Joueurs`.
- **Code PIN oublié** : supprimer la ligne du joueur dans `Joueurs`. Il se reconnecte avec un nouveau code, et ses résolutions restent rattachées à son prénom.

## Modifier le script plus tard

Après chaque modification du code : **Déployer → Gérer les déploiements → crayon → Version : Nouvelle version**. Sinon l'URL continue de servir l'ancienne version.

Tout nouveau challenge ajouté dans `index.html` doit aussi être ajouté dans `CATALOG` (même clé, mêmes points). Sinon, le serveur refuse la résolution avec « Challenge inconnu du serveur ».

## Limites à connaître

- **Triche** : le score est calculé dans le navigateur. Une personne qui sait ouvrir la console et lire le code JavaScript peut envoyer une fausse résolution sous son propre compte. Elle ne peut ni fixer ses points (le serveur les calcule), ni jouer sous le compte d'un autre sans son code. C'est suffisant pour une séance de formation. **Ce n'est pas suffisant pour distribuer de vraies récompenses** : il faudrait alors valider les résolutions côté serveur.
- **Données** : prénoms et scores sont stockés dans le Google Drive de la personne qui a déployé le script. Pour un déploiement à toute l'entreprise, il faut passer sur un compte ou une infrastructure de l'entreprise.
- **Charge** : un Sheet convient pour quelques dizaines à quelques centaines de joueurs. Au-delà, il faut une vraie base de données.
