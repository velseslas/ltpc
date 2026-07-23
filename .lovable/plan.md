## Objectif

Améliorer la fiche client et introduire une **page Détail Chantier** avec gestion des centrales à béton affectées, puis propager ce filtrage dans les formulaires d'échantillons (compression, traction/fendage, laboratoire chantier).

---

## 1. Fiche Client — Résumé chantier sur une seule ligne (desktop)

Dans le widget/carte chantier de la fiche client (desktop uniquement) :
- Regrouper Nom + Localisation + Statut + dates sur **une seule ligne** avec troncation (`truncate`) et séparateurs.
- Mobile : conserver la disposition actuelle empilée.

## 2. Widget Chantier — Menu d'actions standardisé

Remplacer les boutons d'action actuels par le **menu `...` (DropdownMenu)** conforme au reste de l'app :
- Détails (nouveau) → navigue vers `/clients/:clientId/chantiers/:chantierId`
- Modifier
- Supprimer

## 3. Nouvelle page — Détail Chantier

Route : `/clients/:clientId/chantiers/:chantierId`

Contenu :
- Breadcrumb : Clients > [Client] > Chantiers > [Chantier]
- Bouton retour + titre + statut
- Bloc **Informations chantier** (nom, adresse, dates, contact, tél…)
- Bloc **Centrales à béton affectées** :
  - Bouton `+ Nouvelle centrale à béton`
  - Grille de widgets centrales déjà affectées au chantier
  - Chaque widget = résumé centrale + menu `...` (Détails / Retirer du chantier)

## 4. Pop-up d'affectation d'une centrale au chantier

Au clic sur `+ Nouvelle centrale à béton` :
- Ouvre un `Dialog` listant les centrales du client (via `client_centrales`)
- Filtre : masquer celles déjà affectées au chantier
- Sélection multiple avec cases à cocher + bouton "Affecter"
- À la confirmation → insertion dans une nouvelle table de liaison

## 5. Filtrage centrales dans les formulaires d'échantillons

Adapter les sélecteurs `Centrale à béton` pour filtrer d'abord par **chantier affecté**, puis retomber sur celles du client si aucune affectation :

- Nouveau échantillon Compression
- Nouveau échantillon Traction / Fendage
- Nouveau échantillon Laboratoire Chantier

---

## Détails techniques

### Base de données (Lovable Cloud)

Nouvelle table de liaison `chantier_centrales` :

```sql
CREATE TABLE public.chantier_centrales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chantier_id uuid NOT NULL REFERENCES public.chantiers(id) ON DELETE CASCADE,
  centrale_id uuid NOT NULL REFERENCES public.centrales_beton(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(chantier_id, centrale_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chantier_centrales TO authenticated;
GRANT ALL ON public.chantier_centrales TO service_role;
ALTER TABLE public.chantier_centrales ENABLE ROW LEVEL SECURITY;
-- policies : SELECT authenticated ; INSERT/DELETE via can_write_business()
```

### Fichiers impactés

- `src/routes/*Routes.tsx` — nouvelle route `/clients/:clientId/chantiers/:chantierId`
- `src/pages/clients/ChantierDetail.tsx` (nouveau)
- Fiche client existante (widget chantiers) — layout desktop 1 ligne + DropdownMenu
- Nouveau hook `useChantierCentrales(chantierId)`
- Nouveau composant `AffectCentraleDialog.tsx`
- Formulaires échantillons : Compression, Traction/Fendage, Laboratoire Chantier — remplacer la source de la liste centrales par le hook filtré chantier
- Réutiliser `CentraleCard` (widget) existant, sinon en créer un compact

### Comportement de repli

Si un chantier n'a aucune centrale affectée : le sélecteur montre les centrales du client (comportement actuel) avec un badge « non filtré » pour ne pas bloquer la saisie existante.

---

## Livrables

1. Nouvelle table `chantier_centrales` + RLS + GRANT
2. Page Détail Chantier fonctionnelle
3. Résumé chantier 1 ligne (desktop) + menu `...` harmonisé
4. Filtrage des centrales dans les 3 formulaires d'échantillons
