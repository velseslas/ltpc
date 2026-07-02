export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      adjuvants: {
        Row: {
          adresse: string | null
          contact: string | null
          created_at: string
          email: string | null
          id: string
          nom: string
          produits: string | null
          telephone: string | null
          updated_at: string
          ville: string | null
        }
        Insert: {
          adresse?: string | null
          contact?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nom: string
          produits?: string | null
          telephone?: string | null
          updated_at?: string
          ville?: string | null
        }
        Update: {
          adresse?: string | null
          contact?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nom?: string
          produits?: string | null
          telephone?: string | null
          updated_at?: string
          ville?: string | null
        }
        Relationships: []
      }
      affectation_materiel: {
        Row: {
          chantier_id: string | null
          created_at: string
          date_debut: string
          date_fin: string | null
          id: string
          intervenant_id: string | null
          materiel_id: string
          observations: string | null
          quantite: number
          statut: string
          updated_at: string
        }
        Insert: {
          chantier_id?: string | null
          created_at?: string
          date_debut?: string
          date_fin?: string | null
          id?: string
          intervenant_id?: string | null
          materiel_id: string
          observations?: string | null
          quantite?: number
          statut?: string
          updated_at?: string
        }
        Update: {
          chantier_id?: string | null
          created_at?: string
          date_debut?: string
          date_fin?: string | null
          id?: string
          intervenant_id?: string | null
          materiel_id?: string
          observations?: string | null
          quantite?: number
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affectation_materiel_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affectation_materiel_intervenant_id_fkey"
            columns: ["intervenant_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affectation_materiel_materiel_id_fkey"
            columns: ["materiel_id"]
            isOneToOne: false
            referencedRelation: "materiel_laboratoire"
            referencedColumns: ["id"]
          },
        ]
      }
      affectations: {
        Row: {
          chantier_id: string
          client_id: string
          created_at: string
          date_debut: string
          date_fin: string | null
          id: string
          intervenant_id: string
          notes: string | null
          statut: string
          updated_at: string
        }
        Insert: {
          chantier_id: string
          client_id: string
          created_at?: string
          date_debut: string
          date_fin?: string | null
          id?: string
          intervenant_id: string
          notes?: string | null
          statut?: string
          updated_at?: string
        }
        Update: {
          chantier_id?: string
          client_id?: string
          created_at?: string
          date_debut?: string
          date_fin?: string | null
          id?: string
          intervenant_id?: string
          notes?: string | null
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affectations_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affectations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affectations_intervenant_id_fkey"
            columns: ["intervenant_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
        ]
      }
      attestations_bonne_execution: {
        Row: {
          chantier_id: string | null
          client_id: string | null
          created_at: string
          date_debut: string | null
          date_document: string
          date_fin: string | null
          document_nom: string | null
          document_url: string | null
          id: string
          numero: string | null
          observations: string | null
          statut: string
          titre: string
          updated_at: string
        }
        Insert: {
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_debut?: string | null
          date_document?: string
          date_fin?: string | null
          document_nom?: string | null
          document_url?: string | null
          id?: string
          numero?: string | null
          observations?: string | null
          statut?: string
          titre: string
          updated_at?: string
        }
        Update: {
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_debut?: string | null
          date_document?: string
          date_fin?: string | null
          document_nom?: string | null
          document_url?: string | null
          id?: string
          numero?: string | null
          observations?: string | null
          statut?: string
          titre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attestations_bonne_execution_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attestations_bonne_execution_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      bons_commande: {
        Row: {
          chantier_id: string | null
          client_id: string | null
          created_at: string
          date_commande: string
          id: string
          montant_ht: number
          montant_ttc: number
          montant_tva: number
          numero: string
          observations: string | null
          statut: string
          taux_tva: number
          updated_at: string
        }
        Insert: {
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_commande?: string
          id?: string
          montant_ht?: number
          montant_ttc?: number
          montant_tva?: number
          numero: string
          observations?: string | null
          statut?: string
          taux_tva?: number
          updated_at?: string
        }
        Update: {
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_commande?: string
          id?: string
          montant_ht?: number
          montant_ttc?: number
          montant_tva?: number
          numero?: string
          observations?: string | null
          statut?: string
          taux_tva?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bons_commande_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bons_commande_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      bons_commande_prestataire: {
        Row: {
          created_at: string
          date_commande: string
          id: string
          montant_ht: number
          montant_ttc: number
          montant_tva: number
          numero: string
          objet: string | null
          observations: string | null
          prestataire_id: string | null
          statut: string
          taux_tva: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_commande?: string
          id?: string
          montant_ht?: number
          montant_ttc?: number
          montant_tva?: number
          numero: string
          objet?: string | null
          observations?: string | null
          prestataire_id?: string | null
          statut?: string
          taux_tva?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_commande?: string
          id?: string
          montant_ht?: number
          montant_ttc?: number
          montant_tva?: number
          numero?: string
          objet?: string | null
          observations?: string | null
          prestataire_id?: string | null
          statut?: string
          taux_tva?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bons_commande_prestataire_prestataire_id_fkey"
            columns: ["prestataire_id"]
            isOneToOne: false
            referencedRelation: "prestataires"
            referencedColumns: ["id"]
          },
        ]
      }
      carrieres: {
        Row: {
          adresse: string | null
          contact: string | null
          created_at: string
          email: string | null
          id: string
          nom: string
          telephone: string | null
          type_agregat: string | null
          updated_at: string
          ville: string | null
        }
        Insert: {
          adresse?: string | null
          contact?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nom: string
          telephone?: string | null
          type_agregat?: string | null
          updated_at?: string
          ville?: string | null
        }
        Update: {
          adresse?: string | null
          contact?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nom?: string
          telephone?: string | null
          type_agregat?: string | null
          updated_at?: string
          ville?: string | null
        }
        Relationships: []
      }
      centrales_beton: {
        Row: {
          adresse: string | null
          capacite: string | null
          contact: string | null
          created_at: string
          email: string | null
          id: string
          nom: string
          telephone: string | null
          updated_at: string
          ville: string | null
        }
        Insert: {
          adresse?: string | null
          capacite?: string | null
          contact?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nom: string
          telephone?: string | null
          updated_at?: string
          ville?: string | null
        }
        Update: {
          adresse?: string | null
          capacite?: string | null
          contact?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nom?: string
          telephone?: string | null
          updated_at?: string
          ville?: string | null
        }
        Relationships: []
      }
      chantiers: {
        Row: {
          adresse: string | null
          client_id: string | null
          contact: string | null
          created_at: string
          date_debut: string | null
          date_fin: string | null
          description: string | null
          id: string
          nom: string
          statut: string
          telephone: string | null
          updated_at: string
          ville: string | null
        }
        Insert: {
          adresse?: string | null
          client_id?: string | null
          contact?: string | null
          created_at?: string
          date_debut?: string | null
          date_fin?: string | null
          description?: string | null
          id?: string
          nom: string
          statut?: string
          telephone?: string | null
          updated_at?: string
          ville?: string | null
        }
        Update: {
          adresse?: string | null
          client_id?: string | null
          contact?: string | null
          created_at?: string
          date_debut?: string | null
          date_fin?: string | null
          description?: string | null
          id?: string
          nom?: string
          statut?: string
          telephone?: string | null
          updated_at?: string
          ville?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chantiers_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      cimenteries: {
        Row: {
          adresse: string | null
          capacite: string | null
          contact: string | null
          created_at: string
          email: string | null
          id: string
          nom: string
          telephone: string | null
          updated_at: string
          ville: string | null
        }
        Insert: {
          adresse?: string | null
          capacite?: string | null
          contact?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nom: string
          telephone?: string | null
          updated_at?: string
          ville?: string | null
        }
        Update: {
          adresse?: string | null
          capacite?: string | null
          contact?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nom?: string
          telephone?: string | null
          updated_at?: string
          ville?: string | null
        }
        Relationships: []
      }
      client_centrales: {
        Row: {
          centrale_id: string
          chantier_id: string | null
          client_id: string
          created_at: string
          id: string
        }
        Insert: {
          centrale_id: string
          chantier_id?: string | null
          client_id: string
          created_at?: string
          id?: string
        }
        Update: {
          centrale_id?: string
          chantier_id?: string | null
          client_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_centrales_centrale_id_fkey"
            columns: ["centrale_id"]
            isOneToOne: false
            referencedRelation: "centrales_beton"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_centrales_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_centrales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_maitres_oeuvre: {
        Row: {
          client_id: string
          created_at: string
          id: string
          maitre_oeuvre_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          maitre_oeuvre_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          maitre_oeuvre_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_maitres_oeuvre_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_maitres_oeuvre_maitre_oeuvre_id_fkey"
            columns: ["maitre_oeuvre_id"]
            isOneToOne: false
            referencedRelation: "maitres_oeuvre"
            referencedColumns: ["id"]
          },
        ]
      }
      client_maitres_ouvrage: {
        Row: {
          client_id: string
          created_at: string
          id: string
          maitre_ouvrage_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          maitre_ouvrage_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          maitre_ouvrage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_maitres_ouvrage_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_maitres_ouvrage_maitre_ouvrage_id_fkey"
            columns: ["maitre_ouvrage_id"]
            isOneToOne: false
            referencedRelation: "maitres_ouvrage"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          adresse: string | null
          agence: string | null
          article_imposition: string | null
          banque: string | null
          contact: string | null
          created_at: string
          email: string | null
          ice: string | null
          id: string
          nif: string | null
          nis: string | null
          nom: string
          rc: string | null
          representant: string | null
          rib: string | null
          telephone: string | null
          updated_at: string
          ville: string | null
        }
        Insert: {
          adresse?: string | null
          agence?: string | null
          article_imposition?: string | null
          banque?: string | null
          contact?: string | null
          created_at?: string
          email?: string | null
          ice?: string | null
          id?: string
          nif?: string | null
          nis?: string | null
          nom: string
          rc?: string | null
          representant?: string | null
          rib?: string | null
          telephone?: string | null
          updated_at?: string
          ville?: string | null
        }
        Update: {
          adresse?: string | null
          agence?: string | null
          article_imposition?: string | null
          banque?: string | null
          contact?: string | null
          created_at?: string
          email?: string | null
          ice?: string | null
          id?: string
          nif?: string | null
          nis?: string | null
          nom?: string
          rc?: string | null
          representant?: string | null
          rib?: string | null
          telephone?: string | null
          updated_at?: string
          ville?: string | null
        }
        Relationships: []
      }
      contrat_articles: {
        Row: {
          article_number: number
          contenu: string
          contrat_id: string
          created_at: string
          id: string
          titre: string
          updated_at: string
        }
        Insert: {
          article_number: number
          contenu: string
          contrat_id: string
          created_at?: string
          id?: string
          titre: string
          updated_at?: string
        }
        Update: {
          article_number?: number
          contenu?: string
          contrat_id?: string
          created_at?: string
          id?: string
          titre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contrat_articles_contrat_id_fkey"
            columns: ["contrat_id"]
            isOneToOne: false
            referencedRelation: "contrats"
            referencedColumns: ["id"]
          },
        ]
      }
      contrats: {
        Row: {
          chantier_id: string | null
          client_id: string | null
          created_at: string
          date_expiration: string | null
          date_signature: string | null
          document_nom: string | null
          document_url: string | null
          id: string
          statut: string
          titre: string
          updated_at: string
        }
        Insert: {
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_expiration?: string | null
          date_signature?: string | null
          document_nom?: string | null
          document_url?: string | null
          id?: string
          statut?: string
          titre: string
          updated_at?: string
        }
        Update: {
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_expiration?: string | null
          date_signature?: string | null
          document_nom?: string | null
          document_url?: string | null
          id?: string
          statut?: string
          titre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contrats_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contrats_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      devis: {
        Row: {
          chantier_id: string | null
          client_id: string | null
          created_at: string
          date_emission: string
          date_validite: string | null
          id: string
          montant_ht: number
          montant_ttc: number
          montant_tva: number
          numero: string
          observations: string | null
          statut: string
          taux_tva: number
          updated_at: string
        }
        Insert: {
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_emission?: string
          date_validite?: string | null
          id?: string
          montant_ht?: number
          montant_ttc?: number
          montant_tva?: number
          numero: string
          observations?: string | null
          statut?: string
          taux_tva?: number
          updated_at?: string
        }
        Update: {
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_emission?: string
          date_validite?: string | null
          id?: string
          montant_ht?: number
          montant_ttc?: number
          montant_tva?: number
          numero?: string
          observations?: string | null
          statut?: string
          taux_tva?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "devis_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devis_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      documents_administratifs: {
        Row: {
          client_id: string | null
          created_at: string
          document_nom: string | null
          document_url: string | null
          id: string
          titre: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          document_nom?: string | null
          document_url?: string | null
          id?: string
          titre: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          document_nom?: string | null
          document_url?: string | null
          id?: string
          titre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_administratifs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      documents_rh: {
        Row: {
          created_at: string
          id: string
          intervenant_id: string
          nom_fichier: string | null
          type_document: string
          updated_at: string
          url_fichier: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          intervenant_id: string
          nom_fichier?: string | null
          type_document: string
          updated_at?: string
          url_fichier?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          intervenant_id?: string
          nom_fichier?: string | null
          type_document?: string
          updated_at?: string
          url_fichier?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_rh_intervenant_id_fkey"
            columns: ["intervenant_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
        ]
      }
      echantillons_affaissement: {
        Row: {
          centrale_id: string | null
          chantier_id: string | null
          classe_consistance: string | null
          classe_resistance: string | null
          client_id: string | null
          created_at: string
          date_prelevement: string
          destination_beton: string | null
          essai_convenance: boolean | null
          essai_convenance_details: string | null
          formulation_id: string | null
          heure_prelevement: string | null
          id: string
          numero: number
          observations: string | null
          operateur_id: string | null
          ouvrage: string | null
          resultats: Json | null
          statut: string
          temperature_air: number | null
          temperature_ambiante: number | null
          temperature_beton: number | null
          updated_at: string
        }
        Insert: {
          centrale_id?: string | null
          chantier_id?: string | null
          classe_consistance?: string | null
          classe_resistance?: string | null
          client_id?: string | null
          created_at?: string
          date_prelevement?: string
          destination_beton?: string | null
          essai_convenance?: boolean | null
          essai_convenance_details?: string | null
          formulation_id?: string | null
          heure_prelevement?: string | null
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          ouvrage?: string | null
          resultats?: Json | null
          statut?: string
          temperature_air?: number | null
          temperature_ambiante?: number | null
          temperature_beton?: number | null
          updated_at?: string
        }
        Update: {
          centrale_id?: string | null
          chantier_id?: string | null
          classe_consistance?: string | null
          classe_resistance?: string | null
          client_id?: string | null
          created_at?: string
          date_prelevement?: string
          destination_beton?: string | null
          essai_convenance?: boolean | null
          essai_convenance_details?: string | null
          formulation_id?: string | null
          heure_prelevement?: string | null
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          ouvrage?: string | null
          resultats?: Json | null
          statut?: string
          temperature_air?: number | null
          temperature_ambiante?: number | null
          temperature_beton?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "echantillons_affaissement_centrale_id_fkey"
            columns: ["centrale_id"]
            isOneToOne: false
            referencedRelation: "centrales_beton"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_affaissement_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_affaissement_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_affaissement_formulation_id_fkey"
            columns: ["formulation_id"]
            isOneToOne: false
            referencedRelation: "formulations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_affaissement_operateur_id_fkey"
            columns: ["operateur_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
        ]
      }
      echantillons_bleu_methylene: {
        Row: {
          carriere_id: string | null
          chantier_id: string | null
          client_id: string | null
          created_at: string
          date_essai: string | null
          date_reception: string
          id: string
          numero: number
          observations: string | null
          operateur_id: string | null
          produit: string
          resultats: Json | null
          statut: string
          updated_at: string
        }
        Insert: {
          carriere_id?: string | null
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_essai?: string | null
          date_reception?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          produit: string
          resultats?: Json | null
          statut?: string
          updated_at?: string
        }
        Update: {
          carriere_id?: string | null
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_essai?: string | null
          date_reception?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          produit?: string
          resultats?: Json | null
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "echantillons_bleu_methylene_carriere_id_fkey"
            columns: ["carriere_id"]
            isOneToOne: false
            referencedRelation: "carrieres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_bleu_methylene_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_bleu_methylene_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_bleu_methylene_operateur_id_fkey"
            columns: ["operateur_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
        ]
      }
      echantillons_carottage: {
        Row: {
          chantier_id: string | null
          classe_resistance: string | null
          client_id: string | null
          created_at: string
          date_essai: string | null
          date_prelevement: string
          diametre_carotte: string | null
          direction_carottage: string | null
          etat_surface: string | null
          id: string
          localisation: string | null
          longueur_carotte: number | null
          numero: number
          observations: string | null
          operateur_id: string | null
          ouvrage: string | null
          partie_ouvrage: string | null
          presence_armatures: boolean | null
          resultats: Json | null
          statut: string
          updated_at: string
        }
        Insert: {
          chantier_id?: string | null
          classe_resistance?: string | null
          client_id?: string | null
          created_at?: string
          date_essai?: string | null
          date_prelevement?: string
          diametre_carotte?: string | null
          direction_carottage?: string | null
          etat_surface?: string | null
          id?: string
          localisation?: string | null
          longueur_carotte?: number | null
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          ouvrage?: string | null
          partie_ouvrage?: string | null
          presence_armatures?: boolean | null
          resultats?: Json | null
          statut?: string
          updated_at?: string
        }
        Update: {
          chantier_id?: string | null
          classe_resistance?: string | null
          client_id?: string | null
          created_at?: string
          date_essai?: string | null
          date_prelevement?: string
          diametre_carotte?: string | null
          direction_carottage?: string | null
          etat_surface?: string | null
          id?: string
          localisation?: string | null
          longueur_carotte?: number | null
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          ouvrage?: string | null
          partie_ouvrage?: string | null
          presence_armatures?: boolean | null
          resultats?: Json | null
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "echantillons_carottage_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_carottage_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_carottage_operateur_id_fkey"
            columns: ["operateur_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
        ]
      }
      echantillons_cbr: {
        Row: {
          carriere_id: string | null
          chantier_id: string | null
          client_id: string | null
          created_at: string
          date_essai: string | null
          date_prelevement: string
          id: string
          numero: number
          observations: string | null
          operateur_id: string | null
          profondeur: string | null
          resultats: Json | null
          statut: string
          type_sol: string
          updated_at: string
        }
        Insert: {
          carriere_id?: string | null
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_essai?: string | null
          date_prelevement?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          profondeur?: string | null
          resultats?: Json | null
          statut?: string
          type_sol: string
          updated_at?: string
        }
        Update: {
          carriere_id?: string | null
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_essai?: string | null
          date_prelevement?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          profondeur?: string | null
          resultats?: Json | null
          statut?: string
          type_sol?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "echantillons_cbr_carriere_id_fkey"
            columns: ["carriere_id"]
            isOneToOne: false
            referencedRelation: "carrieres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_cbr_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_cbr_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_cbr_operateur_id_fkey"
            columns: ["operateur_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
        ]
      }
      echantillons_cisaillement: {
        Row: {
          chantier_id: string | null
          client_id: string | null
          created_at: string
          date_prelevement: string
          id: string
          numero: number
          observations: string | null
          operateur_id: string | null
          profondeur: string | null
          resultats: Json | null
          statut: string
          type_sol: string
          updated_at: string
        }
        Insert: {
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_prelevement?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          profondeur?: string | null
          resultats?: Json | null
          statut?: string
          type_sol: string
          updated_at?: string
        }
        Update: {
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_prelevement?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          profondeur?: string | null
          resultats?: Json | null
          statut?: string
          type_sol?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "echantillons_cisaillement_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_cisaillement_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_cisaillement_operateur_id_fkey"
            columns: ["operateur_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
        ]
      }
      echantillons_classification_sol: {
        Row: {
          carriere_id: string | null
          chantier_id: string | null
          client_id: string | null
          created_at: string
          date_essai: string | null
          date_prelevement: string
          id: string
          numero: number
          observations: string | null
          operateur_id: string | null
          profondeur: string | null
          resultats: Json | null
          statut: string
          type_sol: string
          updated_at: string
        }
        Insert: {
          carriere_id?: string | null
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_essai?: string | null
          date_prelevement?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          profondeur?: string | null
          resultats?: Json | null
          statut?: string
          type_sol: string
          updated_at?: string
        }
        Update: {
          carriere_id?: string | null
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_essai?: string | null
          date_prelevement?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          profondeur?: string | null
          resultats?: Json | null
          statut?: string
          type_sol?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "echantillons_classification_sol_carriere_id_fkey"
            columns: ["carriere_id"]
            isOneToOne: false
            referencedRelation: "carrieres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_classification_sol_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_classification_sol_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_classification_sol_operateur_id_fkey"
            columns: ["operateur_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
        ]
      }
      echantillons_compression: {
        Row: {
          centrale_id: string | null
          chantier_id: string | null
          classe_consistance: string | null
          classe_resistance: string | null
          client_id: string | null
          condition_cure: string | null
          created_at: string
          date_coulage: string | null
          date_essai: string | null
          destination_beton: string | null
          dimension_eprouvette: string | null
          essai_convenance: boolean
          essai_convenance_details: string | null
          etuvage: string | null
          formulation_id: string | null
          id: string
          is_laboratoire_chantier: boolean
          jours_essai: Json | null
          mention_eprouvette_client: boolean
          mention_info_client: boolean
          mode_coulage: string | null
          nombre_eprouvettes: number | null
          numero: number
          numero_chantier: number | null
          observations: string | null
          operateur_id: string | null
          ouvrage: string | null
          resultats: Json | null
          statut: string
          temperature_air: number | null
          temperature_beton: number | null
          type_eprouvette: string | null
          updated_at: string
          usage: string | null
        }
        Insert: {
          centrale_id?: string | null
          chantier_id?: string | null
          classe_consistance?: string | null
          classe_resistance?: string | null
          client_id?: string | null
          condition_cure?: string | null
          created_at?: string
          date_coulage?: string | null
          date_essai?: string | null
          destination_beton?: string | null
          dimension_eprouvette?: string | null
          essai_convenance?: boolean
          essai_convenance_details?: string | null
          etuvage?: string | null
          formulation_id?: string | null
          id?: string
          is_laboratoire_chantier?: boolean
          jours_essai?: Json | null
          mention_eprouvette_client?: boolean
          mention_info_client?: boolean
          mode_coulage?: string | null
          nombre_eprouvettes?: number | null
          numero?: number
          numero_chantier?: number | null
          observations?: string | null
          operateur_id?: string | null
          ouvrage?: string | null
          resultats?: Json | null
          statut?: string
          temperature_air?: number | null
          temperature_beton?: number | null
          type_eprouvette?: string | null
          updated_at?: string
          usage?: string | null
        }
        Update: {
          centrale_id?: string | null
          chantier_id?: string | null
          classe_consistance?: string | null
          classe_resistance?: string | null
          client_id?: string | null
          condition_cure?: string | null
          created_at?: string
          date_coulage?: string | null
          date_essai?: string | null
          destination_beton?: string | null
          dimension_eprouvette?: string | null
          essai_convenance?: boolean
          essai_convenance_details?: string | null
          etuvage?: string | null
          formulation_id?: string | null
          id?: string
          is_laboratoire_chantier?: boolean
          jours_essai?: Json | null
          mention_eprouvette_client?: boolean
          mention_info_client?: boolean
          mode_coulage?: string | null
          nombre_eprouvettes?: number | null
          numero?: number
          numero_chantier?: number | null
          observations?: string | null
          operateur_id?: string | null
          ouvrage?: string | null
          resultats?: Json | null
          statut?: string
          temperature_air?: number | null
          temperature_beton?: number | null
          type_eprouvette?: string | null
          updated_at?: string
          usage?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "echantillons_compression_centrale_id_fkey"
            columns: ["centrale_id"]
            isOneToOne: false
            referencedRelation: "centrales_beton"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_compression_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_compression_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_compression_formulation_id_fkey"
            columns: ["formulation_id"]
            isOneToOne: false
            referencedRelation: "formulations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_compression_operateur_id_fkey"
            columns: ["operateur_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
        ]
      }
      echantillons_compression_simple: {
        Row: {
          chantier_id: string | null
          client_id: string | null
          created_at: string
          date_prelevement: string
          id: string
          numero: number
          observations: string | null
          operateur_id: string | null
          profondeur: string | null
          resultats: Json | null
          statut: string
          type_sol: string
          updated_at: string
        }
        Insert: {
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_prelevement?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          profondeur?: string | null
          resultats?: Json | null
          statut?: string
          type_sol: string
          updated_at?: string
        }
        Update: {
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_prelevement?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          profondeur?: string | null
          resultats?: Json | null
          statut?: string
          type_sol?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "echantillons_compression_simple_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_compression_simple_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_compression_simple_operateur_id_fkey"
            columns: ["operateur_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
        ]
      }
      echantillons_densite_place: {
        Row: {
          chantier_id: string | null
          client_id: string | null
          created_at: string
          date_prelevement: string
          id: string
          numero: number
          observations: string | null
          operateur_id: string | null
          profondeur: string | null
          resultats: Json | null
          statut: string
          type_sol: string
          updated_at: string
        }
        Insert: {
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_prelevement?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          profondeur?: string | null
          resultats?: Json | null
          statut?: string
          type_sol: string
          updated_at?: string
        }
        Update: {
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_prelevement?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          profondeur?: string | null
          resultats?: Json | null
          statut?: string
          type_sol?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "echantillons_densite_place_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_densite_place_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_densite_place_operateur_id_fkey"
            columns: ["operateur_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
        ]
      }
      echantillons_densitometre: {
        Row: {
          chantier_id: string | null
          client_id: string | null
          created_at: string
          date_essai: string | null
          date_prelevement: string
          id: string
          numero: number
          observations: string | null
          operateur_id: string | null
          profondeur: string | null
          resultats: Json | null
          statut: string
          type_sol: string
          updated_at: string
        }
        Insert: {
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_essai?: string | null
          date_prelevement?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          profondeur?: string | null
          resultats?: Json | null
          statut?: string
          type_sol?: string
          updated_at?: string
        }
        Update: {
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_essai?: string | null
          date_prelevement?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          profondeur?: string | null
          resultats?: Json | null
          statut?: string
          type_sol?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "echantillons_densitometre_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_densitometre_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_densitometre_operateur_id_fkey"
            columns: ["operateur_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
        ]
      }
      echantillons_ecrasement: {
        Row: {
          carriere_id: string | null
          chantier_id: string | null
          client_id: string | null
          created_at: string
          date_essai: string | null
          date_reception: string
          id: string
          numero: number
          observations: string | null
          operateur_id: string | null
          produit: string
          resultats: Json | null
          statut: string
          updated_at: string
        }
        Insert: {
          carriere_id?: string | null
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_essai?: string | null
          date_reception?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          produit: string
          resultats?: Json | null
          statut?: string
          updated_at?: string
        }
        Update: {
          carriere_id?: string | null
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_essai?: string | null
          date_reception?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          produit?: string
          resultats?: Json | null
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "echantillons_ecrasement_carriere_id_fkey"
            columns: ["carriere_id"]
            isOneToOne: false
            referencedRelation: "carrieres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_ecrasement_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_ecrasement_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_ecrasement_operateur_id_fkey"
            columns: ["operateur_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
        ]
      }
      echantillons_equivalent_sable: {
        Row: {
          carriere_id: string | null
          chantier_id: string | null
          client_id: string | null
          created_at: string
          date_essai: string | null
          date_reception: string
          id: string
          numero: number
          observations: string | null
          operateur_id: string | null
          produit: string
          resultats: Json | null
          statut: string
          updated_at: string
        }
        Insert: {
          carriere_id?: string | null
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_essai?: string | null
          date_reception?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          produit: string
          resultats?: Json | null
          statut?: string
          updated_at?: string
        }
        Update: {
          carriere_id?: string | null
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_essai?: string | null
          date_reception?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          produit?: string
          resultats?: Json | null
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "echantillons_equivalent_sable_carriere_id_fkey"
            columns: ["carriere_id"]
            isOneToOne: false
            referencedRelation: "carrieres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_equivalent_sable_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_equivalent_sable_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_equivalent_sable_operateur_id_fkey"
            columns: ["operateur_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
        ]
      }
      echantillons_forme_granulats: {
        Row: {
          carriere_id: string | null
          chantier_id: string | null
          client_id: string | null
          created_at: string
          date_essai: string | null
          date_reception: string
          id: string
          numero: number
          observations: string | null
          operateur_id: string | null
          produit: string
          resultats: Json | null
          statut: string
          updated_at: string
        }
        Insert: {
          carriere_id?: string | null
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_essai?: string | null
          date_reception?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          produit: string
          resultats?: Json | null
          statut?: string
          updated_at?: string
        }
        Update: {
          carriere_id?: string | null
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_essai?: string | null
          date_reception?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          produit?: string
          resultats?: Json | null
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "echantillons_forme_granulats_carriere_id_fkey"
            columns: ["carriere_id"]
            isOneToOne: false
            referencedRelation: "carrieres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_forme_granulats_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_forme_granulats_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_forme_granulats_operateur_id_fkey"
            columns: ["operateur_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
        ]
      }
      echantillons_friabilite: {
        Row: {
          carriere_id: string | null
          chantier_id: string | null
          client_id: string | null
          created_at: string
          date_essai: string | null
          date_reception: string
          id: string
          numero: number
          observations: string | null
          operateur_id: string | null
          produit: string
          resultats: Json | null
          statut: string
          updated_at: string
        }
        Insert: {
          carriere_id?: string | null
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_essai?: string | null
          date_reception?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          produit: string
          resultats?: Json | null
          statut?: string
          updated_at?: string
        }
        Update: {
          carriere_id?: string | null
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_essai?: string | null
          date_reception?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          produit?: string
          resultats?: Json | null
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "echantillons_friabilite_carriere_id_fkey"
            columns: ["carriere_id"]
            isOneToOne: false
            referencedRelation: "carrieres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_friabilite_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_friabilite_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_friabilite_operateur_id_fkey"
            columns: ["operateur_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
        ]
      }
      echantillons_granulometrie: {
        Row: {
          carriere_id: string | null
          chantier_id: string | null
          client_id: string | null
          created_at: string
          date_essai: string | null
          date_reception: string
          id: string
          numero: number
          observations: string | null
          operateur_id: string | null
          produit: string
          resultats: Json | null
          statut: string
          updated_at: string
        }
        Insert: {
          carriere_id?: string | null
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_essai?: string | null
          date_reception?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          produit: string
          resultats?: Json | null
          statut?: string
          updated_at?: string
        }
        Update: {
          carriere_id?: string | null
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_essai?: string | null
          date_reception?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          produit?: string
          resultats?: Json | null
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "echantillons_granulometrie_carriere_id_fkey"
            columns: ["carriere_id"]
            isOneToOne: false
            referencedRelation: "carrieres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_granulometrie_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_granulometrie_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_granulometrie_operateur_id_fkey"
            columns: ["operateur_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
        ]
      }
      echantillons_granulometrie_sol: {
        Row: {
          carriere_id: string | null
          chantier_id: string | null
          client_id: string | null
          created_at: string
          date_essai: string | null
          date_prelevement: string
          id: string
          numero: number
          observations: string | null
          operateur_id: string | null
          profondeur: string | null
          resultats: Json | null
          statut: string
          type_sol: string
          updated_at: string
        }
        Insert: {
          carriere_id?: string | null
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_essai?: string | null
          date_prelevement?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          profondeur?: string | null
          resultats?: Json | null
          statut?: string
          type_sol: string
          updated_at?: string
        }
        Update: {
          carriere_id?: string | null
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_essai?: string | null
          date_prelevement?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          profondeur?: string | null
          resultats?: Json | null
          statut?: string
          type_sol?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "echantillons_granulometrie_sol_carriere_id_fkey"
            columns: ["carriere_id"]
            isOneToOne: false
            referencedRelation: "carrieres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_granulometrie_sol_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_granulometrie_sol_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_granulometrie_sol_operateur_id_fkey"
            columns: ["operateur_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
        ]
      }
      echantillons_limites_atterberg: {
        Row: {
          carriere_id: string | null
          chantier_id: string | null
          client_id: string | null
          created_at: string
          date_essai: string | null
          date_prelevement: string
          id: string
          numero: number
          observations: string | null
          operateur_id: string | null
          profondeur: string | null
          resultats: Json | null
          statut: string
          type_sol: string
          updated_at: string
        }
        Insert: {
          carriere_id?: string | null
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_essai?: string | null
          date_prelevement?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          profondeur?: string | null
          resultats?: Json | null
          statut?: string
          type_sol: string
          updated_at?: string
        }
        Update: {
          carriere_id?: string | null
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_essai?: string | null
          date_prelevement?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          profondeur?: string | null
          resultats?: Json | null
          statut?: string
          type_sol?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "echantillons_limites_atterberg_carriere_id_fkey"
            columns: ["carriere_id"]
            isOneToOne: false
            referencedRelation: "carrieres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_limites_atterberg_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_limites_atterberg_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_limites_atterberg_operateur_id_fkey"
            columns: ["operateur_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
        ]
      }
      echantillons_los_angeles: {
        Row: {
          carriere_id: string | null
          chantier_id: string | null
          client_id: string | null
          created_at: string
          date_essai: string | null
          date_reception: string
          id: string
          numero: number
          observations: string | null
          operateur_id: string | null
          produit: string
          resultats: Json | null
          statut: string
          updated_at: string
        }
        Insert: {
          carriere_id?: string | null
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_essai?: string | null
          date_reception?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          produit: string
          resultats?: Json | null
          statut?: string
          updated_at?: string
        }
        Update: {
          carriere_id?: string | null
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_essai?: string | null
          date_reception?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          produit?: string
          resultats?: Json | null
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "echantillons_los_angeles_carriere_id_fkey"
            columns: ["carriere_id"]
            isOneToOne: false
            referencedRelation: "carrieres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_los_angeles_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_los_angeles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_los_angeles_operateur_id_fkey"
            columns: ["operateur_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
        ]
      }
      echantillons_masse_volumique: {
        Row: {
          carriere_id: string | null
          chantier_id: string | null
          client_id: string | null
          created_at: string
          date_essai: string | null
          date_reception: string
          id: string
          numero: number
          observations: string | null
          operateur_id: string | null
          produit: string
          resultats: Json | null
          statut: string
          updated_at: string
        }
        Insert: {
          carriere_id?: string | null
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_essai?: string | null
          date_reception?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          produit: string
          resultats?: Json | null
          statut?: string
          updated_at?: string
        }
        Update: {
          carriere_id?: string | null
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_essai?: string | null
          date_reception?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          produit?: string
          resultats?: Json | null
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "echantillons_masse_volumique_carriere_id_fkey"
            columns: ["carriere_id"]
            isOneToOne: false
            referencedRelation: "carrieres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_masse_volumique_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_masse_volumique_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_masse_volumique_operateur_id_fkey"
            columns: ["operateur_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
        ]
      }
      echantillons_matiere_organique: {
        Row: {
          carriere_id: string | null
          chantier_id: string | null
          client_id: string | null
          created_at: string
          date_essai: string | null
          date_reception: string
          id: string
          numero: number
          observations: string | null
          operateur_id: string | null
          produit: string
          resultats: Json | null
          statut: string
          updated_at: string
        }
        Insert: {
          carriere_id?: string | null
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_essai?: string | null
          date_reception?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          produit: string
          resultats?: Json | null
          statut?: string
          updated_at?: string
        }
        Update: {
          carriere_id?: string | null
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_essai?: string | null
          date_reception?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          produit?: string
          resultats?: Json | null
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "echantillons_matiere_organique_carriere_id_fkey"
            columns: ["carriere_id"]
            isOneToOne: false
            referencedRelation: "carrieres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_matiere_organique_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_matiere_organique_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_matiere_organique_operateur_id_fkey"
            columns: ["operateur_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
        ]
      }
      echantillons_micro_deval: {
        Row: {
          carriere_id: string | null
          chantier_id: string | null
          client_id: string | null
          created_at: string
          date_essai: string | null
          date_reception: string
          id: string
          numero: number
          observations: string | null
          operateur_id: string | null
          produit: string
          resultats: Json | null
          statut: string
          updated_at: string
        }
        Insert: {
          carriere_id?: string | null
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_essai?: string | null
          date_reception?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          produit: string
          resultats?: Json | null
          statut?: string
          updated_at?: string
        }
        Update: {
          carriere_id?: string | null
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_essai?: string | null
          date_reception?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          produit?: string
          resultats?: Json | null
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "echantillons_micro_deval_carriere_id_fkey"
            columns: ["carriere_id"]
            isOneToOne: false
            referencedRelation: "carrieres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_micro_deval_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_micro_deval_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_micro_deval_operateur_id_fkey"
            columns: ["operateur_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
        ]
      }
      echantillons_module_elasticite: {
        Row: {
          centrale_id: string | null
          chantier_id: string | null
          classe_consistance: string | null
          classe_resistance: string | null
          client_id: string | null
          condition_cure: string | null
          created_at: string
          date_coulage: string | null
          destination_beton: string | null
          dimension_eprouvette: string | null
          essai_convenance: boolean
          essai_convenance_details: string | null
          formulation_id: string | null
          id: string
          jours_essai: Json | null
          nombre_eprouvettes: number | null
          numero: number
          observations: string | null
          operateur_id: string | null
          ouvrage: string | null
          resultats: Json | null
          statut: string
          temperature_air: number | null
          temperature_beton: number | null
          type_eprouvette: string | null
          updated_at: string
        }
        Insert: {
          centrale_id?: string | null
          chantier_id?: string | null
          classe_consistance?: string | null
          classe_resistance?: string | null
          client_id?: string | null
          condition_cure?: string | null
          created_at?: string
          date_coulage?: string | null
          destination_beton?: string | null
          dimension_eprouvette?: string | null
          essai_convenance?: boolean
          essai_convenance_details?: string | null
          formulation_id?: string | null
          id?: string
          jours_essai?: Json | null
          nombre_eprouvettes?: number | null
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          ouvrage?: string | null
          resultats?: Json | null
          statut?: string
          temperature_air?: number | null
          temperature_beton?: number | null
          type_eprouvette?: string | null
          updated_at?: string
        }
        Update: {
          centrale_id?: string | null
          chantier_id?: string | null
          classe_consistance?: string | null
          classe_resistance?: string | null
          client_id?: string | null
          condition_cure?: string | null
          created_at?: string
          date_coulage?: string | null
          destination_beton?: string | null
          dimension_eprouvette?: string | null
          essai_convenance?: boolean
          essai_convenance_details?: string | null
          formulation_id?: string | null
          id?: string
          jours_essai?: Json | null
          nombre_eprouvettes?: number | null
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          ouvrage?: string | null
          resultats?: Json | null
          statut?: string
          temperature_air?: number | null
          temperature_beton?: number | null
          type_eprouvette?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "echantillons_module_elasticite_centrale_id_fkey"
            columns: ["centrale_id"]
            isOneToOne: false
            referencedRelation: "centrales_beton"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_module_elasticite_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_module_elasticite_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_module_elasticite_formulation_id_fkey"
            columns: ["formulation_id"]
            isOneToOne: false
            referencedRelation: "formulations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_module_elasticite_operateur_id_fkey"
            columns: ["operateur_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
        ]
      }
      echantillons_oedometrique: {
        Row: {
          chantier_id: string | null
          client_id: string | null
          created_at: string
          date_prelevement: string
          id: string
          numero: number
          observations: string | null
          operateur_id: string | null
          profondeur: string | null
          resultats: Json | null
          statut: string
          type_sol: string
          updated_at: string
        }
        Insert: {
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_prelevement?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          profondeur?: string | null
          resultats?: Json | null
          statut?: string
          type_sol: string
          updated_at?: string
        }
        Update: {
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_prelevement?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          profondeur?: string | null
          resultats?: Json | null
          statut?: string
          type_sol?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "echantillons_oedometrique_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_oedometrique_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_oedometrique_operateur_id_fkey"
            columns: ["operateur_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
        ]
      }
      echantillons_penetrometre: {
        Row: {
          chantier_id: string | null
          client_id: string | null
          created_at: string
          date_prelevement: string
          id: string
          numero: number
          observations: string | null
          operateur_id: string | null
          profondeur: string | null
          resultats: Json | null
          statut: string
          type_sol: string
          updated_at: string
        }
        Insert: {
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_prelevement?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          profondeur?: string | null
          resultats?: Json | null
          statut?: string
          type_sol: string
          updated_at?: string
        }
        Update: {
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_prelevement?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          profondeur?: string | null
          resultats?: Json | null
          statut?: string
          type_sol?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "echantillons_penetrometre_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_penetrometre_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_penetrometre_operateur_id_fkey"
            columns: ["operateur_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
        ]
      }
      echantillons_permeabilite: {
        Row: {
          centrale_id: string | null
          chantier_id: string | null
          classe_consistance: string | null
          classe_resistance: string | null
          client_id: string | null
          condition_cure: string | null
          created_at: string
          date_coulage: string | null
          destination_beton: string | null
          dimension_eprouvette: string | null
          duree_essai: number | null
          essai_convenance: boolean
          essai_convenance_details: string | null
          formulation_id: string | null
          id: string
          jours_essai: Json | null
          nombre_eprouvettes: number | null
          numero: number
          observations: string | null
          operateur_id: string | null
          ouvrage: string | null
          pression_essai: number | null
          resultats: Json | null
          statut: string
          temperature_air: number | null
          temperature_beton: number | null
          type_eprouvette: string | null
          updated_at: string
        }
        Insert: {
          centrale_id?: string | null
          chantier_id?: string | null
          classe_consistance?: string | null
          classe_resistance?: string | null
          client_id?: string | null
          condition_cure?: string | null
          created_at?: string
          date_coulage?: string | null
          destination_beton?: string | null
          dimension_eprouvette?: string | null
          duree_essai?: number | null
          essai_convenance?: boolean
          essai_convenance_details?: string | null
          formulation_id?: string | null
          id?: string
          jours_essai?: Json | null
          nombre_eprouvettes?: number | null
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          ouvrage?: string | null
          pression_essai?: number | null
          resultats?: Json | null
          statut?: string
          temperature_air?: number | null
          temperature_beton?: number | null
          type_eprouvette?: string | null
          updated_at?: string
        }
        Update: {
          centrale_id?: string | null
          chantier_id?: string | null
          classe_consistance?: string | null
          classe_resistance?: string | null
          client_id?: string | null
          condition_cure?: string | null
          created_at?: string
          date_coulage?: string | null
          destination_beton?: string | null
          dimension_eprouvette?: string | null
          duree_essai?: number | null
          essai_convenance?: boolean
          essai_convenance_details?: string | null
          formulation_id?: string | null
          id?: string
          jours_essai?: Json | null
          nombre_eprouvettes?: number | null
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          ouvrage?: string | null
          pression_essai?: number | null
          resultats?: Json | null
          statut?: string
          temperature_air?: number | null
          temperature_beton?: number | null
          type_eprouvette?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "echantillons_permeabilite_centrale_id_fkey"
            columns: ["centrale_id"]
            isOneToOne: false
            referencedRelation: "centrales_beton"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_permeabilite_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_permeabilite_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_permeabilite_formulation_id_fkey"
            columns: ["formulation_id"]
            isOneToOne: false
            referencedRelation: "formulations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_permeabilite_operateur_id_fkey"
            columns: ["operateur_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
        ]
      }
      echantillons_plaque: {
        Row: {
          chantier_id: string | null
          client_id: string | null
          created_at: string
          date_prelevement: string
          id: string
          numero: number
          observations: string | null
          operateur_id: string | null
          profondeur: string | null
          resultats: Json | null
          statut: string
          type_sol: string
          updated_at: string
        }
        Insert: {
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_prelevement?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          profondeur?: string | null
          resultats?: Json | null
          statut?: string
          type_sol: string
          updated_at?: string
        }
        Update: {
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_prelevement?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          profondeur?: string | null
          resultats?: Json | null
          statut?: string
          type_sol?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "echantillons_plaque_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_plaque_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_plaque_operateur_id_fkey"
            columns: ["operateur_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
        ]
      }
      echantillons_pressiometre: {
        Row: {
          chantier_id: string | null
          client_id: string | null
          created_at: string
          date_prelevement: string
          id: string
          numero: number
          observations: string | null
          operateur_id: string | null
          profondeur: string | null
          resultats: Json | null
          statut: string
          type_sol: string
          updated_at: string
        }
        Insert: {
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_prelevement?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          profondeur?: string | null
          resultats?: Json | null
          statut?: string
          type_sol: string
          updated_at?: string
        }
        Update: {
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_prelevement?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          profondeur?: string | null
          resultats?: Json | null
          statut?: string
          type_sol?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "echantillons_pressiometre_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_pressiometre_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_pressiometre_operateur_id_fkey"
            columns: ["operateur_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
        ]
      }
      echantillons_proctor_modifie: {
        Row: {
          carriere_id: string | null
          chantier_id: string | null
          client_id: string | null
          created_at: string
          date_essai: string | null
          date_prelevement: string
          id: string
          numero: number
          observations: string | null
          operateur_id: string | null
          profondeur: string | null
          resultats: Json | null
          statut: string
          type_sol: string
          updated_at: string
        }
        Insert: {
          carriere_id?: string | null
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_essai?: string | null
          date_prelevement?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          profondeur?: string | null
          resultats?: Json | null
          statut?: string
          type_sol: string
          updated_at?: string
        }
        Update: {
          carriere_id?: string | null
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_essai?: string | null
          date_prelevement?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          profondeur?: string | null
          resultats?: Json | null
          statut?: string
          type_sol?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "echantillons_proctor_modifie_carriere_id_fkey"
            columns: ["carriere_id"]
            isOneToOne: false
            referencedRelation: "carrieres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_proctor_modifie_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_proctor_modifie_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_proctor_modifie_operateur_id_fkey"
            columns: ["operateur_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
        ]
      }
      echantillons_proctor_normal: {
        Row: {
          carriere_id: string | null
          chantier_id: string | null
          client_id: string | null
          created_at: string
          date_essai: string | null
          date_prelevement: string
          id: string
          numero: number
          observations: string | null
          operateur_id: string | null
          profondeur: string | null
          resultats: Json | null
          statut: string
          type_sol: string
          updated_at: string
        }
        Insert: {
          carriere_id?: string | null
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_essai?: string | null
          date_prelevement?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          profondeur?: string | null
          resultats?: Json | null
          statut?: string
          type_sol: string
          updated_at?: string
        }
        Update: {
          carriere_id?: string | null
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_essai?: string | null
          date_prelevement?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          profondeur?: string | null
          resultats?: Json | null
          statut?: string
          type_sol?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "echantillons_proctor_normal_carriere_id_fkey"
            columns: ["carriere_id"]
            isOneToOne: false
            referencedRelation: "carrieres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_proctor_normal_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_proctor_normal_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_proctor_normal_operateur_id_fkey"
            columns: ["operateur_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
        ]
      }
      echantillons_sclerometre: {
        Row: {
          age_beton_jours: number | null
          chantier_id: string | null
          classe_resistance: string | null
          client_id: string | null
          created_at: string
          date_essai: string
          id: string
          numero: number
          observations: string | null
          operateur_id: string | null
          orientation: string | null
          ouvrage: string | null
          partie_ouvrage: string | null
          resultats: Json | null
          statut: string
          updated_at: string
        }
        Insert: {
          age_beton_jours?: number | null
          chantier_id?: string | null
          classe_resistance?: string | null
          client_id?: string | null
          created_at?: string
          date_essai?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          orientation?: string | null
          ouvrage?: string | null
          partie_ouvrage?: string | null
          resultats?: Json | null
          statut?: string
          updated_at?: string
        }
        Update: {
          age_beton_jours?: number | null
          chantier_id?: string | null
          classe_resistance?: string | null
          client_id?: string | null
          created_at?: string
          date_essai?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          orientation?: string | null
          ouvrage?: string | null
          partie_ouvrage?: string | null
          resultats?: Json | null
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "echantillons_sclerometre_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_sclerometre_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_sclerometre_operateur_id_fkey"
            columns: ["operateur_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
        ]
      }
      echantillons_sondage: {
        Row: {
          chantier_id: string | null
          client_id: string | null
          created_at: string
          date_prelevement: string
          id: string
          numero: number
          observations: string | null
          operateur_id: string | null
          profondeur: string | null
          resultats: Json | null
          statut: string
          type_sol: string
          updated_at: string
        }
        Insert: {
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_prelevement?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          profondeur?: string | null
          resultats?: Json | null
          statut?: string
          type_sol: string
          updated_at?: string
        }
        Update: {
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_prelevement?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          profondeur?: string | null
          resultats?: Json | null
          statut?: string
          type_sol?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "echantillons_sondage_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_sondage_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_sondage_operateur_id_fkey"
            columns: ["operateur_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
        ]
      }
      echantillons_temperature: {
        Row: {
          centrale_id: string | null
          chantier_id: string | null
          classe_resistance: string | null
          client_id: string | null
          created_at: string
          date_prelevement: string
          destination_beton: string | null
          essai_convenance: boolean | null
          essai_convenance_details: string | null
          formulation_id: string | null
          heure_prelevement: string | null
          id: string
          numero: number
          observations: string | null
          operateur_id: string | null
          ouvrage: string | null
          resultats: Json | null
          statut: string
          temperature_ambiante: number | null
          updated_at: string
        }
        Insert: {
          centrale_id?: string | null
          chantier_id?: string | null
          classe_resistance?: string | null
          client_id?: string | null
          created_at?: string
          date_prelevement?: string
          destination_beton?: string | null
          essai_convenance?: boolean | null
          essai_convenance_details?: string | null
          formulation_id?: string | null
          heure_prelevement?: string | null
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          ouvrage?: string | null
          resultats?: Json | null
          statut?: string
          temperature_ambiante?: number | null
          updated_at?: string
        }
        Update: {
          centrale_id?: string | null
          chantier_id?: string | null
          classe_resistance?: string | null
          client_id?: string | null
          created_at?: string
          date_prelevement?: string
          destination_beton?: string | null
          essai_convenance?: boolean | null
          essai_convenance_details?: string | null
          formulation_id?: string | null
          heure_prelevement?: string | null
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          ouvrage?: string | null
          resultats?: Json | null
          statut?: string
          temperature_ambiante?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "echantillons_temperature_centrale_id_fkey"
            columns: ["centrale_id"]
            isOneToOne: false
            referencedRelation: "centrales_beton"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_temperature_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_temperature_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_temperature_formulation_id_fkey"
            columns: ["formulation_id"]
            isOneToOne: false
            referencedRelation: "formulations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_temperature_operateur_id_fkey"
            columns: ["operateur_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
        ]
      }
      echantillons_temps_prise: {
        Row: {
          centrale_id: string | null
          chantier_id: string | null
          classe_resistance: string | null
          client_id: string | null
          created_at: string
          date_prelevement: string
          destination_beton: string | null
          essai_convenance: boolean | null
          essai_convenance_details: string | null
          formulation_id: string | null
          heure_prelevement: string | null
          id: string
          numero: number
          observations: string | null
          operateur_id: string | null
          ouvrage: string | null
          resultats: Json | null
          statut: string
          temperature_air: number | null
          temperature_beton: number | null
          updated_at: string
        }
        Insert: {
          centrale_id?: string | null
          chantier_id?: string | null
          classe_resistance?: string | null
          client_id?: string | null
          created_at?: string
          date_prelevement?: string
          destination_beton?: string | null
          essai_convenance?: boolean | null
          essai_convenance_details?: string | null
          formulation_id?: string | null
          heure_prelevement?: string | null
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          ouvrage?: string | null
          resultats?: Json | null
          statut?: string
          temperature_air?: number | null
          temperature_beton?: number | null
          updated_at?: string
        }
        Update: {
          centrale_id?: string | null
          chantier_id?: string | null
          classe_resistance?: string | null
          client_id?: string | null
          created_at?: string
          date_prelevement?: string
          destination_beton?: string | null
          essai_convenance?: boolean | null
          essai_convenance_details?: string | null
          formulation_id?: string | null
          heure_prelevement?: string | null
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          ouvrage?: string | null
          resultats?: Json | null
          statut?: string
          temperature_air?: number | null
          temperature_beton?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "echantillons_temps_prise_centrale_id_fkey"
            columns: ["centrale_id"]
            isOneToOne: false
            referencedRelation: "centrales_beton"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_temps_prise_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_temps_prise_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_temps_prise_formulation_id_fkey"
            columns: ["formulation_id"]
            isOneToOne: false
            referencedRelation: "formulations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_temps_prise_operateur_id_fkey"
            columns: ["operateur_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
        ]
      }
      echantillons_teneur_air: {
        Row: {
          centrale_id: string | null
          chantier_id: string | null
          classe_resistance: string | null
          client_id: string | null
          created_at: string
          date_prelevement: string
          destination_beton: string | null
          essai_convenance: boolean | null
          essai_convenance_details: string | null
          formulation_id: string | null
          heure_prelevement: string | null
          id: string
          numero: number
          observations: string | null
          operateur_id: string | null
          ouvrage: string | null
          resultats: Json | null
          statut: string
          temperature_air: number | null
          temperature_beton: number | null
          updated_at: string
        }
        Insert: {
          centrale_id?: string | null
          chantier_id?: string | null
          classe_resistance?: string | null
          client_id?: string | null
          created_at?: string
          date_prelevement?: string
          destination_beton?: string | null
          essai_convenance?: boolean | null
          essai_convenance_details?: string | null
          formulation_id?: string | null
          heure_prelevement?: string | null
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          ouvrage?: string | null
          resultats?: Json | null
          statut?: string
          temperature_air?: number | null
          temperature_beton?: number | null
          updated_at?: string
        }
        Update: {
          centrale_id?: string | null
          chantier_id?: string | null
          classe_resistance?: string | null
          client_id?: string | null
          created_at?: string
          date_prelevement?: string
          destination_beton?: string | null
          essai_convenance?: boolean | null
          essai_convenance_details?: string | null
          formulation_id?: string | null
          heure_prelevement?: string | null
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          ouvrage?: string | null
          resultats?: Json | null
          statut?: string
          temperature_air?: number | null
          temperature_beton?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "echantillons_teneur_air_centrale_id_fkey"
            columns: ["centrale_id"]
            isOneToOne: false
            referencedRelation: "centrales_beton"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_teneur_air_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_teneur_air_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_teneur_air_formulation_id_fkey"
            columns: ["formulation_id"]
            isOneToOne: false
            referencedRelation: "formulations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_teneur_air_operateur_id_fkey"
            columns: ["operateur_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
        ]
      }
      echantillons_teneur_eau: {
        Row: {
          carriere_id: string | null
          chantier_id: string | null
          client_id: string | null
          created_at: string
          date_essai: string | null
          date_reception: string
          id: string
          numero: number
          observations: string | null
          operateur_id: string | null
          produit: string
          resultats: Json | null
          statut: string
          updated_at: string
        }
        Insert: {
          carriere_id?: string | null
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_essai?: string | null
          date_reception?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          produit: string
          resultats?: Json | null
          statut?: string
          updated_at?: string
        }
        Update: {
          carriere_id?: string | null
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_essai?: string | null
          date_reception?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          produit?: string
          resultats?: Json | null
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "echantillons_teneur_eau_carriere_id_fkey"
            columns: ["carriere_id"]
            isOneToOne: false
            referencedRelation: "carrieres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_teneur_eau_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_teneur_eau_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_teneur_eau_operateur_id_fkey"
            columns: ["operateur_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
        ]
      }
      echantillons_teneur_eau_sol: {
        Row: {
          carriere_id: string | null
          chantier_id: string | null
          client_id: string | null
          created_at: string
          date_essai: string | null
          date_prelevement: string
          id: string
          numero: number
          observations: string | null
          operateur_id: string | null
          profondeur: string | null
          resultats: Json | null
          statut: string
          type_sol: string
          updated_at: string
        }
        Insert: {
          carriere_id?: string | null
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_essai?: string | null
          date_prelevement?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          profondeur?: string | null
          resultats?: Json | null
          statut?: string
          type_sol: string
          updated_at?: string
        }
        Update: {
          carriere_id?: string | null
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_essai?: string | null
          date_prelevement?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          profondeur?: string | null
          resultats?: Json | null
          statut?: string
          type_sol?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "echantillons_teneur_eau_sol_carriere_id_fkey"
            columns: ["carriere_id"]
            isOneToOne: false
            referencedRelation: "carrieres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_teneur_eau_sol_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_teneur_eau_sol_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_teneur_eau_sol_operateur_id_fkey"
            columns: ["operateur_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
        ]
      }
      echantillons_traction_fendage: {
        Row: {
          centrale_id: string | null
          chantier_id: string | null
          classe_consistance: string | null
          classe_resistance: string | null
          client_id: string | null
          condition_cure: string | null
          created_at: string
          date_coulage: string | null
          destination_beton: string | null
          dimension_eprouvette: string | null
          essai_convenance: boolean | null
          essai_convenance_details: string | null
          formulation_id: string | null
          id: string
          jours_essai: Json | null
          nombre_eprouvettes: number | null
          numero: number
          observations: string | null
          operateur_id: string | null
          ouvrage: string | null
          resultats: Json | null
          statut: string | null
          temperature_air: number | null
          temperature_beton: number | null
          type_eprouvette: string | null
          updated_at: string
        }
        Insert: {
          centrale_id?: string | null
          chantier_id?: string | null
          classe_consistance?: string | null
          classe_resistance?: string | null
          client_id?: string | null
          condition_cure?: string | null
          created_at?: string
          date_coulage?: string | null
          destination_beton?: string | null
          dimension_eprouvette?: string | null
          essai_convenance?: boolean | null
          essai_convenance_details?: string | null
          formulation_id?: string | null
          id?: string
          jours_essai?: Json | null
          nombre_eprouvettes?: number | null
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          ouvrage?: string | null
          resultats?: Json | null
          statut?: string | null
          temperature_air?: number | null
          temperature_beton?: number | null
          type_eprouvette?: string | null
          updated_at?: string
        }
        Update: {
          centrale_id?: string | null
          chantier_id?: string | null
          classe_consistance?: string | null
          classe_resistance?: string | null
          client_id?: string | null
          condition_cure?: string | null
          created_at?: string
          date_coulage?: string | null
          destination_beton?: string | null
          dimension_eprouvette?: string | null
          essai_convenance?: boolean | null
          essai_convenance_details?: string | null
          formulation_id?: string | null
          id?: string
          jours_essai?: Json | null
          nombre_eprouvettes?: number | null
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          ouvrage?: string | null
          resultats?: Json | null
          statut?: string | null
          temperature_air?: number | null
          temperature_beton?: number | null
          type_eprouvette?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "echantillons_traction_fendage_centrale_id_fkey"
            columns: ["centrale_id"]
            isOneToOne: false
            referencedRelation: "centrales_beton"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_traction_fendage_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_traction_fendage_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_traction_fendage_formulation_id_fkey"
            columns: ["formulation_id"]
            isOneToOne: false
            referencedRelation: "formulations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_traction_fendage_operateur_id_fkey"
            columns: ["operateur_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
        ]
      }
      echantillons_triaxial: {
        Row: {
          chantier_id: string | null
          client_id: string | null
          created_at: string
          date_prelevement: string
          id: string
          numero: number
          observations: string | null
          operateur_id: string | null
          profondeur: string | null
          resultats: Json | null
          statut: string
          type_sol: string
          updated_at: string
        }
        Insert: {
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_prelevement?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          profondeur?: string | null
          resultats?: Json | null
          statut?: string
          type_sol: string
          updated_at?: string
        }
        Update: {
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_prelevement?: string
          id?: string
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          profondeur?: string | null
          resultats?: Json | null
          statut?: string
          type_sol?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "echantillons_triaxial_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_triaxial_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_triaxial_operateur_id_fkey"
            columns: ["operateur_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
        ]
      }
      echantillons_ultrason: {
        Row: {
          age_beton_jours: number | null
          chantier_id: string | null
          classe_resistance: string | null
          client_id: string | null
          created_at: string
          date_essai: string
          frequence_khz: number | null
          id: string
          mode_transmission: string | null
          numero: number
          observations: string | null
          operateur_id: string | null
          ouvrage: string | null
          partie_ouvrage: string | null
          resultats: Json | null
          statut: string
          updated_at: string
        }
        Insert: {
          age_beton_jours?: number | null
          chantier_id?: string | null
          classe_resistance?: string | null
          client_id?: string | null
          created_at?: string
          date_essai?: string
          frequence_khz?: number | null
          id?: string
          mode_transmission?: string | null
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          ouvrage?: string | null
          partie_ouvrage?: string | null
          resultats?: Json | null
          statut?: string
          updated_at?: string
        }
        Update: {
          age_beton_jours?: number | null
          chantier_id?: string | null
          classe_resistance?: string | null
          client_id?: string | null
          created_at?: string
          date_essai?: string
          frequence_khz?: number | null
          id?: string
          mode_transmission?: string | null
          numero?: number
          observations?: string | null
          operateur_id?: string | null
          ouvrage?: string | null
          partie_ouvrage?: string | null
          resultats?: Json | null
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "echantillons_ultrason_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_ultrason_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echantillons_ultrason_operateur_id_fkey"
            columns: ["operateur_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_articles: {
        Row: {
          article_number: number
          contenu: string
          created_at: string
          engagement_id: string
          id: string
          titre: string
          updated_at: string
        }
        Insert: {
          article_number: number
          contenu: string
          created_at?: string
          engagement_id: string
          id?: string
          titre: string
          updated_at?: string
        }
        Update: {
          article_number?: number
          contenu?: string
          created_at?: string
          engagement_id?: string
          id?: string
          titre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "engagement_articles_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "lettres_engagement"
            referencedColumns: ["id"]
          },
        ]
      }
      entreprise: {
        Row: {
          agence: string | null
          ai: string | null
          annexe: string | null
          banque: string | null
          cachet_url: string | null
          created_at: string
          date_autorisation: string | null
          email: string | null
          id: string
          logo_url: string | null
          nif: string | null
          nis: string | null
          nom: string
          numero_autorisation: string | null
          rc: string | null
          representant: string | null
          rib: string | null
          siege_social: string | null
          site_web: string | null
          telephone: string | null
          updated_at: string
        }
        Insert: {
          agence?: string | null
          ai?: string | null
          annexe?: string | null
          banque?: string | null
          cachet_url?: string | null
          created_at?: string
          date_autorisation?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          nif?: string | null
          nis?: string | null
          nom?: string
          numero_autorisation?: string | null
          rc?: string | null
          representant?: string | null
          rib?: string | null
          siege_social?: string | null
          site_web?: string | null
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          agence?: string | null
          ai?: string | null
          annexe?: string | null
          banque?: string | null
          cachet_url?: string | null
          created_at?: string
          date_autorisation?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          nif?: string | null
          nis?: string | null
          nom?: string
          numero_autorisation?: string | null
          rc?: string | null
          representant?: string | null
          rib?: string | null
          siege_social?: string | null
          site_web?: string | null
          telephone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      essais: {
        Row: {
          client_id: string | null
          created_at: string
          date_fin: string | null
          date_realisation: string | null
          date_reception: string
          description: string | null
          id: string
          intervenant_id: string | null
          materiel_id: string | null
          nom: string
          observations: string | null
          reference: string
          resultats: Json | null
          statut: Database["public"]["Enums"]["essai_status"]
          type_essai: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          date_fin?: string | null
          date_realisation?: string | null
          date_reception?: string
          description?: string | null
          id?: string
          intervenant_id?: string | null
          materiel_id?: string | null
          nom: string
          observations?: string | null
          reference: string
          resultats?: Json | null
          statut?: Database["public"]["Enums"]["essai_status"]
          type_essai: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          date_fin?: string | null
          date_realisation?: string | null
          date_reception?: string
          description?: string | null
          id?: string
          intervenant_id?: string | null
          materiel_id?: string | null
          nom?: string
          observations?: string | null
          reference?: string
          resultats?: Json | null
          statut?: Database["public"]["Enums"]["essai_status"]
          type_essai?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "essais_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "essais_intervenant_id_fkey"
            columns: ["intervenant_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "essais_materiel_id_fkey"
            columns: ["materiel_id"]
            isOneToOne: false
            referencedRelation: "materiel"
            referencedColumns: ["id"]
          },
        ]
      }
      essais_deleted: {
        Row: {
          deleted_at: string
          deleted_by: string | null
          deleted_by_name: string | null
          essai_label: string | null
          id: string
          numero: number | null
          record_data: Json
          record_id: string
          restored_at: string | null
          restored_by: string | null
          restored_by_name: string | null
          table_name: string
        }
        Insert: {
          deleted_at?: string
          deleted_by?: string | null
          deleted_by_name?: string | null
          essai_label?: string | null
          id?: string
          numero?: number | null
          record_data: Json
          record_id: string
          restored_at?: string | null
          restored_by?: string | null
          restored_by_name?: string | null
          table_name: string
        }
        Update: {
          deleted_at?: string
          deleted_by?: string | null
          deleted_by_name?: string | null
          essai_label?: string | null
          id?: string
          numero?: number | null
          record_data?: Json
          record_id?: string
          restored_at?: string | null
          restored_by?: string | null
          restored_by_name?: string | null
          table_name?: string
        }
        Relationships: []
      }
      essais_modifications_history: {
        Row: {
          field_name: string
          id: string
          modified_at: string
          modified_by: string | null
          modified_by_name: string | null
          new_value: Json | null
          old_value: Json | null
          record_id: string
          restored_at: string | null
          restored_by: string | null
          restored_by_name: string | null
          table_name: string
        }
        Insert: {
          field_name: string
          id?: string
          modified_at?: string
          modified_by?: string | null
          modified_by_name?: string | null
          new_value?: Json | null
          old_value?: Json | null
          record_id: string
          restored_at?: string | null
          restored_by?: string | null
          restored_by_name?: string | null
          table_name: string
        }
        Update: {
          field_name?: string
          id?: string
          modified_at?: string
          modified_by?: string | null
          modified_by_name?: string | null
          new_value?: Json | null
          old_value?: Json | null
          record_id?: string
          restored_at?: string | null
          restored_by?: string | null
          restored_by_name?: string | null
          table_name?: string
        }
        Relationships: []
      }
      etalonnage_materiel: {
        Row: {
          certificat_nom: string | null
          certificat_url: string | null
          created_at: string
          date_etalonnage: string
          date_prochain_etalonnage: string | null
          id: string
          materiel_id: string
          numero_certificat: string | null
          observations: string | null
          organisme: string | null
          resultat: string
          updated_at: string
        }
        Insert: {
          certificat_nom?: string | null
          certificat_url?: string | null
          created_at?: string
          date_etalonnage?: string
          date_prochain_etalonnage?: string | null
          id?: string
          materiel_id: string
          numero_certificat?: string | null
          observations?: string | null
          organisme?: string | null
          resultat?: string
          updated_at?: string
        }
        Update: {
          certificat_nom?: string | null
          certificat_url?: string | null
          created_at?: string
          date_etalonnage?: string
          date_prochain_etalonnage?: string | null
          id?: string
          materiel_id?: string
          numero_certificat?: string | null
          observations?: string | null
          organisme?: string | null
          resultat?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "etalonnage_materiel_materiel_id_fkey"
            columns: ["materiel_id"]
            isOneToOne: false
            referencedRelation: "materiel_laboratoire"
            referencedColumns: ["id"]
          },
        ]
      }
      factures: {
        Row: {
          chantier_id: string | null
          client_id: string | null
          created_at: string
          date_echeance: string | null
          date_emission: string
          id: string
          montant_ht: number
          montant_paye: number
          montant_ttc: number
          montant_tva: number
          numero: string
          observations: string | null
          statut: string
          taux_tva: number
          updated_at: string
        }
        Insert: {
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_echeance?: string | null
          date_emission?: string
          id?: string
          montant_ht?: number
          montant_paye?: number
          montant_ttc?: number
          montant_tva?: number
          numero: string
          observations?: string | null
          statut?: string
          taux_tva?: number
          updated_at?: string
        }
        Update: {
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_echeance?: string | null
          date_emission?: string
          id?: string
          montant_ht?: number
          montant_paye?: number
          montant_ttc?: number
          montant_tva?: number
          numero?: string
          observations?: string | null
          statut?: string
          taux_tva?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "factures_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factures_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      formulations: {
        Row: {
          adjuvant_producteur_id: string | null
          adjuvant_produit_id: string | null
          adjuvant_quantite: number | null
          centrale_id: string
          chantier_id: string | null
          ciment_calcule: number | null
          ciment_producteur_id: string | null
          ciment_produit_id: string | null
          ciment_quantite: number | null
          classe_exposition: string | null
          client_id: string | null
          coefficient_compacite: number | null
          coefficient_granulaire: number | null
          created_at: string
          dmax_utilisateur: number | null
          eau_calculee: number | null
          eau_producteur_id: string | null
          eau_produit_id: string | null
          eau_quantite: number | null
          essai_compression_id: string | null
          forme_ae: string | null
          granulat_densites: Json | null
          granulat_module_finesse: Json | null
          gravier2_producteur_id: string | null
          gravier2_produit_id: string | null
          gravier2_quantite: number | null
          gravier3_producteur_id: string | null
          gravier3_produit_id: string | null
          gravier3_quantite: number | null
          gravillons1_producteur_id: string | null
          gravillons1_produit_id: string | null
          gravillons1_quantite: number | null
          id: string
          kp_ae: number | null
          maitre_oeuvre_id: string | null
          maitre_ouvrage_id: string | null
          mf_ideal: number | null
          nom: string
          ratio_gs: number | null
          resistance_28j: number | null
          sable_concasse_producteur_id: string | null
          sable_concasse_produit_id: string | null
          sable_concasse_quantite: number | null
          sable_fin_producteur_id: string | null
          sable_fin_produit_id: string | null
          sable_fin_quantite: number | null
          slump_souhaite: number | null
          updated_at: string
          vibration_ae: string | null
        }
        Insert: {
          adjuvant_producteur_id?: string | null
          adjuvant_produit_id?: string | null
          adjuvant_quantite?: number | null
          centrale_id: string
          chantier_id?: string | null
          ciment_calcule?: number | null
          ciment_producteur_id?: string | null
          ciment_produit_id?: string | null
          ciment_quantite?: number | null
          classe_exposition?: string | null
          client_id?: string | null
          coefficient_compacite?: number | null
          coefficient_granulaire?: number | null
          created_at?: string
          dmax_utilisateur?: number | null
          eau_calculee?: number | null
          eau_producteur_id?: string | null
          eau_produit_id?: string | null
          eau_quantite?: number | null
          essai_compression_id?: string | null
          forme_ae?: string | null
          granulat_densites?: Json | null
          granulat_module_finesse?: Json | null
          gravier2_producteur_id?: string | null
          gravier2_produit_id?: string | null
          gravier2_quantite?: number | null
          gravier3_producteur_id?: string | null
          gravier3_produit_id?: string | null
          gravier3_quantite?: number | null
          gravillons1_producteur_id?: string | null
          gravillons1_produit_id?: string | null
          gravillons1_quantite?: number | null
          id?: string
          kp_ae?: number | null
          maitre_oeuvre_id?: string | null
          maitre_ouvrage_id?: string | null
          mf_ideal?: number | null
          nom: string
          ratio_gs?: number | null
          resistance_28j?: number | null
          sable_concasse_producteur_id?: string | null
          sable_concasse_produit_id?: string | null
          sable_concasse_quantite?: number | null
          sable_fin_producteur_id?: string | null
          sable_fin_produit_id?: string | null
          sable_fin_quantite?: number | null
          slump_souhaite?: number | null
          updated_at?: string
          vibration_ae?: string | null
        }
        Update: {
          adjuvant_producteur_id?: string | null
          adjuvant_produit_id?: string | null
          adjuvant_quantite?: number | null
          centrale_id?: string
          chantier_id?: string | null
          ciment_calcule?: number | null
          ciment_producteur_id?: string | null
          ciment_produit_id?: string | null
          ciment_quantite?: number | null
          classe_exposition?: string | null
          client_id?: string | null
          coefficient_compacite?: number | null
          coefficient_granulaire?: number | null
          created_at?: string
          dmax_utilisateur?: number | null
          eau_calculee?: number | null
          eau_producteur_id?: string | null
          eau_produit_id?: string | null
          eau_quantite?: number | null
          essai_compression_id?: string | null
          forme_ae?: string | null
          granulat_densites?: Json | null
          granulat_module_finesse?: Json | null
          gravier2_producteur_id?: string | null
          gravier2_produit_id?: string | null
          gravier2_quantite?: number | null
          gravier3_producteur_id?: string | null
          gravier3_produit_id?: string | null
          gravier3_quantite?: number | null
          gravillons1_producteur_id?: string | null
          gravillons1_produit_id?: string | null
          gravillons1_quantite?: number | null
          id?: string
          kp_ae?: number | null
          maitre_oeuvre_id?: string | null
          maitre_ouvrage_id?: string | null
          mf_ideal?: number | null
          nom?: string
          ratio_gs?: number | null
          resistance_28j?: number | null
          sable_concasse_producteur_id?: string | null
          sable_concasse_produit_id?: string | null
          sable_concasse_quantite?: number | null
          sable_fin_producteur_id?: string | null
          sable_fin_produit_id?: string | null
          sable_fin_quantite?: number | null
          slump_souhaite?: number | null
          updated_at?: string
          vibration_ae?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "formulations_centrale_id_fkey"
            columns: ["centrale_id"]
            isOneToOne: false
            referencedRelation: "centrales_beton"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formulations_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formulations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formulations_essai_compression_id_fkey"
            columns: ["essai_compression_id"]
            isOneToOne: false
            referencedRelation: "echantillons_compression"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formulations_maitre_oeuvre_id_fkey"
            columns: ["maitre_oeuvre_id"]
            isOneToOne: false
            referencedRelation: "maitres_oeuvre"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formulations_maitre_ouvrage_id_fkey"
            columns: ["maitre_ouvrage_id"]
            isOneToOne: false
            referencedRelation: "maitres_ouvrage"
            referencedColumns: ["id"]
          },
        ]
      }
      historique_echantillons_compression: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          echantillon_id: string
          id: string
          utilisateur: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          echantillon_id: string
          id?: string
          utilisateur?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          echantillon_id?: string
          id?: string
          utilisateur?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historique_echantillons_compression_echantillon_id_fkey"
            columns: ["echantillon_id"]
            isOneToOne: false
            referencedRelation: "echantillons_compression"
            referencedColumns: ["id"]
          },
        ]
      }
      intervenants: {
        Row: {
          adresse: string | null
          cin: string | null
          cnas: string | null
          created_at: string
          date_embauche: string | null
          date_naissance: string | null
          departement: string | null
          email: string | null
          id: string
          nom: string
          notes: string | null
          poste_id: string | null
          prenom: string
          role: string
          salaire: number | null
          signature_url: string | null
          specialite: string | null
          statut: string
          telephone: string | null
          updated_at: string
        }
        Insert: {
          adresse?: string | null
          cin?: string | null
          cnas?: string | null
          created_at?: string
          date_embauche?: string | null
          date_naissance?: string | null
          departement?: string | null
          email?: string | null
          id?: string
          nom: string
          notes?: string | null
          poste_id?: string | null
          prenom: string
          role?: string
          salaire?: number | null
          signature_url?: string | null
          specialite?: string | null
          statut?: string
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          adresse?: string | null
          cin?: string | null
          cnas?: string | null
          created_at?: string
          date_embauche?: string | null
          date_naissance?: string | null
          departement?: string | null
          email?: string | null
          id?: string
          nom?: string
          notes?: string | null
          poste_id?: string | null
          prenom?: string
          role?: string
          salaire?: number | null
          signature_url?: string | null
          specialite?: string | null
          statut?: string
          telephone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "intervenants_poste_id_fkey"
            columns: ["poste_id"]
            isOneToOne: false
            referencedRelation: "postes"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_audit: {
        Row: {
          action: string
          cible: string | null
          created_at: string
          details: string | null
          id: string
          ip_address: string | null
          type: string
          utilisateur_id: string | null
          utilisateur_nom: string | null
        }
        Insert: {
          action: string
          cible?: string | null
          created_at?: string
          details?: string | null
          id?: string
          ip_address?: string | null
          type: string
          utilisateur_id?: string | null
          utilisateur_nom?: string | null
        }
        Update: {
          action?: string
          cible?: string | null
          created_at?: string
          details?: string | null
          id?: string
          ip_address?: string | null
          type?: string
          utilisateur_id?: string | null
          utilisateur_nom?: string | null
        }
        Relationships: []
      }
      laboratoires_mobiles: {
        Row: {
          chantier_id: string | null
          client_id: string | null
          created_at: string
          date_affectation: string | null
          date_debut: string | null
          date_fin: string | null
          date_fin_affectation: string | null
          id: string
          immatriculation: string | null
          localisation_actuelle: string | null
          nom: string
          notes_affectation: string | null
          responsable_id: string | null
          statut: string
          updated_at: string
        }
        Insert: {
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_affectation?: string | null
          date_debut?: string | null
          date_fin?: string | null
          date_fin_affectation?: string | null
          id?: string
          immatriculation?: string | null
          localisation_actuelle?: string | null
          nom: string
          notes_affectation?: string | null
          responsable_id?: string | null
          statut?: string
          updated_at?: string
        }
        Update: {
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_affectation?: string | null
          date_debut?: string | null
          date_fin?: string | null
          date_fin_affectation?: string | null
          id?: string
          immatriculation?: string | null
          localisation_actuelle?: string | null
          nom?: string
          notes_affectation?: string | null
          responsable_id?: string | null
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "laboratoires_mobiles_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "laboratoires_mobiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "laboratoires_mobiles_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
        ]
      }
      lettres_engagement: {
        Row: {
          chantier_id: string | null
          client_id: string | null
          created_at: string
          date_document: string
          document_nom: string | null
          document_url: string | null
          id: string
          montant: number | null
          numero: string | null
          observations: string | null
          statut: string
          titre: string
          updated_at: string
        }
        Insert: {
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_document?: string
          document_nom?: string | null
          document_url?: string | null
          id?: string
          montant?: number | null
          numero?: string | null
          observations?: string | null
          statut?: string
          titre: string
          updated_at?: string
        }
        Update: {
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_document?: string
          document_nom?: string | null
          document_url?: string | null
          id?: string
          montant?: number | null
          numero?: string | null
          observations?: string | null
          statut?: string
          titre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lettres_engagement_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lettres_engagement_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      lignes_bon_commande: {
        Row: {
          bon_commande_id: string
          created_at: string
          description: string
          id: string
          montant: number
          ordre: number
          prix_unitaire: number
          quantite: number
        }
        Insert: {
          bon_commande_id: string
          created_at?: string
          description: string
          id?: string
          montant?: number
          ordre?: number
          prix_unitaire?: number
          quantite?: number
        }
        Update: {
          bon_commande_id?: string
          created_at?: string
          description?: string
          id?: string
          montant?: number
          ordre?: number
          prix_unitaire?: number
          quantite?: number
        }
        Relationships: [
          {
            foreignKeyName: "lignes_bon_commande_bon_commande_id_fkey"
            columns: ["bon_commande_id"]
            isOneToOne: false
            referencedRelation: "bons_commande"
            referencedColumns: ["id"]
          },
        ]
      }
      lignes_devis: {
        Row: {
          created_at: string
          description: string
          devis_id: string
          id: string
          montant: number
          ordre: number
          prix_unitaire: number
          quantite: number
        }
        Insert: {
          created_at?: string
          description: string
          devis_id: string
          id?: string
          montant?: number
          ordre?: number
          prix_unitaire?: number
          quantite?: number
        }
        Update: {
          created_at?: string
          description?: string
          devis_id?: string
          id?: string
          montant?: number
          ordre?: number
          prix_unitaire?: number
          quantite?: number
        }
        Relationships: [
          {
            foreignKeyName: "lignes_devis_devis_id_fkey"
            columns: ["devis_id"]
            isOneToOne: false
            referencedRelation: "devis"
            referencedColumns: ["id"]
          },
        ]
      }
      lignes_facture: {
        Row: {
          created_at: string
          description: string
          facture_id: string
          id: string
          montant: number
          ordre: number
          prix_unitaire: number
          quantite: number
        }
        Insert: {
          created_at?: string
          description: string
          facture_id: string
          id?: string
          montant?: number
          ordre?: number
          prix_unitaire?: number
          quantite?: number
        }
        Update: {
          created_at?: string
          description?: string
          facture_id?: string
          id?: string
          montant?: number
          ordre?: number
          prix_unitaire?: number
          quantite?: number
        }
        Relationships: [
          {
            foreignKeyName: "lignes_facture_facture_id_fkey"
            columns: ["facture_id"]
            isOneToOne: false
            referencedRelation: "factures"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_materiel: {
        Row: {
          cout: number | null
          created_at: string
          date_maintenance: string
          date_prochaine_maintenance: string | null
          description: string | null
          id: string
          materiel_id: string
          observations: string | null
          prestataire: string | null
          statut: string
          type_maintenance: string
          updated_at: string
        }
        Insert: {
          cout?: number | null
          created_at?: string
          date_maintenance?: string
          date_prochaine_maintenance?: string | null
          description?: string | null
          id?: string
          materiel_id: string
          observations?: string | null
          prestataire?: string | null
          statut?: string
          type_maintenance?: string
          updated_at?: string
        }
        Update: {
          cout?: number | null
          created_at?: string
          date_maintenance?: string
          date_prochaine_maintenance?: string | null
          description?: string | null
          id?: string
          materiel_id?: string
          observations?: string | null
          prestataire?: string | null
          statut?: string
          type_maintenance?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_materiel_materiel_id_fkey"
            columns: ["materiel_id"]
            isOneToOne: false
            referencedRelation: "materiel_laboratoire"
            referencedColumns: ["id"]
          },
        ]
      }
      maitres_oeuvre: {
        Row: {
          adresse: string | null
          contact: string | null
          created_at: string
          email: string | null
          id: string
          nom: string
          observations: string | null
          specialite: string | null
          statut: string
          telephone: string | null
          updated_at: string
          ville: string | null
        }
        Insert: {
          adresse?: string | null
          contact?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nom: string
          observations?: string | null
          specialite?: string | null
          statut?: string
          telephone?: string | null
          updated_at?: string
          ville?: string | null
        }
        Update: {
          adresse?: string | null
          contact?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nom?: string
          observations?: string | null
          specialite?: string | null
          statut?: string
          telephone?: string | null
          updated_at?: string
          ville?: string | null
        }
        Relationships: []
      }
      maitres_ouvrage: {
        Row: {
          adresse: string | null
          contact: string | null
          created_at: string
          email: string | null
          id: string
          nom: string
          observations: string | null
          secteur: string | null
          statut: string
          telephone: string | null
          updated_at: string
          ville: string | null
        }
        Insert: {
          adresse?: string | null
          contact?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nom: string
          observations?: string | null
          secteur?: string | null
          statut?: string
          telephone?: string | null
          updated_at?: string
          ville?: string | null
        }
        Update: {
          adresse?: string | null
          contact?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nom?: string
          observations?: string | null
          secteur?: string | null
          statut?: string
          telephone?: string | null
          updated_at?: string
          ville?: string | null
        }
        Relationships: []
      }
      material_responsibility_history: {
        Row: {
          chantier_id: string | null
          created_at: string
          date_debut: string
          date_fin: string | null
          id: string
          materiel_id: string
          movement_id_debut: string | null
          movement_id_fin: string | null
          technicien_id: string | null
        }
        Insert: {
          chantier_id?: string | null
          created_at?: string
          date_debut?: string
          date_fin?: string | null
          id?: string
          materiel_id: string
          movement_id_debut?: string | null
          movement_id_fin?: string | null
          technicien_id?: string | null
        }
        Update: {
          chantier_id?: string | null
          created_at?: string
          date_debut?: string
          date_fin?: string | null
          id?: string
          materiel_id?: string
          movement_id_debut?: string | null
          movement_id_fin?: string | null
          technicien_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "material_responsibility_history_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_responsibility_history_materiel_id_fkey"
            columns: ["materiel_id"]
            isOneToOne: false
            referencedRelation: "materiel_laboratoire"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_responsibility_history_movement_id_debut_fkey"
            columns: ["movement_id_debut"]
            isOneToOne: false
            referencedRelation: "materiel_movements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_responsibility_history_movement_id_fin_fkey"
            columns: ["movement_id_fin"]
            isOneToOne: false
            referencedRelation: "materiel_movements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_responsibility_history_technicien_id_fkey"
            columns: ["technicien_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
        ]
      }
      material_status_history: {
        Row: {
          ancien_statut:
            | Database["public"]["Enums"]["materiel_statut_courant"]
            | null
          changed_at: string
          changed_by: string | null
          id: string
          materiel_id: string
          motif: string | null
          movement_id: string | null
          nouveau_statut: Database["public"]["Enums"]["materiel_statut_courant"]
        }
        Insert: {
          ancien_statut?:
            | Database["public"]["Enums"]["materiel_statut_courant"]
            | null
          changed_at?: string
          changed_by?: string | null
          id?: string
          materiel_id: string
          motif?: string | null
          movement_id?: string | null
          nouveau_statut: Database["public"]["Enums"]["materiel_statut_courant"]
        }
        Update: {
          ancien_statut?:
            | Database["public"]["Enums"]["materiel_statut_courant"]
            | null
          changed_at?: string
          changed_by?: string | null
          id?: string
          materiel_id?: string
          motif?: string | null
          movement_id?: string | null
          nouveau_statut?: Database["public"]["Enums"]["materiel_statut_courant"]
        }
        Relationships: [
          {
            foreignKeyName: "material_status_history_materiel_id_fkey"
            columns: ["materiel_id"]
            isOneToOne: false
            referencedRelation: "materiel_laboratoire"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_status_history_movement_id_fkey"
            columns: ["movement_id"]
            isOneToOne: false
            referencedRelation: "materiel_movements"
            referencedColumns: ["id"]
          },
        ]
      }
      materiel: {
        Row: {
          created_at: string
          date_acquisition: string | null
          date_dernier_etalonnage: string | null
          date_prochain_etalonnage: string | null
          id: string
          localisation: string | null
          marque: string | null
          modele: string | null
          nom: string
          notes: string | null
          numero_serie: string | null
          reference: string | null
          statut: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_acquisition?: string | null
          date_dernier_etalonnage?: string | null
          date_prochain_etalonnage?: string | null
          id?: string
          localisation?: string | null
          marque?: string | null
          modele?: string | null
          nom: string
          notes?: string | null
          numero_serie?: string | null
          reference?: string | null
          statut?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_acquisition?: string | null
          date_dernier_etalonnage?: string | null
          date_prochain_etalonnage?: string | null
          id?: string
          localisation?: string | null
          marque?: string | null
          modele?: string | null
          nom?: string
          notes?: string | null
          numero_serie?: string | null
          reference?: string | null
          statut?: string
          updated_at?: string
        }
        Relationships: []
      }
      materiel_laboratoire: {
        Row: {
          categorie: string
          chantier_courant_id: string | null
          created_at: string
          date_acquisition: string | null
          etat: string
          id: string
          localisation: string | null
          marque: string | null
          modele: string | null
          nom: string
          numero_serie: string | null
          observations: string | null
          quantite: number
          reference: string | null
          responsable_courant_id: string | null
          statut_courant: Database["public"]["Enums"]["materiel_statut_courant"]
          updated_at: string
        }
        Insert: {
          categorie?: string
          chantier_courant_id?: string | null
          created_at?: string
          date_acquisition?: string | null
          etat?: string
          id?: string
          localisation?: string | null
          marque?: string | null
          modele?: string | null
          nom: string
          numero_serie?: string | null
          observations?: string | null
          quantite?: number
          reference?: string | null
          responsable_courant_id?: string | null
          statut_courant?: Database["public"]["Enums"]["materiel_statut_courant"]
          updated_at?: string
        }
        Update: {
          categorie?: string
          chantier_courant_id?: string | null
          created_at?: string
          date_acquisition?: string | null
          etat?: string
          id?: string
          localisation?: string | null
          marque?: string | null
          modele?: string | null
          nom?: string
          numero_serie?: string | null
          observations?: string | null
          quantite?: number
          reference?: string | null
          responsable_courant_id?: string | null
          statut_courant?: Database["public"]["Enums"]["materiel_statut_courant"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "materiel_laboratoire_chantier_courant_id_fkey"
            columns: ["chantier_courant_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materiel_laboratoire_responsable_courant_id_fkey"
            columns: ["responsable_courant_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
        ]
      }
      materiel_movements: {
        Row: {
          chantier_id: string | null
          created_at: string
          created_by: string | null
          created_by_nom: string | null
          date_mouvement: string
          heure_mouvement: string
          id: string
          motif: string | null
          numero: string
          observations: string | null
          parent_movement_id: string | null
          responsable_id: string | null
          statut: Database["public"]["Enums"]["mouvement_statut"]
          technicien_entrant_id: string | null
          technicien_sortant_id: string | null
          type: Database["public"]["Enums"]["mouvement_type"]
          updated_at: string
        }
        Insert: {
          chantier_id?: string | null
          created_at?: string
          created_by?: string | null
          created_by_nom?: string | null
          date_mouvement?: string
          heure_mouvement?: string
          id?: string
          motif?: string | null
          numero: string
          observations?: string | null
          parent_movement_id?: string | null
          responsable_id?: string | null
          statut?: Database["public"]["Enums"]["mouvement_statut"]
          technicien_entrant_id?: string | null
          technicien_sortant_id?: string | null
          type: Database["public"]["Enums"]["mouvement_type"]
          updated_at?: string
        }
        Update: {
          chantier_id?: string | null
          created_at?: string
          created_by?: string | null
          created_by_nom?: string | null
          date_mouvement?: string
          heure_mouvement?: string
          id?: string
          motif?: string | null
          numero?: string
          observations?: string | null
          parent_movement_id?: string | null
          responsable_id?: string | null
          statut?: Database["public"]["Enums"]["mouvement_statut"]
          technicien_entrant_id?: string | null
          technicien_sortant_id?: string | null
          type?: Database["public"]["Enums"]["mouvement_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "materiel_movements_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materiel_movements_parent_movement_id_fkey"
            columns: ["parent_movement_id"]
            isOneToOne: false
            referencedRelation: "materiel_movements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materiel_movements_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materiel_movements_technicien_entrant_id_fkey"
            columns: ["technicien_entrant_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materiel_movements_technicien_sortant_id_fkey"
            columns: ["technicien_sortant_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
        ]
      }
      movement_items: {
        Row: {
          created_at: string
          etat: Database["public"]["Enums"]["item_etat"]
          id: string
          materiel_id: string
          movement_id: string
          observations: string | null
          quantite: number
        }
        Insert: {
          created_at?: string
          etat?: Database["public"]["Enums"]["item_etat"]
          id?: string
          materiel_id: string
          movement_id: string
          observations?: string | null
          quantite?: number
        }
        Update: {
          created_at?: string
          etat?: Database["public"]["Enums"]["item_etat"]
          id?: string
          materiel_id?: string
          movement_id?: string
          observations?: string | null
          quantite?: number
        }
        Relationships: [
          {
            foreignKeyName: "movement_items_materiel_id_fkey"
            columns: ["materiel_id"]
            isOneToOne: false
            referencedRelation: "materiel_laboratoire"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movement_items_movement_id_fkey"
            columns: ["movement_id"]
            isOneToOne: false
            referencedRelation: "materiel_movements"
            referencedColumns: ["id"]
          },
        ]
      }
      movement_signatures: {
        Row: {
          id: string
          ip_address: string | null
          movement_id: string
          role: string
          signataire_fonction: string | null
          signataire_nom: string
          signature_data: string | null
          signed_at: string
          user_id: string | null
        }
        Insert: {
          id?: string
          ip_address?: string | null
          movement_id: string
          role: string
          signataire_fonction?: string | null
          signataire_nom: string
          signature_data?: string | null
          signed_at?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          ip_address?: string | null
          movement_id?: string
          role?: string
          signataire_fonction?: string | null
          signataire_nom?: string
          signature_data?: string | null
          signed_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movement_signatures_movement_id_fkey"
            columns: ["movement_id"]
            isOneToOne: false
            referencedRelation: "materiel_movements"
            referencedColumns: ["id"]
          },
        ]
      }
      offre_service_articles: {
        Row: {
          article_number: number
          contenu: string
          created_at: string
          id: string
          offre_service_id: string
          titre: string
          updated_at: string
        }
        Insert: {
          article_number: number
          contenu: string
          created_at?: string
          id?: string
          offre_service_id: string
          titre: string
          updated_at?: string
        }
        Update: {
          article_number?: number
          contenu?: string
          created_at?: string
          id?: string
          offre_service_id?: string
          titre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offre_service_articles_offre_service_id_fkey"
            columns: ["offre_service_id"]
            isOneToOne: false
            referencedRelation: "offres_service"
            referencedColumns: ["id"]
          },
        ]
      }
      offres_prix: {
        Row: {
          chantier_id: string | null
          client_id: string | null
          created_at: string
          date_document: string
          document_nom: string | null
          document_url: string | null
          id: string
          montant_ht: number | null
          montant_ttc: number | null
          numero: string | null
          observations: string | null
          statut: string
          titre: string
          updated_at: string
        }
        Insert: {
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_document?: string
          document_nom?: string | null
          document_url?: string | null
          id?: string
          montant_ht?: number | null
          montant_ttc?: number | null
          numero?: string | null
          observations?: string | null
          statut?: string
          titre: string
          updated_at?: string
        }
        Update: {
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_document?: string
          document_nom?: string | null
          document_url?: string | null
          id?: string
          montant_ht?: number | null
          montant_ttc?: number | null
          numero?: string | null
          observations?: string | null
          statut?: string
          titre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offres_prix_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offres_prix_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      offres_service: {
        Row: {
          chantier_id: string | null
          client_id: string | null
          created_at: string
          date_document: string
          description: string | null
          document_nom: string | null
          document_url: string | null
          id: string
          numero: string | null
          observations: string | null
          statut: string
          titre: string
          updated_at: string
        }
        Insert: {
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_document?: string
          description?: string | null
          document_nom?: string | null
          document_url?: string | null
          id?: string
          numero?: string | null
          observations?: string | null
          statut?: string
          titre: string
          updated_at?: string
        }
        Update: {
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_document?: string
          description?: string | null
          document_nom?: string | null
          document_url?: string | null
          id?: string
          numero?: string | null
          observations?: string | null
          statut?: string
          titre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offres_service_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offres_service_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      paiements_cheque: {
        Row: {
          banque: string | null
          client_id: string | null
          created_at: string
          date_echeance: string | null
          date_emission: string
          id: string
          montant: number
          numero_cheque: string
          observations: string | null
          statut: string
          updated_at: string
        }
        Insert: {
          banque?: string | null
          client_id?: string | null
          created_at?: string
          date_echeance?: string | null
          date_emission?: string
          id?: string
          montant?: number
          numero_cheque: string
          observations?: string | null
          statut?: string
          updated_at?: string
        }
        Update: {
          banque?: string | null
          client_id?: string | null
          created_at?: string
          date_echeance?: string | null
          date_emission?: string
          id?: string
          montant?: number
          numero_cheque?: string
          observations?: string | null
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "paiements_cheque_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      paiements_espece: {
        Row: {
          chantier_id: string | null
          client_id: string | null
          created_at: string
          date_paiement: string
          facture_id: string | null
          id: string
          montant: number
          numero_recu: string | null
          observations: string | null
          recu_url: string | null
          statut: string
          updated_at: string
        }
        Insert: {
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_paiement?: string
          facture_id?: string | null
          id?: string
          montant?: number
          numero_recu?: string | null
          observations?: string | null
          recu_url?: string | null
          statut?: string
          updated_at?: string
        }
        Update: {
          chantier_id?: string | null
          client_id?: string | null
          created_at?: string
          date_paiement?: string
          facture_id?: string | null
          id?: string
          montant?: number
          numero_recu?: string | null
          observations?: string | null
          recu_url?: string | null
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "paiements_espece_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paiements_espece_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paiements_espece_facture_id_fkey"
            columns: ["facture_id"]
            isOneToOne: false
            referencedRelation: "factures"
            referencedColumns: ["id"]
          },
        ]
      }
      paiements_virement: {
        Row: {
          banque: string | null
          client_id: string | null
          created_at: string
          date_virement: string
          facture_id: string | null
          id: string
          montant: number
          observations: string | null
          reference_virement: string | null
          statut: string
          updated_at: string
        }
        Insert: {
          banque?: string | null
          client_id?: string | null
          created_at?: string
          date_virement?: string
          facture_id?: string | null
          id?: string
          montant: number
          observations?: string | null
          reference_virement?: string | null
          statut?: string
          updated_at?: string
        }
        Update: {
          banque?: string | null
          client_id?: string | null
          created_at?: string
          date_virement?: string
          facture_id?: string | null
          id?: string
          montant?: number
          observations?: string | null
          reference_virement?: string | null
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "paiements_virement_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paiements_virement_facture_id_fkey"
            columns: ["facture_id"]
            isOneToOne: false
            referencedRelation: "factures"
            referencedColumns: ["id"]
          },
        ]
      }
      parametres_facturation: {
        Row: {
          banque_bic: string | null
          banque_iban: string | null
          banque_nom: string | null
          banque_rib: string | null
          conditions_paiement: string | null
          created_at: string
          delai_paiement: number
          id: string
          mention_legale: string | null
          penalite_retard: number
          prefixe_devis: string
          prefixe_facture: string
          prochain_numero_devis: number
          prochain_numero_facture: number
          updated_at: string
        }
        Insert: {
          banque_bic?: string | null
          banque_iban?: string | null
          banque_nom?: string | null
          banque_rib?: string | null
          conditions_paiement?: string | null
          created_at?: string
          delai_paiement?: number
          id?: string
          mention_legale?: string | null
          penalite_retard?: number
          prefixe_devis?: string
          prefixe_facture?: string
          prochain_numero_devis?: number
          prochain_numero_facture?: number
          updated_at?: string
        }
        Update: {
          banque_bic?: string | null
          banque_iban?: string | null
          banque_nom?: string | null
          banque_rib?: string | null
          conditions_paiement?: string | null
          created_at?: string
          delai_paiement?: number
          id?: string
          mention_legale?: string | null
          penalite_retard?: number
          prefixe_devis?: string
          prefixe_facture?: string
          prochain_numero_devis?: number
          prochain_numero_facture?: number
          updated_at?: string
        }
        Relationships: []
      }
      parametres_notifications: {
        Row: {
          created_at: string
          email_alertes: boolean
          email_nouveaux_essais: boolean
          email_rapports: boolean
          email_resultats: boolean
          id: string
          push_alertes: boolean
          push_nouveaux_essais: boolean
          push_rappels: boolean
          push_resultats: boolean
          sms_alertes_critiques: boolean
          sms_rappels_urgents: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          email_alertes?: boolean
          email_nouveaux_essais?: boolean
          email_rapports?: boolean
          email_resultats?: boolean
          id?: string
          push_alertes?: boolean
          push_nouveaux_essais?: boolean
          push_rappels?: boolean
          push_resultats?: boolean
          sms_alertes_critiques?: boolean
          sms_rappels_urgents?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          email_alertes?: boolean
          email_nouveaux_essais?: boolean
          email_rapports?: boolean
          email_resultats?: boolean
          id?: string
          push_alertes?: boolean
          push_nouveaux_essais?: boolean
          push_rappels?: boolean
          push_resultats?: boolean
          sms_alertes_critiques?: boolean
          sms_rappels_urgents?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      parametres_qrcode: {
        Row: {
          activer_qrcode: boolean
          couleur_qrcode: string
          created_at: string
          id: string
          inclure_logo: boolean
          position_qrcode: string
          taille_qrcode: string
          updated_at: string
          url_base: string | null
        }
        Insert: {
          activer_qrcode?: boolean
          couleur_qrcode?: string
          created_at?: string
          id?: string
          inclure_logo?: boolean
          position_qrcode?: string
          taille_qrcode?: string
          updated_at?: string
          url_base?: string | null
        }
        Update: {
          activer_qrcode?: boolean
          couleur_qrcode?: string
          created_at?: string
          id?: string
          inclure_logo?: boolean
          position_qrcode?: string
          taille_qrcode?: string
          updated_at?: string
          url_base?: string | null
        }
        Relationships: []
      }
      parametres_securite: {
        Row: {
          activer_2fa: boolean
          created_at: string
          duree_blocage: number
          duree_session: number
          exiger_chiffre: boolean
          exiger_majuscule: boolean
          exiger_special: boolean
          id: string
          journal_connexions: boolean
          journal_modifications: boolean
          longueur_mot_passe: number
          tentatives_max: number
          updated_at: string
        }
        Insert: {
          activer_2fa?: boolean
          created_at?: string
          duree_blocage?: number
          duree_session?: number
          exiger_chiffre?: boolean
          exiger_majuscule?: boolean
          exiger_special?: boolean
          id?: string
          journal_connexions?: boolean
          journal_modifications?: boolean
          longueur_mot_passe?: number
          tentatives_max?: number
          updated_at?: string
        }
        Update: {
          activer_2fa?: boolean
          created_at?: string
          duree_blocage?: number
          duree_session?: number
          exiger_chiffre?: boolean
          exiger_majuscule?: boolean
          exiger_special?: boolean
          id?: string
          journal_connexions?: boolean
          journal_modifications?: boolean
          longueur_mot_passe?: number
          tentatives_max?: number
          updated_at?: string
        }
        Relationships: []
      }
      parametres_signature: {
        Row: {
          cachet_auto: boolean
          created_at: string
          id: string
          inclure_date: boolean
          inclure_nom: boolean
          position_cachet: string
          position_signature: string
          signature_auto: boolean
          updated_at: string
        }
        Insert: {
          cachet_auto?: boolean
          created_at?: string
          id?: string
          inclure_date?: boolean
          inclure_nom?: boolean
          position_cachet?: string
          position_signature?: string
          signature_auto?: boolean
          updated_at?: string
        }
        Update: {
          cachet_auto?: boolean
          created_at?: string
          id?: string
          inclure_date?: boolean
          inclure_nom?: boolean
          position_cachet?: string
          position_signature?: string
          signature_auto?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      parametres_systeme: {
        Row: {
          couleur_accent: string
          created_at: string
          format_date: string
          format_nombre: string
          fuseau_horaire: string
          id: string
          langue: string
          logo_header: boolean
          nom_application: string | null
          theme: string
          updated_at: string
        }
        Insert: {
          couleur_accent?: string
          created_at?: string
          format_date?: string
          format_nombre?: string
          fuseau_horaire?: string
          id?: string
          langue?: string
          logo_header?: boolean
          nom_application?: string | null
          theme?: string
          updated_at?: string
        }
        Update: {
          couleur_accent?: string
          created_at?: string
          format_date?: string
          format_nombre?: string
          fuseau_horaire?: string
          id?: string
          langue?: string
          logo_header?: boolean
          nom_application?: string | null
          theme?: string
          updated_at?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          module: string
          nom: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          module: string
          nom: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          module?: string
          nom?: string
        }
        Relationships: []
      }
      postes: {
        Row: {
          competences: string[] | null
          created_at: string
          departement: string | null
          description: string | null
          id: string
          niveau_experience: string | null
          nom: string
          nombre_employes: number | null
          notes: string | null
          salaire_moyen: number | null
          type_contrat: string | null
          updated_at: string
        }
        Insert: {
          competences?: string[] | null
          created_at?: string
          departement?: string | null
          description?: string | null
          id?: string
          niveau_experience?: string | null
          nom: string
          nombre_employes?: number | null
          notes?: string | null
          salaire_moyen?: number | null
          type_contrat?: string | null
          updated_at?: string
        }
        Update: {
          competences?: string[] | null
          created_at?: string
          departement?: string | null
          description?: string | null
          id?: string
          niveau_experience?: string | null
          nom?: string
          nombre_employes?: number | null
          notes?: string | null
          salaire_moyen?: number | null
          type_contrat?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      prestataires: {
        Row: {
          adresse: string | null
          contact: string | null
          created_at: string
          email: string | null
          id: string
          nom: string
          observations: string | null
          specialite: string | null
          statut: string
          telephone: string | null
          updated_at: string
          ville: string | null
        }
        Insert: {
          adresse?: string | null
          contact?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nom: string
          observations?: string | null
          specialite?: string | null
          statut?: string
          telephone?: string | null
          updated_at?: string
          ville?: string | null
        }
        Update: {
          adresse?: string | null
          contact?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nom?: string
          observations?: string | null
          specialite?: string | null
          statut?: string
          telephone?: string | null
          updated_at?: string
          ville?: string | null
        }
        Relationships: []
      }
      prix_essais: {
        Row: {
          categorie: string
          code_essai: string | null
          created_at: string
          id: string
          nom_essai: string
          prix_unitaire: number
          unite: string
          updated_at: string
        }
        Insert: {
          categorie?: string
          code_essai?: string | null
          created_at?: string
          id?: string
          nom_essai: string
          prix_unitaire?: number
          unite?: string
          updated_at?: string
        }
        Update: {
          categorie?: string
          code_essai?: string | null
          created_at?: string
          id?: string
          nom_essai?: string
          prix_unitaire?: number
          unite?: string
          updated_at?: string
        }
        Relationships: []
      }
      produits: {
        Row: {
          created_at: string
          densite: number | null
          id: string
          nom: string
          producteur_id: string
          producteur_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          densite?: number | null
          id?: string
          nom: string
          producteur_id: string
          producteur_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          densite?: number | null
          id?: string
          nom?: string
          producteur_id?: string
          producteur_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      rapport_ai_calls: {
        Row: {
          cost_credits: number | null
          created_at: string
          created_by: string | null
          duration_ms: number | null
          error: string | null
          id: string
          model: string
          operation: string
          parsed_json: Json | null
          prompt_system: string | null
          prompt_user: string | null
          provider: string
          rapport_id: string | null
          raw_response: string | null
          status: string
          tokens_input: number | null
          tokens_output: number | null
          tokens_total: number | null
        }
        Insert: {
          cost_credits?: number | null
          created_at?: string
          created_by?: string | null
          duration_ms?: number | null
          error?: string | null
          id?: string
          model: string
          operation: string
          parsed_json?: Json | null
          prompt_system?: string | null
          prompt_user?: string | null
          provider?: string
          rapport_id?: string | null
          raw_response?: string | null
          status?: string
          tokens_input?: number | null
          tokens_output?: number | null
          tokens_total?: number | null
        }
        Update: {
          cost_credits?: number | null
          created_at?: string
          created_by?: string | null
          duration_ms?: number | null
          error?: string | null
          id?: string
          model?: string
          operation?: string
          parsed_json?: Json | null
          prompt_system?: string | null
          prompt_user?: string | null
          provider?: string
          rapport_id?: string | null
          raw_response?: string | null
          status?: string
          tokens_input?: number | null
          tokens_output?: number | null
          tokens_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rapport_ai_calls_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "rapports_techniques"
            referencedColumns: ["id"]
          },
        ]
      }
      rapport_categories: {
        Row: {
          created_at: string
          icone: string | null
          id: string
          nom: string
          ordre: number
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          icone?: string | null
          id?: string
          nom: string
          ordre?: number
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          icone?: string | null
          id?: string
          nom?: string
          ordre?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      rapport_historique: {
        Row: {
          action: string
          ancien_contenu: Json | null
          commentaire: string | null
          created_at: string
          id: string
          nouveau_contenu: Json | null
          rapport_id: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          ancien_contenu?: Json | null
          commentaire?: string | null
          created_at?: string
          id?: string
          nouveau_contenu?: Json | null
          rapport_id: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          ancien_contenu?: Json | null
          commentaire?: string | null
          created_at?: string
          id?: string
          nouveau_contenu?: Json | null
          rapport_id?: string
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rapport_historique_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "rapports_techniques"
            referencedColumns: ["id"]
          },
        ]
      }
      rapport_modeles_bibliotheque: {
        Row: {
          actif: boolean
          categorie_id: string | null
          created_at: string
          description: string | null
          id: string
          ordre: number
          prompt_template: string | null
          slug: string
          structure_default: Json
          titre: string
          updated_at: string
        }
        Insert: {
          actif?: boolean
          categorie_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          ordre?: number
          prompt_template?: string | null
          slug: string
          structure_default?: Json
          titre: string
          updated_at?: string
        }
        Update: {
          actif?: boolean
          categorie_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          ordre?: number
          prompt_template?: string | null
          slug?: string
          structure_default?: Json
          titre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rapport_modeles_bibliotheque_categorie_id_fkey"
            columns: ["categorie_id"]
            isOneToOne: false
            referencedRelation: "rapport_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      rapport_pieces_jointes: {
        Row: {
          created_at: string
          essai_ref: string | null
          id: string
          meta: Json | null
          nom: string
          rapport_id: string
          storage_path: string | null
          type: string
          uploaded_by: string | null
          url: string | null
        }
        Insert: {
          created_at?: string
          essai_ref?: string | null
          id?: string
          meta?: Json | null
          nom: string
          rapport_id: string
          storage_path?: string | null
          type: string
          uploaded_by?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string
          essai_ref?: string | null
          id?: string
          meta?: Json | null
          nom?: string
          rapport_id?: string
          storage_path?: string | null
          type?: string
          uploaded_by?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rapport_pieces_jointes_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "rapports_techniques"
            referencedColumns: ["id"]
          },
        ]
      }
      rapport_questions_ia: {
        Row: {
          answered_at: string | null
          created_at: string
          id: string
          ordre: number
          question: string
          rapport_id: string
          repondu_at: string | null
          reponse: string | null
          reponse_utilisateur: string | null
        }
        Insert: {
          answered_at?: string | null
          created_at?: string
          id?: string
          ordre?: number
          question: string
          rapport_id: string
          repondu_at?: string | null
          reponse?: string | null
          reponse_utilisateur?: string | null
        }
        Update: {
          answered_at?: string | null
          created_at?: string
          id?: string
          ordre?: number
          question?: string
          rapport_id?: string
          repondu_at?: string | null
          reponse?: string | null
          reponse_utilisateur?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rapport_questions_ia_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "rapports_techniques"
            referencedColumns: ["id"]
          },
        ]
      }
      rapport_templates: {
        Row: {
          actif: boolean
          couleur_primaire: string | null
          couleur_secondaire: string | null
          created_at: string
          created_by: string | null
          description: string | null
          entreprise_id: string | null
          footer_html: string | null
          header_html: string | null
          id: string
          is_default: boolean
          logo_url: string | null
          marge_bas: number | null
          marge_droite: number | null
          marge_gauche: number | null
          marge_haut: number | null
          nom: string
          numerotation_format: string | null
          updated_at: string
        }
        Insert: {
          actif?: boolean
          couleur_primaire?: string | null
          couleur_secondaire?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          entreprise_id?: string | null
          footer_html?: string | null
          header_html?: string | null
          id?: string
          is_default?: boolean
          logo_url?: string | null
          marge_bas?: number | null
          marge_droite?: number | null
          marge_gauche?: number | null
          marge_haut?: number | null
          nom: string
          numerotation_format?: string | null
          updated_at?: string
        }
        Update: {
          actif?: boolean
          couleur_primaire?: string | null
          couleur_secondaire?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          entreprise_id?: string | null
          footer_html?: string | null
          header_html?: string | null
          id?: string
          is_default?: boolean
          logo_url?: string | null
          marge_bas?: number | null
          marge_droite?: number | null
          marge_gauche?: number | null
          marge_haut?: number | null
          nom?: string
          numerotation_format?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rapport_versions: {
        Row: {
          commentaire: string | null
          contenu: Json | null
          created_at: string
          created_by: string | null
          editor_html: string | null
          event_type: string
          id: string
          rapport_id: string
          titre: string | null
          version: number
        }
        Insert: {
          commentaire?: string | null
          contenu?: Json | null
          created_at?: string
          created_by?: string | null
          editor_html?: string | null
          event_type?: string
          id?: string
          rapport_id: string
          titre?: string | null
          version: number
        }
        Update: {
          commentaire?: string | null
          contenu?: Json | null
          created_at?: string
          created_by?: string | null
          editor_html?: string | null
          event_type?: string
          id?: string
          rapport_id?: string
          titre?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "rapport_versions_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "rapports_techniques"
            referencedColumns: ["id"]
          },
        ]
      }
      rapport_workflow_events: {
        Row: {
          action: string
          ancien_statut: string | null
          commentaire: string | null
          created_at: string
          created_by: string | null
          id: string
          nouveau_statut: string
          rapport_id: string
        }
        Insert: {
          action: string
          ancien_statut?: string | null
          commentaire?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          nouveau_statut: string
          rapport_id: string
        }
        Update: {
          action?: string
          ancien_statut?: string | null
          commentaire?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          nouveau_statut?: string
          rapport_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rapport_workflow_events_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "rapports_techniques"
            referencedColumns: ["id"]
          },
        ]
      }
      rapports_techniques: {
        Row: {
          analyse_ia: Json | null
          categorie_id: string | null
          chantier_id: string | null
          client_id: string | null
          contenu_rapport: Json | null
          contexte_auto: Json | null
          created_at: string
          created_by: string | null
          date_probleme: string | null
          description_probleme: string
          editor_html: string | null
          entreprise: string | null
          gravite: Database["public"]["Enums"]["rapport_gravite"] | null
          id: string
          ingenieur_id: string | null
          last_autosave_at: string | null
          materiau: string | null
          metadonnees: Json | null
          modele_id: string | null
          motif_refus: string | null
          numero: string | null
          pdf_url: string | null
          projet: string | null
          prompt_utilisateur: string | null
          publie_at: string | null
          qr_token: string | null
          refuse_at: string | null
          signature_ingenieur_id: string | null
          soumis_at: string | null
          sous_type: string | null
          statut: Database["public"]["Enums"]["rapport_statut"]
          technicien_id: string | null
          template_id: string | null
          titre: string | null
          updated_at: string
          valide_at: string | null
          version: number
          version_courante: number
        }
        Insert: {
          analyse_ia?: Json | null
          categorie_id?: string | null
          chantier_id?: string | null
          client_id?: string | null
          contenu_rapport?: Json | null
          contexte_auto?: Json | null
          created_at?: string
          created_by?: string | null
          date_probleme?: string | null
          description_probleme: string
          editor_html?: string | null
          entreprise?: string | null
          gravite?: Database["public"]["Enums"]["rapport_gravite"] | null
          id?: string
          ingenieur_id?: string | null
          last_autosave_at?: string | null
          materiau?: string | null
          metadonnees?: Json | null
          modele_id?: string | null
          motif_refus?: string | null
          numero?: string | null
          pdf_url?: string | null
          projet?: string | null
          prompt_utilisateur?: string | null
          publie_at?: string | null
          qr_token?: string | null
          refuse_at?: string | null
          signature_ingenieur_id?: string | null
          soumis_at?: string | null
          sous_type?: string | null
          statut?: Database["public"]["Enums"]["rapport_statut"]
          technicien_id?: string | null
          template_id?: string | null
          titre?: string | null
          updated_at?: string
          valide_at?: string | null
          version?: number
          version_courante?: number
        }
        Update: {
          analyse_ia?: Json | null
          categorie_id?: string | null
          chantier_id?: string | null
          client_id?: string | null
          contenu_rapport?: Json | null
          contexte_auto?: Json | null
          created_at?: string
          created_by?: string | null
          date_probleme?: string | null
          description_probleme?: string
          editor_html?: string | null
          entreprise?: string | null
          gravite?: Database["public"]["Enums"]["rapport_gravite"] | null
          id?: string
          ingenieur_id?: string | null
          last_autosave_at?: string | null
          materiau?: string | null
          metadonnees?: Json | null
          modele_id?: string | null
          motif_refus?: string | null
          numero?: string | null
          pdf_url?: string | null
          projet?: string | null
          prompt_utilisateur?: string | null
          publie_at?: string | null
          qr_token?: string | null
          refuse_at?: string | null
          signature_ingenieur_id?: string | null
          soumis_at?: string | null
          sous_type?: string | null
          statut?: Database["public"]["Enums"]["rapport_statut"]
          technicien_id?: string | null
          template_id?: string | null
          titre?: string | null
          updated_at?: string
          valide_at?: string | null
          version?: number
          version_courante?: number
        }
        Relationships: [
          {
            foreignKeyName: "rapports_techniques_categorie_id_fkey"
            columns: ["categorie_id"]
            isOneToOne: false
            referencedRelation: "rapport_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rapports_techniques_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rapports_techniques_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rapports_techniques_modele_id_fkey"
            columns: ["modele_id"]
            isOneToOne: false
            referencedRelation: "rapport_modeles_bibliotheque"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rapports_techniques_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "rapport_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      role_definitions: {
        Row: {
          alias_of: Database["public"]["Enums"]["app_role"] | null
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          key: string
          label: string
          updated_at: string
        }
        Insert: {
          alias_of?: Database["public"]["Enums"]["app_role"] | null
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          key: string
          label: string
          updated_at?: string
        }
        Update: {
          alias_of?: Database["public"]["Enums"]["app_role"] | null
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          key?: string
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      sources_eau: {
        Row: {
          adresse: string | null
          contact: string | null
          created_at: string
          debit: string | null
          email: string | null
          id: string
          nom: string
          telephone: string | null
          updated_at: string
          ville: string | null
        }
        Insert: {
          adresse?: string | null
          contact?: string | null
          created_at?: string
          debit?: string | null
          email?: string | null
          id?: string
          nom: string
          telephone?: string | null
          updated_at?: string
          ville?: string | null
        }
        Update: {
          adresse?: string | null
          contact?: string | null
          created_at?: string
          debit?: string | null
          email?: string | null
          id?: string
          nom?: string
          telephone?: string | null
          updated_at?: string
          ville?: string | null
        }
        Relationships: []
      }
      taux_tva: {
        Row: {
          actif: boolean
          created_at: string
          description: string | null
          id: string
          nom: string
          taux: number
          updated_at: string
        }
        Insert: {
          actif?: boolean
          created_at?: string
          description?: string | null
          id?: string
          nom: string
          taux: number
          updated_at?: string
        }
        Update: {
          actif?: boolean
          created_at?: string
          description?: string | null
          id?: string
          nom?: string
          taux?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      utilisateurs: {
        Row: {
          created_at: string
          derniere_connexion: string | null
          email: string
          id: string
          intervenant_id: string | null
          nom: string
          poste_id: string | null
          role: string
          statut: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          derniere_connexion?: string | null
          email: string
          id?: string
          intervenant_id?: string | null
          nom: string
          poste_id?: string | null
          role?: string
          statut?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          derniere_connexion?: string | null
          email?: string
          id?: string
          intervenant_id?: string | null
          nom?: string
          poste_id?: string | null
          role?: string
          statut?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "utilisateurs_intervenant_id_fkey"
            columns: ["intervenant_id"]
            isOneToOne: false
            referencedRelation: "intervenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utilisateurs_poste_id_fkey"
            columns: ["poste_id"]
            isOneToOne: false
            referencedRelation: "postes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_write_business: { Args: never; Returns: boolean }
      get_entreprise_public: {
        Args: never
        Returns: {
          annexe: string
          cachet_url: string
          created_at: string
          date_autorisation: string
          email: string
          id: string
          logo_url: string
          nom: string
          numero_autorisation: string
          representant: string
          siege_social: string
          site_web: string
          telephone: string
          updated_at: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_permission: {
        Args: { _permission_code: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_only: { Args: never; Returns: boolean }
      is_admin_or_manager: { Args: never; Returns: boolean }
      log_audit_action: {
        Args: {
          p_action: string
          p_cible?: string
          p_details?: string
          p_type: string
          p_utilisateur_id?: string
          p_utilisateur_nom?: string
        }
        Returns: string
      }
      next_movement_numero: {
        Args: { _type: Database["public"]["Enums"]["mouvement_type"] }
        Returns: string
      }
      next_rapport_numero: { Args: never; Returns: string }
      restore_deleted_essai: { Args: { _deleted_id: string }; Returns: string }
      restore_essai_field: {
        Args: {
          _field_name: string
          _history_id: string
          _old_value: Json
          _record_id: string
          _table_name: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "admin"
        | "manager"
        | "technicien"
        | "operateur"
        | "lecteur"
        | "ingenieur"
      essai_status: "pending" | "in-progress" | "completed" | "cancelled"
      item_etat: "bon" | "usage" | "casse" | "manquant" | "a_reparer"
      materiel_statut_courant:
        | "disponible"
        | "affecte"
        | "pris_en_charge"
        | "en_passation"
        | "restitue"
        | "en_maintenance"
        | "hors_service"
        | "perdu"
        | "vole"
        | "reforme"
      mouvement_statut: "brouillon" | "valide" | "signe" | "annule"
      mouvement_type: "affectation" | "decharge" | "passation" | "restitution"
      rapport_gravite: "faible" | "moderee" | "elevee" | "critique"
      rapport_statut:
        | "brouillon"
        | "en_cours"
        | "a_completer"
        | "en_attente_validation"
        | "valide"
        | "refuse"
        | "archive"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "super_admin",
        "admin",
        "manager",
        "technicien",
        "operateur",
        "lecteur",
        "ingenieur",
      ],
      essai_status: ["pending", "in-progress", "completed", "cancelled"],
      item_etat: ["bon", "usage", "casse", "manquant", "a_reparer"],
      materiel_statut_courant: [
        "disponible",
        "affecte",
        "pris_en_charge",
        "en_passation",
        "restitue",
        "en_maintenance",
        "hors_service",
        "perdu",
        "vole",
        "reforme",
      ],
      mouvement_statut: ["brouillon", "valide", "signe", "annule"],
      mouvement_type: ["affectation", "decharge", "passation", "restitution"],
      rapport_gravite: ["faible", "moderee", "elevee", "critique"],
      rapport_statut: [
        "brouillon",
        "en_cours",
        "a_completer",
        "en_attente_validation",
        "valide",
        "refuse",
        "archive",
      ],
    },
  },
} as const
