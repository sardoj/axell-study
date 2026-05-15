# Axell, étude pivot ICP setter/closer, site legacy

Site multi-pages HTML statique, document interne Uccello Labs.

## Structure

```
website-legacy/
├── index.html           Accueil (hero + stats + 8 cartes + CTA band)
├── login.html           Page de connexion (mot de passe SHA-256)
├── pages/
│   ├── synthese.html    Résumé exécutif lisible en 3 minutes
│   ├── offre.html       Offre rédigée Damien + Karine
│   ├── personas.html    2 personas acheteurs détaillés
│   ├── marche.html      Taille marché + canal + maturité
│   ├── concurrence.html 6 battlecards opérationnels
│   ├── pricing.html     5 tiers + add-ons + valeur économique
│   ├── viabilite.html   6 critères + 4 conditions
│   └── decouverte.html  Sourcing externe initial + 9 sources cliquables
├── assets/
│   ├── css/style.css    Design system unique
│   ├── js/auth.js       Auth client (SHA-256, sessionStorage)
│   ├── js/main.js       Nav + accordion + reveal scroll
│   └── img/             Logos, médias (vide par défaut)
└── README.md
```

## Mot de passe

**`Axe!!`** (hash SHA-256 stocké en clair dans `assets/js/auth.js`)

Pour changer le mot de passe :

```bash
printf '%s' 'NOUVEAU_MOT_DE_PASSE' | shasum -a 256 | awk '{print $1}'
```

Puis remplacer la valeur de `PASSWORD_HASH` dans `assets/js/auth.js`.

La session est valable jusqu'à fermeture du navigateur (sessionStorage).

## Niveau de protection

**Léger.** Type basic auth côté client. Le hash empêche de voir le mot de passe en clair, mais quelqu'un avec accès aux fichiers HTML peut bypass.

Pour un usage publié plus sensible, combiner avec une auth serveur :
- `.htpasswd` Apache
- Cloudflare Access
- Netlify Identity / Vercel Password Protection
- Basic Auth Nginx

## Servir localement

```bash
cd website-legacy
python3 -m http.server 8806
# → http://localhost:8806
```

Ou via le launch.json configuré : profil `axell-closer-website-legacy` (port 8806).

## Déployer

Serveur statique au choix : OVH, Netlify, GitHub Pages, S3 + CloudFront, FTP simple. Aucun build requis. Copier le dossier `website-legacy/` tel quel.

Tous les liens sont relatifs, le site fonctionne dans un sous-dossier (par exemple `monsite.fr/etude-axell/`).

## Pages auto-portantes

Chaque fichier HTML est complet (head, header placeholder, main, footer placeholder, scripts). Le header et le footer sont injectés au runtime par `main.js` pour éviter la duplication HTML.

JavaScript requis pour : auth, header/footer, accordion, animations reveal. Sans JS, le contenu reste accessible mais l'auth ne fonctionne pas.

## Régénération

Pour changer un contenu, éditer directement le HTML correspondant. Pas de build.

Pour régénérer depuis les fichiers source du pipeline (`OFFER_FINAL.md`, `PERSONA_*.md`, `PRICING_BRIEF.md`, etc.), relancer `/offer-study-website --legacy` et choisir le mode legacy multi-pages.

## Cohérence cross-supports

Si tu modifies l'offre principale, le pricing ou la promesse sur ce site, vérifie aussi :
- `OFFER_FINAL.md` source du pipeline
- Pitch deck (à venir)
- VSL script (à venir)
- Proposition commerciale (à venir, par prospect)
