CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: essai_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.essai_status AS ENUM (
    'pending',
    'in-progress',
    'completed',
    'cancelled'
);


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: adjuvants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.adjuvants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nom text NOT NULL,
    contact text,
    email text,
    telephone text,
    ville text,
    adresse text,
    produits text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: affectations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.affectations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    intervenant_id uuid NOT NULL,
    client_id uuid NOT NULL,
    chantier_id uuid NOT NULL,
    date_debut date NOT NULL,
    date_fin date,
    notes text,
    statut text DEFAULT 'en_cours'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: carrieres; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.carrieres (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nom text NOT NULL,
    contact text,
    email text,
    telephone text,
    ville text,
    adresse text,
    type_agregat text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: centrales_beton; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.centrales_beton (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nom text NOT NULL,
    contact text,
    email text,
    telephone text,
    ville text,
    adresse text,
    capacite text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: chantiers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chantiers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid,
    nom text NOT NULL,
    adresse text,
    ville text,
    description text,
    statut text DEFAULT 'actif'::text NOT NULL,
    date_debut date,
    date_fin date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: cimenteries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cimenteries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nom text NOT NULL,
    contact text,
    email text,
    telephone text,
    ville text,
    adresse text,
    capacite text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: client_centrales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_centrales (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    centrale_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    chantier_id uuid
);


--
-- Name: clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nom text NOT NULL,
    email text,
    telephone text,
    adresse text,
    ville text,
    ice text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    contact text
);


--
-- Name: contrats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contrats (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid,
    chantier_id uuid,
    titre text NOT NULL,
    document_url text,
    document_nom text,
    statut text DEFAULT 'actif'::text NOT NULL,
    date_signature date,
    date_expiration date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: documents_rh; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documents_rh (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    intervenant_id uuid NOT NULL,
    type_document text NOT NULL,
    nom_fichier text,
    url_fichier text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: echantillons_bleu_methylene_numero_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.echantillons_bleu_methylene_numero_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: echantillons_bleu_methylene; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.echantillons_bleu_methylene (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero integer DEFAULT nextval('public.echantillons_bleu_methylene_numero_seq'::regclass) NOT NULL,
    carriere_id uuid,
    produit text NOT NULL,
    date_reception date DEFAULT CURRENT_DATE NOT NULL,
    statut text DEFAULT 'a-faire'::text NOT NULL,
    resultats jsonb,
    observations text,
    operateur_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: echantillons_compression; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.echantillons_compression (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero integer NOT NULL,
    client_id uuid,
    chantier_id uuid,
    usage text,
    date_coulage date,
    statut text DEFAULT 'a-faire'::text NOT NULL,
    observations text,
    resultats jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    centrale_id uuid,
    formulation_id uuid,
    operateur_id uuid,
    destination_beton text,
    condition_cure text DEFAULT 'standard'::text,
    type_eprouvette text DEFAULT 'cube'::text,
    dimension_eprouvette text,
    nombre_eprouvettes integer DEFAULT 0,
    jours_essai jsonb DEFAULT '[]'::jsonb,
    temperature_beton numeric,
    temperature_air numeric,
    classe_consistance text,
    mode_coulage text
);


--
-- Name: echantillons_compression_numero_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.echantillons_compression_numero_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: echantillons_compression_numero_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.echantillons_compression_numero_seq OWNED BY public.echantillons_compression.numero;


--
-- Name: echantillons_ecrasement_numero_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.echantillons_ecrasement_numero_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: echantillons_ecrasement; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.echantillons_ecrasement (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero integer DEFAULT nextval('public.echantillons_ecrasement_numero_seq'::regclass) NOT NULL,
    carriere_id uuid,
    produit text NOT NULL,
    date_reception date DEFAULT CURRENT_DATE NOT NULL,
    statut text DEFAULT 'a-faire'::text NOT NULL,
    resultats jsonb,
    observations text,
    operateur_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: echantillons_equivalent_sable_numero_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.echantillons_equivalent_sable_numero_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: echantillons_equivalent_sable; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.echantillons_equivalent_sable (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero integer DEFAULT nextval('public.echantillons_equivalent_sable_numero_seq'::regclass) NOT NULL,
    carriere_id uuid,
    produit text NOT NULL,
    date_reception date DEFAULT CURRENT_DATE NOT NULL,
    statut text DEFAULT 'a-faire'::text NOT NULL,
    resultats jsonb,
    observations text,
    operateur_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: echantillons_forme_granulats_numero_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.echantillons_forme_granulats_numero_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: echantillons_forme_granulats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.echantillons_forme_granulats (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero integer DEFAULT nextval('public.echantillons_forme_granulats_numero_seq'::regclass) NOT NULL,
    carriere_id uuid,
    produit text NOT NULL,
    date_reception date DEFAULT CURRENT_DATE NOT NULL,
    statut text DEFAULT 'a-faire'::text NOT NULL,
    resultats jsonb,
    observations text,
    operateur_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: echantillons_friabilite_numero_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.echantillons_friabilite_numero_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: echantillons_friabilite; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.echantillons_friabilite (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero integer DEFAULT nextval('public.echantillons_friabilite_numero_seq'::regclass) NOT NULL,
    carriere_id uuid,
    produit text NOT NULL,
    date_reception date DEFAULT CURRENT_DATE NOT NULL,
    statut text DEFAULT 'a-faire'::text NOT NULL,
    resultats jsonb,
    observations text,
    operateur_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: echantillons_granulometrie_numero_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.echantillons_granulometrie_numero_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: echantillons_granulometrie; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.echantillons_granulometrie (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero integer DEFAULT nextval('public.echantillons_granulometrie_numero_seq'::regclass) NOT NULL,
    carriere_id uuid,
    produit text NOT NULL,
    date_reception date DEFAULT CURRENT_DATE NOT NULL,
    statut text DEFAULT 'a-faire'::text NOT NULL,
    resultats jsonb,
    observations text,
    operateur_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: echantillons_los_angeles_numero_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.echantillons_los_angeles_numero_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: echantillons_los_angeles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.echantillons_los_angeles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero integer DEFAULT nextval('public.echantillons_los_angeles_numero_seq'::regclass) NOT NULL,
    carriere_id uuid,
    produit text NOT NULL,
    date_reception date DEFAULT CURRENT_DATE NOT NULL,
    statut text DEFAULT 'a-faire'::text NOT NULL,
    resultats jsonb,
    observations text,
    operateur_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: echantillons_masse_volumique_numero_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.echantillons_masse_volumique_numero_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: echantillons_masse_volumique; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.echantillons_masse_volumique (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero integer DEFAULT nextval('public.echantillons_masse_volumique_numero_seq'::regclass) NOT NULL,
    carriere_id uuid,
    produit text NOT NULL,
    date_reception date DEFAULT CURRENT_DATE NOT NULL,
    statut text DEFAULT 'a-faire'::text NOT NULL,
    resultats jsonb,
    observations text,
    operateur_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: echantillons_matiere_organique_numero_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.echantillons_matiere_organique_numero_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: echantillons_matiere_organique; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.echantillons_matiere_organique (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero integer DEFAULT nextval('public.echantillons_matiere_organique_numero_seq'::regclass) NOT NULL,
    carriere_id uuid,
    produit text NOT NULL,
    date_reception date DEFAULT CURRENT_DATE NOT NULL,
    statut text DEFAULT 'a-faire'::text NOT NULL,
    resultats jsonb,
    observations text,
    operateur_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: echantillons_micro_deval_numero_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.echantillons_micro_deval_numero_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: echantillons_micro_deval; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.echantillons_micro_deval (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero integer DEFAULT nextval('public.echantillons_micro_deval_numero_seq'::regclass) NOT NULL,
    carriere_id uuid,
    produit text NOT NULL,
    date_reception date DEFAULT CURRENT_DATE NOT NULL,
    statut text DEFAULT 'a-faire'::text NOT NULL,
    resultats jsonb,
    observations text,
    operateur_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: echantillons_teneur_eau_numero_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.echantillons_teneur_eau_numero_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: echantillons_teneur_eau; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.echantillons_teneur_eau (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero integer DEFAULT nextval('public.echantillons_teneur_eau_numero_seq'::regclass) NOT NULL,
    carriere_id uuid,
    produit text NOT NULL,
    date_reception date DEFAULT CURRENT_DATE NOT NULL,
    statut text DEFAULT 'a-faire'::text NOT NULL,
    resultats jsonb,
    observations text,
    operateur_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: entreprise; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.entreprise (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nom text DEFAULT ''::text NOT NULL,
    numero_autorisation text,
    siege_social text,
    annexe text,
    telephone text,
    email text,
    site_web text,
    logo_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: essais; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.essais (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    reference text NOT NULL,
    nom text NOT NULL,
    description text,
    type_essai text NOT NULL,
    client_id uuid,
    intervenant_id uuid,
    materiel_id uuid,
    statut public.essai_status DEFAULT 'pending'::public.essai_status NOT NULL,
    date_reception date DEFAULT CURRENT_DATE NOT NULL,
    date_realisation date,
    date_fin date,
    resultats jsonb,
    observations text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: formulations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.formulations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    centrale_id uuid NOT NULL,
    nom text NOT NULL,
    sable_concasse_producteur_id uuid,
    sable_concasse_produit_id uuid,
    sable_fin_producteur_id uuid,
    sable_fin_produit_id uuid,
    gravillons1_producteur_id uuid,
    gravillons1_produit_id uuid,
    gravier2_producteur_id uuid,
    gravier2_produit_id uuid,
    gravier3_producteur_id uuid,
    gravier3_produit_id uuid,
    ciment_producteur_id uuid,
    ciment_produit_id uuid,
    adjuvant_producteur_id uuid,
    adjuvant_produit_id uuid,
    eau_producteur_id uuid,
    eau_produit_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    sable_concasse_quantite numeric(10,2),
    sable_fin_quantite numeric(10,2),
    gravillons1_quantite numeric(10,2),
    gravier2_quantite numeric(10,2),
    gravier3_quantite numeric(10,2),
    ciment_quantite numeric(10,2),
    adjuvant_quantite numeric(10,2),
    eau_quantite numeric(10,2)
);


--
-- Name: intervenants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.intervenants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nom text NOT NULL,
    prenom text NOT NULL,
    email text,
    telephone text,
    role text DEFAULT 'Technicien'::text NOT NULL,
    departement text,
    statut text DEFAULT 'active'::text NOT NULL,
    date_embauche date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    date_naissance date,
    cin text,
    cnas text,
    adresse text,
    poste_id uuid,
    specialite text,
    salaire integer,
    notes text
);


--
-- Name: laboratoires_mobiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.laboratoires_mobiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nom text NOT NULL,
    immatriculation text,
    statut text DEFAULT 'disponible'::text NOT NULL,
    localisation_actuelle text,
    responsable_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: materiel; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.materiel (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nom text NOT NULL,
    reference text,
    marque text,
    modele text,
    numero_serie text,
    statut text DEFAULT 'operational'::text NOT NULL,
    date_acquisition date,
    date_dernier_etalonnage date,
    date_prochain_etalonnage date,
    localisation text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: postes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.postes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nom text NOT NULL,
    description text,
    departement text,
    salaire_moyen integer,
    competences text[],
    niveau_experience text,
    type_contrat text,
    notes text,
    nombre_employes integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: produits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.produits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nom text NOT NULL,
    producteur_id uuid NOT NULL,
    producteur_type text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: sources_eau; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sources_eau (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nom text NOT NULL,
    contact text,
    email text,
    telephone text,
    ville text,
    adresse text,
    debit text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: echantillons_compression numero; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echantillons_compression ALTER COLUMN numero SET DEFAULT nextval('public.echantillons_compression_numero_seq'::regclass);


--
-- Name: adjuvants adjuvants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adjuvants
    ADD CONSTRAINT adjuvants_pkey PRIMARY KEY (id);


--
-- Name: affectations affectations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affectations
    ADD CONSTRAINT affectations_pkey PRIMARY KEY (id);


--
-- Name: carrieres carrieres_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carrieres
    ADD CONSTRAINT carrieres_pkey PRIMARY KEY (id);


--
-- Name: centrales_beton centrales_beton_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.centrales_beton
    ADD CONSTRAINT centrales_beton_pkey PRIMARY KEY (id);


--
-- Name: chantiers chantiers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chantiers
    ADD CONSTRAINT chantiers_pkey PRIMARY KEY (id);


--
-- Name: cimenteries cimenteries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cimenteries
    ADD CONSTRAINT cimenteries_pkey PRIMARY KEY (id);


--
-- Name: client_centrales client_centrales_client_id_centrale_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_centrales
    ADD CONSTRAINT client_centrales_client_id_centrale_id_key UNIQUE (client_id, centrale_id);


--
-- Name: client_centrales client_centrales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_centrales
    ADD CONSTRAINT client_centrales_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: contrats contrats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contrats
    ADD CONSTRAINT contrats_pkey PRIMARY KEY (id);


--
-- Name: documents_rh documents_rh_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents_rh
    ADD CONSTRAINT documents_rh_pkey PRIMARY KEY (id);


--
-- Name: echantillons_bleu_methylene echantillons_bleu_methylene_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echantillons_bleu_methylene
    ADD CONSTRAINT echantillons_bleu_methylene_pkey PRIMARY KEY (id);


--
-- Name: echantillons_compression echantillons_compression_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echantillons_compression
    ADD CONSTRAINT echantillons_compression_pkey PRIMARY KEY (id);


--
-- Name: echantillons_ecrasement echantillons_ecrasement_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echantillons_ecrasement
    ADD CONSTRAINT echantillons_ecrasement_pkey PRIMARY KEY (id);


--
-- Name: echantillons_equivalent_sable echantillons_equivalent_sable_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echantillons_equivalent_sable
    ADD CONSTRAINT echantillons_equivalent_sable_pkey PRIMARY KEY (id);


--
-- Name: echantillons_forme_granulats echantillons_forme_granulats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echantillons_forme_granulats
    ADD CONSTRAINT echantillons_forme_granulats_pkey PRIMARY KEY (id);


--
-- Name: echantillons_friabilite echantillons_friabilite_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echantillons_friabilite
    ADD CONSTRAINT echantillons_friabilite_pkey PRIMARY KEY (id);


--
-- Name: echantillons_granulometrie echantillons_granulometrie_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echantillons_granulometrie
    ADD CONSTRAINT echantillons_granulometrie_pkey PRIMARY KEY (id);


--
-- Name: echantillons_los_angeles echantillons_los_angeles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echantillons_los_angeles
    ADD CONSTRAINT echantillons_los_angeles_pkey PRIMARY KEY (id);


--
-- Name: echantillons_masse_volumique echantillons_masse_volumique_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echantillons_masse_volumique
    ADD CONSTRAINT echantillons_masse_volumique_pkey PRIMARY KEY (id);


--
-- Name: echantillons_matiere_organique echantillons_matiere_organique_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echantillons_matiere_organique
    ADD CONSTRAINT echantillons_matiere_organique_pkey PRIMARY KEY (id);


--
-- Name: echantillons_micro_deval echantillons_micro_deval_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echantillons_micro_deval
    ADD CONSTRAINT echantillons_micro_deval_pkey PRIMARY KEY (id);


--
-- Name: echantillons_teneur_eau echantillons_teneur_eau_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echantillons_teneur_eau
    ADD CONSTRAINT echantillons_teneur_eau_pkey PRIMARY KEY (id);


--
-- Name: entreprise entreprise_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entreprise
    ADD CONSTRAINT entreprise_pkey PRIMARY KEY (id);


--
-- Name: essais essais_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.essais
    ADD CONSTRAINT essais_pkey PRIMARY KEY (id);


--
-- Name: essais essais_reference_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.essais
    ADD CONSTRAINT essais_reference_key UNIQUE (reference);


--
-- Name: formulations formulations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.formulations
    ADD CONSTRAINT formulations_pkey PRIMARY KEY (id);


--
-- Name: intervenants intervenants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intervenants
    ADD CONSTRAINT intervenants_pkey PRIMARY KEY (id);


--
-- Name: laboratoires_mobiles laboratoires_mobiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.laboratoires_mobiles
    ADD CONSTRAINT laboratoires_mobiles_pkey PRIMARY KEY (id);


--
-- Name: materiel materiel_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materiel
    ADD CONSTRAINT materiel_pkey PRIMARY KEY (id);


--
-- Name: postes postes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.postes
    ADD CONSTRAINT postes_pkey PRIMARY KEY (id);


--
-- Name: produits produits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produits
    ADD CONSTRAINT produits_pkey PRIMARY KEY (id);


--
-- Name: sources_eau sources_eau_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sources_eau
    ADD CONSTRAINT sources_eau_pkey PRIMARY KEY (id);


--
-- Name: idx_essais_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_essais_client_id ON public.essais USING btree (client_id);


--
-- Name: idx_essais_intervenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_essais_intervenant_id ON public.essais USING btree (intervenant_id);


--
-- Name: idx_essais_reference; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_essais_reference ON public.essais USING btree (reference);


--
-- Name: idx_essais_statut; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_essais_statut ON public.essais USING btree (statut);


--
-- Name: idx_intervenants_statut; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_intervenants_statut ON public.intervenants USING btree (statut);


--
-- Name: idx_materiel_statut; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_materiel_statut ON public.materiel USING btree (statut);


--
-- Name: adjuvants update_adjuvants_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_adjuvants_updated_at BEFORE UPDATE ON public.adjuvants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: affectations update_affectations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_affectations_updated_at BEFORE UPDATE ON public.affectations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: carrieres update_carrieres_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_carrieres_updated_at BEFORE UPDATE ON public.carrieres FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: centrales_beton update_centrales_beton_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_centrales_beton_updated_at BEFORE UPDATE ON public.centrales_beton FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: chantiers update_chantiers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_chantiers_updated_at BEFORE UPDATE ON public.chantiers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: cimenteries update_cimenteries_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_cimenteries_updated_at BEFORE UPDATE ON public.cimenteries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: clients update_clients_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: contrats update_contrats_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_contrats_updated_at BEFORE UPDATE ON public.contrats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: documents_rh update_documents_rh_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_documents_rh_updated_at BEFORE UPDATE ON public.documents_rh FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: echantillons_bleu_methylene update_echantillons_bleu_methylene_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_echantillons_bleu_methylene_updated_at BEFORE UPDATE ON public.echantillons_bleu_methylene FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: echantillons_compression update_echantillons_compression_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_echantillons_compression_updated_at BEFORE UPDATE ON public.echantillons_compression FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: echantillons_ecrasement update_echantillons_ecrasement_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_echantillons_ecrasement_updated_at BEFORE UPDATE ON public.echantillons_ecrasement FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: echantillons_equivalent_sable update_echantillons_equivalent_sable_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_echantillons_equivalent_sable_updated_at BEFORE UPDATE ON public.echantillons_equivalent_sable FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: echantillons_forme_granulats update_echantillons_forme_granulats_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_echantillons_forme_granulats_updated_at BEFORE UPDATE ON public.echantillons_forme_granulats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: echantillons_friabilite update_echantillons_friabilite_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_echantillons_friabilite_updated_at BEFORE UPDATE ON public.echantillons_friabilite FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: echantillons_granulometrie update_echantillons_granulometrie_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_echantillons_granulometrie_updated_at BEFORE UPDATE ON public.echantillons_granulometrie FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: echantillons_los_angeles update_echantillons_los_angeles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_echantillons_los_angeles_updated_at BEFORE UPDATE ON public.echantillons_los_angeles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: echantillons_masse_volumique update_echantillons_masse_volumique_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_echantillons_masse_volumique_updated_at BEFORE UPDATE ON public.echantillons_masse_volumique FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: echantillons_matiere_organique update_echantillons_matiere_organique_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_echantillons_matiere_organique_updated_at BEFORE UPDATE ON public.echantillons_matiere_organique FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: echantillons_micro_deval update_echantillons_micro_deval_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_echantillons_micro_deval_updated_at BEFORE UPDATE ON public.echantillons_micro_deval FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: echantillons_teneur_eau update_echantillons_teneur_eau_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_echantillons_teneur_eau_updated_at BEFORE UPDATE ON public.echantillons_teneur_eau FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: entreprise update_entreprise_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_entreprise_updated_at BEFORE UPDATE ON public.entreprise FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: essais update_essais_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_essais_updated_at BEFORE UPDATE ON public.essais FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: formulations update_formulations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_formulations_updated_at BEFORE UPDATE ON public.formulations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: intervenants update_intervenants_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_intervenants_updated_at BEFORE UPDATE ON public.intervenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: laboratoires_mobiles update_laboratoires_mobiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_laboratoires_mobiles_updated_at BEFORE UPDATE ON public.laboratoires_mobiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: materiel update_materiel_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_materiel_updated_at BEFORE UPDATE ON public.materiel FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: postes update_postes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_postes_updated_at BEFORE UPDATE ON public.postes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: produits update_produits_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_produits_updated_at BEFORE UPDATE ON public.produits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: sources_eau update_sources_eau_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_sources_eau_updated_at BEFORE UPDATE ON public.sources_eau FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: affectations affectations_chantier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affectations
    ADD CONSTRAINT affectations_chantier_id_fkey FOREIGN KEY (chantier_id) REFERENCES public.chantiers(id) ON DELETE CASCADE;


--
-- Name: affectations affectations_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affectations
    ADD CONSTRAINT affectations_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: affectations affectations_intervenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affectations
    ADD CONSTRAINT affectations_intervenant_id_fkey FOREIGN KEY (intervenant_id) REFERENCES public.intervenants(id) ON DELETE CASCADE;


--
-- Name: chantiers chantiers_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chantiers
    ADD CONSTRAINT chantiers_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: client_centrales client_centrales_centrale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_centrales
    ADD CONSTRAINT client_centrales_centrale_id_fkey FOREIGN KEY (centrale_id) REFERENCES public.centrales_beton(id) ON DELETE CASCADE;


--
-- Name: client_centrales client_centrales_chantier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_centrales
    ADD CONSTRAINT client_centrales_chantier_id_fkey FOREIGN KEY (chantier_id) REFERENCES public.chantiers(id) ON DELETE SET NULL;


--
-- Name: client_centrales client_centrales_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_centrales
    ADD CONSTRAINT client_centrales_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: contrats contrats_chantier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contrats
    ADD CONSTRAINT contrats_chantier_id_fkey FOREIGN KEY (chantier_id) REFERENCES public.chantiers(id) ON DELETE SET NULL;


--
-- Name: contrats contrats_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contrats
    ADD CONSTRAINT contrats_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: documents_rh documents_rh_intervenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents_rh
    ADD CONSTRAINT documents_rh_intervenant_id_fkey FOREIGN KEY (intervenant_id) REFERENCES public.intervenants(id) ON DELETE CASCADE;


--
-- Name: echantillons_bleu_methylene echantillons_bleu_methylene_carriere_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echantillons_bleu_methylene
    ADD CONSTRAINT echantillons_bleu_methylene_carriere_id_fkey FOREIGN KEY (carriere_id) REFERENCES public.carrieres(id) ON DELETE SET NULL;


--
-- Name: echantillons_bleu_methylene echantillons_bleu_methylene_operateur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echantillons_bleu_methylene
    ADD CONSTRAINT echantillons_bleu_methylene_operateur_id_fkey FOREIGN KEY (operateur_id) REFERENCES public.intervenants(id) ON DELETE SET NULL;


--
-- Name: echantillons_compression echantillons_compression_centrale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echantillons_compression
    ADD CONSTRAINT echantillons_compression_centrale_id_fkey FOREIGN KEY (centrale_id) REFERENCES public.centrales_beton(id);


--
-- Name: echantillons_compression echantillons_compression_chantier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echantillons_compression
    ADD CONSTRAINT echantillons_compression_chantier_id_fkey FOREIGN KEY (chantier_id) REFERENCES public.chantiers(id) ON DELETE SET NULL;


--
-- Name: echantillons_compression echantillons_compression_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echantillons_compression
    ADD CONSTRAINT echantillons_compression_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;


--
-- Name: echantillons_compression echantillons_compression_formulation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echantillons_compression
    ADD CONSTRAINT echantillons_compression_formulation_id_fkey FOREIGN KEY (formulation_id) REFERENCES public.formulations(id);


--
-- Name: echantillons_compression echantillons_compression_operateur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echantillons_compression
    ADD CONSTRAINT echantillons_compression_operateur_id_fkey FOREIGN KEY (operateur_id) REFERENCES public.intervenants(id);


--
-- Name: echantillons_ecrasement echantillons_ecrasement_carriere_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echantillons_ecrasement
    ADD CONSTRAINT echantillons_ecrasement_carriere_id_fkey FOREIGN KEY (carriere_id) REFERENCES public.carrieres(id) ON DELETE SET NULL;


--
-- Name: echantillons_ecrasement echantillons_ecrasement_operateur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echantillons_ecrasement
    ADD CONSTRAINT echantillons_ecrasement_operateur_id_fkey FOREIGN KEY (operateur_id) REFERENCES public.intervenants(id) ON DELETE SET NULL;


--
-- Name: echantillons_equivalent_sable echantillons_equivalent_sable_carriere_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echantillons_equivalent_sable
    ADD CONSTRAINT echantillons_equivalent_sable_carriere_id_fkey FOREIGN KEY (carriere_id) REFERENCES public.carrieres(id) ON DELETE SET NULL;


--
-- Name: echantillons_equivalent_sable echantillons_equivalent_sable_operateur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echantillons_equivalent_sable
    ADD CONSTRAINT echantillons_equivalent_sable_operateur_id_fkey FOREIGN KEY (operateur_id) REFERENCES public.intervenants(id) ON DELETE SET NULL;


--
-- Name: echantillons_forme_granulats echantillons_forme_granulats_carriere_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echantillons_forme_granulats
    ADD CONSTRAINT echantillons_forme_granulats_carriere_id_fkey FOREIGN KEY (carriere_id) REFERENCES public.carrieres(id) ON DELETE SET NULL;


--
-- Name: echantillons_forme_granulats echantillons_forme_granulats_operateur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echantillons_forme_granulats
    ADD CONSTRAINT echantillons_forme_granulats_operateur_id_fkey FOREIGN KEY (operateur_id) REFERENCES public.intervenants(id) ON DELETE SET NULL;


--
-- Name: echantillons_friabilite echantillons_friabilite_carriere_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echantillons_friabilite
    ADD CONSTRAINT echantillons_friabilite_carriere_id_fkey FOREIGN KEY (carriere_id) REFERENCES public.carrieres(id) ON DELETE SET NULL;


--
-- Name: echantillons_friabilite echantillons_friabilite_operateur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echantillons_friabilite
    ADD CONSTRAINT echantillons_friabilite_operateur_id_fkey FOREIGN KEY (operateur_id) REFERENCES public.intervenants(id) ON DELETE SET NULL;


--
-- Name: echantillons_granulometrie echantillons_granulometrie_carriere_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echantillons_granulometrie
    ADD CONSTRAINT echantillons_granulometrie_carriere_id_fkey FOREIGN KEY (carriere_id) REFERENCES public.carrieres(id) ON DELETE SET NULL;


--
-- Name: echantillons_granulometrie echantillons_granulometrie_operateur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echantillons_granulometrie
    ADD CONSTRAINT echantillons_granulometrie_operateur_id_fkey FOREIGN KEY (operateur_id) REFERENCES public.intervenants(id) ON DELETE SET NULL;


--
-- Name: echantillons_los_angeles echantillons_los_angeles_carriere_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echantillons_los_angeles
    ADD CONSTRAINT echantillons_los_angeles_carriere_id_fkey FOREIGN KEY (carriere_id) REFERENCES public.carrieres(id) ON DELETE SET NULL;


--
-- Name: echantillons_los_angeles echantillons_los_angeles_operateur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echantillons_los_angeles
    ADD CONSTRAINT echantillons_los_angeles_operateur_id_fkey FOREIGN KEY (operateur_id) REFERENCES public.intervenants(id) ON DELETE SET NULL;


--
-- Name: echantillons_masse_volumique echantillons_masse_volumique_carriere_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echantillons_masse_volumique
    ADD CONSTRAINT echantillons_masse_volumique_carriere_id_fkey FOREIGN KEY (carriere_id) REFERENCES public.carrieres(id) ON DELETE SET NULL;


--
-- Name: echantillons_masse_volumique echantillons_masse_volumique_operateur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echantillons_masse_volumique
    ADD CONSTRAINT echantillons_masse_volumique_operateur_id_fkey FOREIGN KEY (operateur_id) REFERENCES public.intervenants(id) ON DELETE SET NULL;


--
-- Name: echantillons_matiere_organique echantillons_matiere_organique_carriere_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echantillons_matiere_organique
    ADD CONSTRAINT echantillons_matiere_organique_carriere_id_fkey FOREIGN KEY (carriere_id) REFERENCES public.carrieres(id) ON DELETE SET NULL;


--
-- Name: echantillons_matiere_organique echantillons_matiere_organique_operateur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echantillons_matiere_organique
    ADD CONSTRAINT echantillons_matiere_organique_operateur_id_fkey FOREIGN KEY (operateur_id) REFERENCES public.intervenants(id) ON DELETE SET NULL;


--
-- Name: echantillons_micro_deval echantillons_micro_deval_carriere_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echantillons_micro_deval
    ADD CONSTRAINT echantillons_micro_deval_carriere_id_fkey FOREIGN KEY (carriere_id) REFERENCES public.carrieres(id) ON DELETE SET NULL;


--
-- Name: echantillons_micro_deval echantillons_micro_deval_operateur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echantillons_micro_deval
    ADD CONSTRAINT echantillons_micro_deval_operateur_id_fkey FOREIGN KEY (operateur_id) REFERENCES public.intervenants(id) ON DELETE SET NULL;


--
-- Name: echantillons_teneur_eau echantillons_teneur_eau_carriere_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echantillons_teneur_eau
    ADD CONSTRAINT echantillons_teneur_eau_carriere_id_fkey FOREIGN KEY (carriere_id) REFERENCES public.carrieres(id) ON DELETE SET NULL;


--
-- Name: echantillons_teneur_eau echantillons_teneur_eau_operateur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echantillons_teneur_eau
    ADD CONSTRAINT echantillons_teneur_eau_operateur_id_fkey FOREIGN KEY (operateur_id) REFERENCES public.intervenants(id) ON DELETE SET NULL;


--
-- Name: essais essais_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.essais
    ADD CONSTRAINT essais_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;


--
-- Name: essais essais_intervenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.essais
    ADD CONSTRAINT essais_intervenant_id_fkey FOREIGN KEY (intervenant_id) REFERENCES public.intervenants(id) ON DELETE SET NULL;


--
-- Name: essais essais_materiel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.essais
    ADD CONSTRAINT essais_materiel_id_fkey FOREIGN KEY (materiel_id) REFERENCES public.materiel(id) ON DELETE SET NULL;


--
-- Name: formulations formulations_centrale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.formulations
    ADD CONSTRAINT formulations_centrale_id_fkey FOREIGN KEY (centrale_id) REFERENCES public.centrales_beton(id) ON DELETE CASCADE;


--
-- Name: intervenants intervenants_poste_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intervenants
    ADD CONSTRAINT intervenants_poste_id_fkey FOREIGN KEY (poste_id) REFERENCES public.postes(id);


--
-- Name: laboratoires_mobiles laboratoires_mobiles_responsable_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.laboratoires_mobiles
    ADD CONSTRAINT laboratoires_mobiles_responsable_id_fkey FOREIGN KEY (responsable_id) REFERENCES public.intervenants(id) ON DELETE SET NULL;


--
-- Name: adjuvants Allow authenticated delete on adjuvants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated delete on adjuvants" ON public.adjuvants FOR DELETE TO authenticated USING (true);


--
-- Name: carrieres Allow authenticated delete on carrieres; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated delete on carrieres" ON public.carrieres FOR DELETE TO authenticated USING (true);


--
-- Name: centrales_beton Allow authenticated delete on centrales_beton; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated delete on centrales_beton" ON public.centrales_beton FOR DELETE TO authenticated USING (true);


--
-- Name: cimenteries Allow authenticated delete on cimenteries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated delete on cimenteries" ON public.cimenteries FOR DELETE TO authenticated USING (true);


--
-- Name: formulations Allow authenticated delete on formulations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated delete on formulations" ON public.formulations FOR DELETE USING (true);


--
-- Name: produits Allow authenticated delete on produits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated delete on produits" ON public.produits FOR DELETE USING (true);


--
-- Name: sources_eau Allow authenticated delete on sources_eau; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated delete on sources_eau" ON public.sources_eau FOR DELETE TO authenticated USING (true);


--
-- Name: adjuvants Allow authenticated insert on adjuvants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated insert on adjuvants" ON public.adjuvants FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: carrieres Allow authenticated insert on carrieres; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated insert on carrieres" ON public.carrieres FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: centrales_beton Allow authenticated insert on centrales_beton; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated insert on centrales_beton" ON public.centrales_beton FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: cimenteries Allow authenticated insert on cimenteries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated insert on cimenteries" ON public.cimenteries FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: formulations Allow authenticated insert on formulations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated insert on formulations" ON public.formulations FOR INSERT WITH CHECK (true);


--
-- Name: produits Allow authenticated insert on produits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated insert on produits" ON public.produits FOR INSERT WITH CHECK (true);


--
-- Name: sources_eau Allow authenticated insert on sources_eau; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated insert on sources_eau" ON public.sources_eau FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: adjuvants Allow authenticated read on adjuvants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated read on adjuvants" ON public.adjuvants FOR SELECT TO authenticated USING (true);


--
-- Name: carrieres Allow authenticated read on carrieres; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated read on carrieres" ON public.carrieres FOR SELECT TO authenticated USING (true);


--
-- Name: centrales_beton Allow authenticated read on centrales_beton; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated read on centrales_beton" ON public.centrales_beton FOR SELECT TO authenticated USING (true);


--
-- Name: cimenteries Allow authenticated read on cimenteries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated read on cimenteries" ON public.cimenteries FOR SELECT TO authenticated USING (true);


--
-- Name: formulations Allow authenticated read on formulations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated read on formulations" ON public.formulations FOR SELECT USING (true);


--
-- Name: produits Allow authenticated read on produits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated read on produits" ON public.produits FOR SELECT USING (true);


--
-- Name: sources_eau Allow authenticated read on sources_eau; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated read on sources_eau" ON public.sources_eau FOR SELECT TO authenticated USING (true);


--
-- Name: adjuvants Allow authenticated update on adjuvants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated update on adjuvants" ON public.adjuvants FOR UPDATE TO authenticated USING (true);


--
-- Name: carrieres Allow authenticated update on carrieres; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated update on carrieres" ON public.carrieres FOR UPDATE TO authenticated USING (true);


--
-- Name: centrales_beton Allow authenticated update on centrales_beton; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated update on centrales_beton" ON public.centrales_beton FOR UPDATE TO authenticated USING (true);


--
-- Name: cimenteries Allow authenticated update on cimenteries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated update on cimenteries" ON public.cimenteries FOR UPDATE TO authenticated USING (true);


--
-- Name: formulations Allow authenticated update on formulations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated update on formulations" ON public.formulations FOR UPDATE USING (true);


--
-- Name: produits Allow authenticated update on produits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated update on produits" ON public.produits FOR UPDATE USING (true);


--
-- Name: sources_eau Allow authenticated update on sources_eau; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated update on sources_eau" ON public.sources_eau FOR UPDATE TO authenticated USING (true);


--
-- Name: affectations Allow public delete on affectations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete on affectations" ON public.affectations FOR DELETE USING (true);


--
-- Name: chantiers Allow public delete on chantiers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete on chantiers" ON public.chantiers FOR DELETE USING (true);


--
-- Name: client_centrales Allow public delete on client_centrales; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete on client_centrales" ON public.client_centrales FOR DELETE USING (true);


--
-- Name: clients Allow public delete on clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete on clients" ON public.clients FOR DELETE USING (true);


--
-- Name: contrats Allow public delete on contrats; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete on contrats" ON public.contrats FOR DELETE USING (true);


--
-- Name: echantillons_bleu_methylene Allow public delete on echantillons_bleu_methylene; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete on echantillons_bleu_methylene" ON public.echantillons_bleu_methylene FOR DELETE USING (true);


--
-- Name: echantillons_compression Allow public delete on echantillons_compression; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete on echantillons_compression" ON public.echantillons_compression FOR DELETE USING (true);


--
-- Name: echantillons_ecrasement Allow public delete on echantillons_ecrasement; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete on echantillons_ecrasement" ON public.echantillons_ecrasement FOR DELETE USING (true);


--
-- Name: echantillons_equivalent_sable Allow public delete on echantillons_equivalent_sable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete on echantillons_equivalent_sable" ON public.echantillons_equivalent_sable FOR DELETE USING (true);


--
-- Name: echantillons_forme_granulats Allow public delete on echantillons_forme_granulats; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete on echantillons_forme_granulats" ON public.echantillons_forme_granulats FOR DELETE USING (true);


--
-- Name: echantillons_friabilite Allow public delete on echantillons_friabilite; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete on echantillons_friabilite" ON public.echantillons_friabilite FOR DELETE USING (true);


--
-- Name: echantillons_granulometrie Allow public delete on echantillons_granulometrie; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete on echantillons_granulometrie" ON public.echantillons_granulometrie FOR DELETE USING (true);


--
-- Name: echantillons_los_angeles Allow public delete on echantillons_los_angeles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete on echantillons_los_angeles" ON public.echantillons_los_angeles FOR DELETE USING (true);


--
-- Name: echantillons_masse_volumique Allow public delete on echantillons_masse_volumique; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete on echantillons_masse_volumique" ON public.echantillons_masse_volumique FOR DELETE USING (true);


--
-- Name: echantillons_matiere_organique Allow public delete on echantillons_matiere_organique; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete on echantillons_matiere_organique" ON public.echantillons_matiere_organique FOR DELETE USING (true);


--
-- Name: echantillons_micro_deval Allow public delete on echantillons_micro_deval; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete on echantillons_micro_deval" ON public.echantillons_micro_deval FOR DELETE USING (true);


--
-- Name: echantillons_teneur_eau Allow public delete on echantillons_teneur_eau; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete on echantillons_teneur_eau" ON public.echantillons_teneur_eau FOR DELETE USING (true);


--
-- Name: essais Allow public delete on essais; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete on essais" ON public.essais FOR DELETE USING (true);


--
-- Name: intervenants Allow public delete on intervenants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete on intervenants" ON public.intervenants FOR DELETE USING (true);


--
-- Name: laboratoires_mobiles Allow public delete on laboratoires_mobiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete on laboratoires_mobiles" ON public.laboratoires_mobiles FOR DELETE USING (true);


--
-- Name: materiel Allow public delete on materiel; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete on materiel" ON public.materiel FOR DELETE USING (true);


--
-- Name: affectations Allow public insert on affectations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on affectations" ON public.affectations FOR INSERT WITH CHECK (true);


--
-- Name: chantiers Allow public insert on chantiers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on chantiers" ON public.chantiers FOR INSERT WITH CHECK (true);


--
-- Name: client_centrales Allow public insert on client_centrales; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on client_centrales" ON public.client_centrales FOR INSERT WITH CHECK (true);


--
-- Name: clients Allow public insert on clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on clients" ON public.clients FOR INSERT WITH CHECK (true);


--
-- Name: contrats Allow public insert on contrats; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on contrats" ON public.contrats FOR INSERT WITH CHECK (true);


--
-- Name: echantillons_bleu_methylene Allow public insert on echantillons_bleu_methylene; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on echantillons_bleu_methylene" ON public.echantillons_bleu_methylene FOR INSERT WITH CHECK (true);


--
-- Name: echantillons_compression Allow public insert on echantillons_compression; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on echantillons_compression" ON public.echantillons_compression FOR INSERT WITH CHECK (true);


--
-- Name: echantillons_ecrasement Allow public insert on echantillons_ecrasement; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on echantillons_ecrasement" ON public.echantillons_ecrasement FOR INSERT WITH CHECK (true);


--
-- Name: echantillons_equivalent_sable Allow public insert on echantillons_equivalent_sable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on echantillons_equivalent_sable" ON public.echantillons_equivalent_sable FOR INSERT WITH CHECK (true);


--
-- Name: echantillons_forme_granulats Allow public insert on echantillons_forme_granulats; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on echantillons_forme_granulats" ON public.echantillons_forme_granulats FOR INSERT WITH CHECK (true);


--
-- Name: echantillons_friabilite Allow public insert on echantillons_friabilite; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on echantillons_friabilite" ON public.echantillons_friabilite FOR INSERT WITH CHECK (true);


--
-- Name: echantillons_granulometrie Allow public insert on echantillons_granulometrie; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on echantillons_granulometrie" ON public.echantillons_granulometrie FOR INSERT WITH CHECK (true);


--
-- Name: echantillons_los_angeles Allow public insert on echantillons_los_angeles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on echantillons_los_angeles" ON public.echantillons_los_angeles FOR INSERT WITH CHECK (true);


--
-- Name: echantillons_masse_volumique Allow public insert on echantillons_masse_volumique; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on echantillons_masse_volumique" ON public.echantillons_masse_volumique FOR INSERT WITH CHECK (true);


--
-- Name: echantillons_matiere_organique Allow public insert on echantillons_matiere_organique; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on echantillons_matiere_organique" ON public.echantillons_matiere_organique FOR INSERT WITH CHECK (true);


--
-- Name: echantillons_micro_deval Allow public insert on echantillons_micro_deval; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on echantillons_micro_deval" ON public.echantillons_micro_deval FOR INSERT WITH CHECK (true);


--
-- Name: echantillons_teneur_eau Allow public insert on echantillons_teneur_eau; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on echantillons_teneur_eau" ON public.echantillons_teneur_eau FOR INSERT WITH CHECK (true);


--
-- Name: essais Allow public insert on essais; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on essais" ON public.essais FOR INSERT WITH CHECK (true);


--
-- Name: intervenants Allow public insert on intervenants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on intervenants" ON public.intervenants FOR INSERT WITH CHECK (true);


--
-- Name: laboratoires_mobiles Allow public insert on laboratoires_mobiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on laboratoires_mobiles" ON public.laboratoires_mobiles FOR INSERT WITH CHECK (true);


--
-- Name: materiel Allow public insert on materiel; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on materiel" ON public.materiel FOR INSERT WITH CHECK (true);


--
-- Name: clients Allow public read access on clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access on clients" ON public.clients FOR SELECT USING (true);


--
-- Name: essais Allow public read access on essais; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access on essais" ON public.essais FOR SELECT USING (true);


--
-- Name: intervenants Allow public read access on intervenants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access on intervenants" ON public.intervenants FOR SELECT USING (true);


--
-- Name: laboratoires_mobiles Allow public read access on laboratoires_mobiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access on laboratoires_mobiles" ON public.laboratoires_mobiles FOR SELECT USING (true);


--
-- Name: materiel Allow public read access on materiel; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access on materiel" ON public.materiel FOR SELECT USING (true);


--
-- Name: affectations Allow public read on affectations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read on affectations" ON public.affectations FOR SELECT USING (true);


--
-- Name: chantiers Allow public read on chantiers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read on chantiers" ON public.chantiers FOR SELECT USING (true);


--
-- Name: client_centrales Allow public read on client_centrales; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read on client_centrales" ON public.client_centrales FOR SELECT USING (true);


--
-- Name: contrats Allow public read on contrats; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read on contrats" ON public.contrats FOR SELECT USING (true);


--
-- Name: echantillons_bleu_methylene Allow public read on echantillons_bleu_methylene; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read on echantillons_bleu_methylene" ON public.echantillons_bleu_methylene FOR SELECT USING (true);


--
-- Name: echantillons_compression Allow public read on echantillons_compression; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read on echantillons_compression" ON public.echantillons_compression FOR SELECT USING (true);


--
-- Name: echantillons_ecrasement Allow public read on echantillons_ecrasement; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read on echantillons_ecrasement" ON public.echantillons_ecrasement FOR SELECT USING (true);


--
-- Name: echantillons_equivalent_sable Allow public read on echantillons_equivalent_sable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read on echantillons_equivalent_sable" ON public.echantillons_equivalent_sable FOR SELECT USING (true);


--
-- Name: echantillons_forme_granulats Allow public read on echantillons_forme_granulats; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read on echantillons_forme_granulats" ON public.echantillons_forme_granulats FOR SELECT USING (true);


--
-- Name: echantillons_friabilite Allow public read on echantillons_friabilite; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read on echantillons_friabilite" ON public.echantillons_friabilite FOR SELECT USING (true);


--
-- Name: echantillons_granulometrie Allow public read on echantillons_granulometrie; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read on echantillons_granulometrie" ON public.echantillons_granulometrie FOR SELECT USING (true);


--
-- Name: echantillons_los_angeles Allow public read on echantillons_los_angeles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read on echantillons_los_angeles" ON public.echantillons_los_angeles FOR SELECT USING (true);


--
-- Name: echantillons_masse_volumique Allow public read on echantillons_masse_volumique; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read on echantillons_masse_volumique" ON public.echantillons_masse_volumique FOR SELECT USING (true);


--
-- Name: echantillons_matiere_organique Allow public read on echantillons_matiere_organique; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read on echantillons_matiere_organique" ON public.echantillons_matiere_organique FOR SELECT USING (true);


--
-- Name: echantillons_micro_deval Allow public read on echantillons_micro_deval; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read on echantillons_micro_deval" ON public.echantillons_micro_deval FOR SELECT USING (true);


--
-- Name: echantillons_teneur_eau Allow public read on echantillons_teneur_eau; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read on echantillons_teneur_eau" ON public.echantillons_teneur_eau FOR SELECT USING (true);


--
-- Name: affectations Allow public update on affectations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update on affectations" ON public.affectations FOR UPDATE USING (true);


--
-- Name: chantiers Allow public update on chantiers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update on chantiers" ON public.chantiers FOR UPDATE USING (true);


--
-- Name: client_centrales Allow public update on client_centrales; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update on client_centrales" ON public.client_centrales FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: clients Allow public update on clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update on clients" ON public.clients FOR UPDATE USING (true);


--
-- Name: contrats Allow public update on contrats; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update on contrats" ON public.contrats FOR UPDATE USING (true);


--
-- Name: echantillons_bleu_methylene Allow public update on echantillons_bleu_methylene; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update on echantillons_bleu_methylene" ON public.echantillons_bleu_methylene FOR UPDATE USING (true);


--
-- Name: echantillons_compression Allow public update on echantillons_compression; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update on echantillons_compression" ON public.echantillons_compression FOR UPDATE USING (true);


--
-- Name: echantillons_ecrasement Allow public update on echantillons_ecrasement; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update on echantillons_ecrasement" ON public.echantillons_ecrasement FOR UPDATE USING (true);


--
-- Name: echantillons_equivalent_sable Allow public update on echantillons_equivalent_sable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update on echantillons_equivalent_sable" ON public.echantillons_equivalent_sable FOR UPDATE USING (true);


--
-- Name: echantillons_forme_granulats Allow public update on echantillons_forme_granulats; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update on echantillons_forme_granulats" ON public.echantillons_forme_granulats FOR UPDATE USING (true);


--
-- Name: echantillons_friabilite Allow public update on echantillons_friabilite; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update on echantillons_friabilite" ON public.echantillons_friabilite FOR UPDATE USING (true);


--
-- Name: echantillons_granulometrie Allow public update on echantillons_granulometrie; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update on echantillons_granulometrie" ON public.echantillons_granulometrie FOR UPDATE USING (true);


--
-- Name: echantillons_los_angeles Allow public update on echantillons_los_angeles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update on echantillons_los_angeles" ON public.echantillons_los_angeles FOR UPDATE USING (true);


--
-- Name: echantillons_masse_volumique Allow public update on echantillons_masse_volumique; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update on echantillons_masse_volumique" ON public.echantillons_masse_volumique FOR UPDATE USING (true);


--
-- Name: echantillons_matiere_organique Allow public update on echantillons_matiere_organique; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update on echantillons_matiere_organique" ON public.echantillons_matiere_organique FOR UPDATE USING (true);


--
-- Name: echantillons_micro_deval Allow public update on echantillons_micro_deval; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update on echantillons_micro_deval" ON public.echantillons_micro_deval FOR UPDATE USING (true);


--
-- Name: echantillons_teneur_eau Allow public update on echantillons_teneur_eau; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update on echantillons_teneur_eau" ON public.echantillons_teneur_eau FOR UPDATE USING (true);


--
-- Name: essais Allow public update on essais; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update on essais" ON public.essais FOR UPDATE USING (true);


--
-- Name: intervenants Allow public update on intervenants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update on intervenants" ON public.intervenants FOR UPDATE USING (true);


--
-- Name: laboratoires_mobiles Allow public update on laboratoires_mobiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update on laboratoires_mobiles" ON public.laboratoires_mobiles FOR UPDATE USING (true);


--
-- Name: materiel Allow public update on materiel; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update on materiel" ON public.materiel FOR UPDATE USING (true);


--
-- Name: documents_rh Authenticated users can delete documents_rh; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can delete documents_rh" ON public.documents_rh FOR DELETE USING (true);


--
-- Name: postes Authenticated users can delete postes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can delete postes" ON public.postes FOR DELETE USING (true);


--
-- Name: documents_rh Authenticated users can insert documents_rh; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can insert documents_rh" ON public.documents_rh FOR INSERT WITH CHECK (true);


--
-- Name: entreprise Authenticated users can insert entreprise; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can insert entreprise" ON public.entreprise FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: postes Authenticated users can insert postes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can insert postes" ON public.postes FOR INSERT WITH CHECK (true);


--
-- Name: documents_rh Authenticated users can read documents_rh; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can read documents_rh" ON public.documents_rh FOR SELECT USING (true);


--
-- Name: entreprise Authenticated users can read entreprise; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can read entreprise" ON public.entreprise FOR SELECT TO authenticated USING (true);


--
-- Name: postes Authenticated users can read postes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can read postes" ON public.postes FOR SELECT USING (true);


--
-- Name: documents_rh Authenticated users can update documents_rh; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can update documents_rh" ON public.documents_rh FOR UPDATE USING (true);


--
-- Name: entreprise Authenticated users can update entreprise; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can update entreprise" ON public.entreprise FOR UPDATE TO authenticated USING (true);


--
-- Name: postes Authenticated users can update postes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can update postes" ON public.postes FOR UPDATE USING (true);


--
-- Name: adjuvants; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.adjuvants ENABLE ROW LEVEL SECURITY;

--
-- Name: affectations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.affectations ENABLE ROW LEVEL SECURITY;

--
-- Name: carrieres; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.carrieres ENABLE ROW LEVEL SECURITY;

--
-- Name: centrales_beton; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.centrales_beton ENABLE ROW LEVEL SECURITY;

--
-- Name: chantiers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chantiers ENABLE ROW LEVEL SECURITY;

--
-- Name: cimenteries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cimenteries ENABLE ROW LEVEL SECURITY;

--
-- Name: client_centrales; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_centrales ENABLE ROW LEVEL SECURITY;

--
-- Name: clients; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

--
-- Name: contrats; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contrats ENABLE ROW LEVEL SECURITY;

--
-- Name: documents_rh; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.documents_rh ENABLE ROW LEVEL SECURITY;

--
-- Name: echantillons_bleu_methylene; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.echantillons_bleu_methylene ENABLE ROW LEVEL SECURITY;

--
-- Name: echantillons_compression; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.echantillons_compression ENABLE ROW LEVEL SECURITY;

--
-- Name: echantillons_ecrasement; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.echantillons_ecrasement ENABLE ROW LEVEL SECURITY;

--
-- Name: echantillons_equivalent_sable; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.echantillons_equivalent_sable ENABLE ROW LEVEL SECURITY;

--
-- Name: echantillons_forme_granulats; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.echantillons_forme_granulats ENABLE ROW LEVEL SECURITY;

--
-- Name: echantillons_friabilite; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.echantillons_friabilite ENABLE ROW LEVEL SECURITY;

--
-- Name: echantillons_granulometrie; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.echantillons_granulometrie ENABLE ROW LEVEL SECURITY;

--
-- Name: echantillons_los_angeles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.echantillons_los_angeles ENABLE ROW LEVEL SECURITY;

--
-- Name: echantillons_masse_volumique; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.echantillons_masse_volumique ENABLE ROW LEVEL SECURITY;

--
-- Name: echantillons_matiere_organique; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.echantillons_matiere_organique ENABLE ROW LEVEL SECURITY;

--
-- Name: echantillons_micro_deval; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.echantillons_micro_deval ENABLE ROW LEVEL SECURITY;

--
-- Name: echantillons_teneur_eau; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.echantillons_teneur_eau ENABLE ROW LEVEL SECURITY;

--
-- Name: entreprise; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.entreprise ENABLE ROW LEVEL SECURITY;

--
-- Name: essais; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.essais ENABLE ROW LEVEL SECURITY;

--
-- Name: formulations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.formulations ENABLE ROW LEVEL SECURITY;

--
-- Name: intervenants; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.intervenants ENABLE ROW LEVEL SECURITY;

--
-- Name: laboratoires_mobiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.laboratoires_mobiles ENABLE ROW LEVEL SECURITY;

--
-- Name: materiel; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.materiel ENABLE ROW LEVEL SECURITY;

--
-- Name: postes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.postes ENABLE ROW LEVEL SECURITY;

--
-- Name: produits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.produits ENABLE ROW LEVEL SECURITY;

--
-- Name: sources_eau; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sources_eau ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;