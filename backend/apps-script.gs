/**
 * Atelier VLAN : serveur de classement (Google Apps Script + Google Sheets).
 *
 * Déploiement : voir backend/README.md.
 * Les points sont calculés ICI, à partir de CATALOG : le navigateur envoie seulement
 * « tel joueur a résolu tel challenge sur tel switch avec N indices ».
 *
 * Feuilles créées automatiquement dans le classeur :
 *   Joueurs      : cle | prenom | pin_hash | cree_le
 *   Resolutions  : date | cle | prenom | challenge | os | indices | commandes | secondes | points
 */

// Points de base par challenge. Doit contenir les mêmes clés que le simulateur
// (ex1, ex2 = parcours ; c-* = challenges). Ajouter une ligne par nouveau challenge.
var CATALOG = {
  'ex1': 150, 'ex2': 150,
  'c-bureau3': 100, 'c-invite': 100,
  'c-tel': 200, 'c-voix': 200, 'c-compta': 200,
  'c-audit': 350, 'c-accueil': 350,
  'c-chaos': 500
};
var OS_OK = { cx: 1, aoss: 1 };
// Sel du hachage des codes PIN : le changer avant le premier déploiement.
var SALT = 'atelier-vlan-changer-ce-sel';

function doPost(e) {
  var req;
  try { req = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false, err: 'Requête illisible.' }); }
  if (req.action === 'board') return out_(board_());
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) return out_({ ok: false, err: 'Serveur occupé, réessayer.' });
  try {
    if (req.action === 'login') return out_(login_(req));
    if (req.action === 'solve') return out_(solve_(req));
    return out_({ ok: false, err: 'Action inconnue.' });
  } catch (err) {
    return out_({ ok: false, err: 'Erreur serveur : ' + err });
  } finally {
    lock.releaseLock();
  }
}

// Ouvrir l'URL /exec dans un navigateur affiche le classement brut (test rapide).
function doGet() { return out_(board_()); }

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function clean_(s) { return String(s || '').replace(/\s+/g, ' ').trim().slice(0, 30); }
function key_(s) {
  return clean_(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim();
}
function hash_(k, pin) {
  var d = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, SALT + '|' + k + '|' + pin, Utilities.Charset.UTF_8);
  return Utilities.base64Encode(d);
}
function award_(base, hints) { return Math.round(base * Math.max(0.4, 1 - 0.2 * (hints || 0))); }

function sheet_(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(headers); sh.setFrozenRows(1); }
  return sh;
}
function players_() { return sheet_('Joueurs', ['cle', 'prenom', 'pin_hash', 'cree_le']); }
function solves_() { return sheet_('Resolutions', ['date', 'cle', 'prenom', 'challenge', 'os', 'indices', 'commandes', 'secondes', 'points']); }
function rows_(sh) { var n = sh.getLastRow(); return n < 2 ? [] : sh.getRange(2, 1, n - 1, sh.getLastColumn()).getValues(); }

function idErr_(req) {
  var n = clean_(req.name);
  if (n.length < 2 || !key_(n)) return 'Prénom trop court.';
  if (!/^\d{4}$/.test(String(req.pin || ''))) return 'Le code doit faire exactement 4 chiffres.';
  return null;
}
function findPlayer_(k) {
  var r = rows_(players_());
  for (var i = 0; i < r.length; i++) if (String(r[i][0]) === k) return { name: String(r[i][1]), hash: String(r[i][2]) };
  return null;
}

function login_(req) {
  var e = idErr_(req); if (e) return { ok: false, err: e };
  var k = key_(req.name), p = findPlayer_(k), h = hash_(k, String(req.pin));
  if (p) return p.hash === h ? { ok: true, name: p.name, key: k }
    : { ok: false, err: 'Code incorrect pour ce prénom. Homonyme ? Ajouter l\'initiale du nom.' };
  var name = clean_(req.name);
  players_().appendRow([k, name, h, new Date()]);
  return { ok: true, name: name, key: k, created: true };
}

function solve_(req) {
  var e = idErr_(req); if (e) return { ok: false, err: e };
  var k = key_(req.name), p = findPlayer_(k);
  if (!p || p.hash !== hash_(k, String(req.pin))) return { ok: false, err: 'Compte introuvable ou code changé : se reconnecter.', auth: true };
  var base = CATALOG[req.ch];
  if (!base || !OS_OK[req.os]) return { ok: false, err: 'Challenge inconnu du serveur (CATALOG à mettre à jour).' };
  var hints = Math.max(0, Math.min(20, parseInt(req.hints, 10) || 0));
  var pts = award_(base, hints);
  solves_().appendRow([new Date(), k, p.name, req.ch, req.os, hints, parseInt(req.cmds, 10) || 0, parseInt(req.sec, 10) || 0, pts]);
  return { ok: true, pts: pts };
}

// Classement : meilleur score par (joueur, challenge, switch), puis somme.
function board_() {
  var rows = {}, best = {};
  rows_(players_()).forEach(function (r) {
    var k = String(r[0]); rows[k] = { key: k, name: String(r[1]), pts: 0, n: 0, s: {}, last: 0 };
  });
  rows_(solves_()).forEach(function (r) {
    var k = String(r[1]), ch = String(r[3]), os = String(r[4]), pts = Number(r[8]) || 0;
    var at = r[0] instanceof Date ? r[0].getTime() : new Date(r[0]).getTime() || 0;
    var id = k + '|' + ch + '|' + os;
    if (!best[id] || pts > best[id].pts) best[id] = { key: k, ch: ch, os: os, pts: pts, at: at };
  });
  Object.keys(best).forEach(function (id) {
    var b = best[id], w = rows[b.key]; if (!w) return;
    w.pts += b.pts; w.n++; w.s[b.ch + ':' + b.os] = b.pts; w.last = Math.max(w.last, b.at);
  });
  var list = Object.keys(rows).map(function (k) { return rows[k]; });
  list.sort(function (a, b) { return b.pts - a.pts || b.n - a.n || a.last - b.last || a.name.localeCompare(b.name); });
  return { ok: true, rows: list, at: Date.now() };
}
