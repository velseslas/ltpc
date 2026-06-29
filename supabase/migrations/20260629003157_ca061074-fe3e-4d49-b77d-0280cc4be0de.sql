
-- Enums
DO $$ BEGIN
  CREATE TYPE public.materiel_statut_courant AS ENUM ('disponible','affecte','pris_en_charge','en_passation','restitue','en_maintenance','hors_service','perdu','vole','reforme');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.mouvement_type AS ENUM ('affectation','decharge','passation','restitution');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.mouvement_statut AS ENUM ('brouillon','valide','signe','annule');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.item_etat AS ENUM ('bon','usage','casse','manquant','a_reparer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Extend materiel_laboratoire
ALTER TABLE public.materiel_laboratoire
  ADD COLUMN IF NOT EXISTS statut_courant public.materiel_statut_courant NOT NULL DEFAULT 'disponible',
  ADD COLUMN IF NOT EXISTS responsable_courant_id uuid REFERENCES public.intervenants(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS chantier_courant_id uuid REFERENCES public.chantiers(id) ON DELETE SET NULL;

-- materiel_movements
CREATE TABLE IF NOT EXISTS public.materiel_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text UNIQUE NOT NULL,
  type public.mouvement_type NOT NULL,
  statut public.mouvement_statut NOT NULL DEFAULT 'brouillon',
  chantier_id uuid REFERENCES public.chantiers(id) ON DELETE SET NULL,
  technicien_sortant_id uuid REFERENCES public.intervenants(id) ON DELETE SET NULL,
  technicien_entrant_id uuid REFERENCES public.intervenants(id) ON DELETE SET NULL,
  responsable_id uuid REFERENCES public.intervenants(id) ON DELETE SET NULL,
  date_mouvement date NOT NULL DEFAULT CURRENT_DATE,
  heure_mouvement time NOT NULL DEFAULT CURRENT_TIME,
  motif text,
  observations text,
  parent_movement_id uuid REFERENCES public.materiel_movements(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_nom text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.materiel_movements TO authenticated;
GRANT ALL ON public.materiel_movements TO service_role;
ALTER TABLE public.materiel_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read movements" ON public.materiel_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "managers create movements" ON public.materiel_movements FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_manager());
CREATE POLICY "managers update movements" ON public.materiel_movements FOR UPDATE TO authenticated USING (public.is_admin_or_manager()) WITH CHECK (public.is_admin_or_manager());

-- block deletes
CREATE OR REPLACE FUNCTION public.block_delete() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Suppression interdite : enregistrement historisé'; END; $$;

CREATE TRIGGER trg_block_delete_movements BEFORE DELETE ON public.materiel_movements FOR EACH ROW EXECUTE FUNCTION public.block_delete();

-- movement_items
CREATE TABLE IF NOT EXISTS public.movement_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movement_id uuid NOT NULL REFERENCES public.materiel_movements(id) ON DELETE CASCADE,
  materiel_id uuid NOT NULL REFERENCES public.materiel_laboratoire(id) ON DELETE RESTRICT,
  quantite integer NOT NULL DEFAULT 1 CHECK (quantite >= 1),
  etat public.item_etat NOT NULL DEFAULT 'bon',
  observations text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.movement_items TO authenticated;
GRANT ALL ON public.movement_items TO service_role;
ALTER TABLE public.movement_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read items" ON public.movement_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "managers write items" ON public.movement_items FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_manager());
CREATE POLICY "managers update items" ON public.movement_items FOR UPDATE TO authenticated USING (public.is_admin_or_manager()) WITH CHECK (public.is_admin_or_manager());
CREATE TRIGGER trg_block_delete_items BEFORE DELETE ON public.movement_items FOR EACH ROW EXECUTE FUNCTION public.block_delete();

-- movement_signatures
CREATE TABLE IF NOT EXISTS public.movement_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movement_id uuid NOT NULL REFERENCES public.materiel_movements(id) ON DELETE CASCADE,
  role text NOT NULL,
  signataire_nom text NOT NULL,
  signataire_fonction text,
  signature_data text,
  signed_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
GRANT SELECT, INSERT ON public.movement_signatures TO authenticated;
GRANT ALL ON public.movement_signatures TO service_role;
ALTER TABLE public.movement_signatures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read sig" ON public.movement_signatures FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth sign" ON public.movement_signatures FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR public.is_admin_or_manager());
CREATE TRIGGER trg_block_delete_sig BEFORE DELETE ON public.movement_signatures FOR EACH ROW EXECUTE FUNCTION public.block_delete();

-- history tables
CREATE TABLE IF NOT EXISTS public.material_responsibility_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  materiel_id uuid NOT NULL REFERENCES public.materiel_laboratoire(id) ON DELETE CASCADE,
  technicien_id uuid REFERENCES public.intervenants(id) ON DELETE SET NULL,
  chantier_id uuid REFERENCES public.chantiers(id) ON DELETE SET NULL,
  date_debut timestamptz NOT NULL DEFAULT now(),
  date_fin timestamptz,
  movement_id_debut uuid REFERENCES public.materiel_movements(id) ON DELETE SET NULL,
  movement_id_fin uuid REFERENCES public.materiel_movements(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.material_responsibility_history TO authenticated;
GRANT ALL ON public.material_responsibility_history TO service_role;
ALTER TABLE public.material_responsibility_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read resp" ON public.material_responsibility_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "mgr write resp" ON public.material_responsibility_history FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_manager());
CREATE POLICY "mgr upd resp" ON public.material_responsibility_history FOR UPDATE TO authenticated USING (public.is_admin_or_manager()) WITH CHECK (public.is_admin_or_manager());
CREATE TRIGGER trg_block_delete_resp BEFORE DELETE ON public.material_responsibility_history FOR EACH ROW EXECUTE FUNCTION public.block_delete();

CREATE TABLE IF NOT EXISTS public.material_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  materiel_id uuid NOT NULL REFERENCES public.materiel_laboratoire(id) ON DELETE CASCADE,
  ancien_statut public.materiel_statut_courant,
  nouveau_statut public.materiel_statut_courant NOT NULL,
  movement_id uuid REFERENCES public.materiel_movements(id) ON DELETE SET NULL,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  motif text
);
GRANT SELECT, INSERT ON public.material_status_history TO authenticated;
GRANT ALL ON public.material_status_history TO service_role;
ALTER TABLE public.material_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read status" ON public.material_status_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth write status" ON public.material_status_history FOR INSERT TO authenticated WITH CHECK (true);
CREATE TRIGGER trg_block_delete_status BEFORE DELETE ON public.material_status_history FOR EACH ROW EXECUTE FUNCTION public.block_delete();

-- numbering
CREATE OR REPLACE FUNCTION public.next_movement_numero(_type public.mouvement_type)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  v_prefix text;
  v_year text := to_char(now(), 'YYYY');
  v_n integer;
BEGIN
  v_prefix := CASE _type
    WHEN 'affectation' THEN 'AFF'
    WHEN 'decharge' THEN 'DEC'
    WHEN 'passation' THEN 'PAS'
    WHEN 'restitution' THEN 'RES'
  END;
  SELECT COALESCE(MAX(NULLIF(regexp_replace(numero, '^'||v_prefix||'-'||v_year||'-', ''), '')::int), 0) + 1
  INTO v_n
  FROM public.materiel_movements
  WHERE type = _type AND numero LIKE v_prefix||'-'||v_year||'-%';
  RETURN v_prefix||'-'||v_year||'-'||lpad(v_n::text, 4, '0');
END $$;

CREATE OR REPLACE FUNCTION public.set_movement_numero()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    NEW.numero := public.next_movement_numero(NEW.type);
  END IF;
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_set_movement_numero BEFORE INSERT ON public.materiel_movements
FOR EACH ROW EXECUTE FUNCTION public.set_movement_numero();

-- apply movement: update materiel + histories when status changes to 'signe'
CREATE OR REPLACE FUNCTION public.apply_movement_effects()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_item RECORD;
  v_mat RECORD;
  v_new_status public.materiel_statut_courant;
  v_new_resp uuid;
  v_new_chantier uuid;
BEGIN
  IF NEW.statut <> 'signe' OR (TG_OP = 'UPDATE' AND OLD.statut = 'signe') THEN
    RETURN NEW;
  END IF;

  FOR v_item IN SELECT * FROM public.movement_items WHERE movement_id = NEW.id LOOP
    SELECT * INTO v_mat FROM public.materiel_laboratoire WHERE id = v_item.materiel_id;

    v_new_resp := v_mat.responsable_courant_id;
    v_new_chantier := v_mat.chantier_courant_id;
    v_new_status := v_mat.statut_courant;

    IF NEW.type = 'affectation' THEN
      v_new_status := 'affecte';
      v_new_resp := NEW.technicien_entrant_id;
      v_new_chantier := NEW.chantier_id;
    ELSIF NEW.type = 'decharge' THEN
      v_new_status := 'pris_en_charge';
      v_new_resp := NEW.technicien_entrant_id;
      v_new_chantier := NEW.chantier_id;
    ELSIF NEW.type = 'passation' THEN
      v_new_status := 'pris_en_charge';
      v_new_resp := NEW.technicien_entrant_id;
      UPDATE public.material_responsibility_history
        SET date_fin = now(), movement_id_fin = NEW.id
        WHERE materiel_id = v_item.materiel_id AND date_fin IS NULL;
    ELSIF NEW.type = 'restitution' THEN
      v_new_status := CASE v_item.etat
        WHEN 'bon' THEN 'disponible'::public.materiel_statut_courant
        WHEN 'usage' THEN 'disponible'::public.materiel_statut_courant
        WHEN 'a_reparer' THEN 'en_maintenance'::public.materiel_statut_courant
        WHEN 'casse' THEN 'hors_service'::public.materiel_statut_courant
        WHEN 'manquant' THEN 'perdu'::public.materiel_statut_courant
      END;
      v_new_resp := NULL;
      v_new_chantier := NULL;
      UPDATE public.material_responsibility_history
        SET date_fin = now(), movement_id_fin = NEW.id
        WHERE materiel_id = v_item.materiel_id AND date_fin IS NULL;
    END IF;

    INSERT INTO public.material_status_history(materiel_id, ancien_statut, nouveau_statut, movement_id, changed_by, motif)
    VALUES (v_item.materiel_id, v_mat.statut_courant, v_new_status, NEW.id, auth.uid(), NEW.observations);

    UPDATE public.materiel_laboratoire
      SET statut_courant = v_new_status,
          responsable_courant_id = v_new_resp,
          chantier_courant_id = v_new_chantier,
          updated_at = now()
      WHERE id = v_item.materiel_id;

    IF NEW.type IN ('affectation','decharge','passation') AND v_new_resp IS NOT NULL THEN
      INSERT INTO public.material_responsibility_history(materiel_id, technicien_id, chantier_id, movement_id_debut)
      VALUES (v_item.materiel_id, v_new_resp, v_new_chantier, NEW.id);
    END IF;
  END LOOP;

  RETURN NEW;
END $$;

CREATE TRIGGER trg_apply_movement AFTER INSERT OR UPDATE OF statut ON public.materiel_movements
FOR EACH ROW EXECUTE FUNCTION public.apply_movement_effects();

CREATE TRIGGER trg_movements_updated_at BEFORE UPDATE ON public.materiel_movements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
