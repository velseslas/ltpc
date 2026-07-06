import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useEntreprise } from "@/hooks/useEntreprise";
import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { normalizeQRValue } from "@/lib/qrContent";

interface FeuilleEssaiDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  normeTitle: string;
  normeNumber: string;
}

interface FieldConfig {
  label: string;
  colSpan?: number;
  type?: "text" | "table";
  rows?: number;
  tableHeaders?: string[];
  tableRows?: number;
  tableData?: string[][];
}

const TAMIS_GRANULAT = ["40", "31.5", "25", "20", "16", "12.5", "10", "8", "6.3", "5", "4", "2", "1", "0.5", "0.25", "0.125", "0.063"];
const TAMIS_SOL = ["125", "100", "80", "63", "50", "40", "31.5", "25", "20", "16", "12.5", "10", "8", "6.3", "5", "4", "2", "1", "0.5", "0.25", "0.125", "0.08", "0.063"];

const feuilleFieldsConfig: Record<string, FieldConfig[]> = {
  "Analyse Granulométrique": [
    { label: "N° Échantillon" },
    { label: "Date d'essai" },
    { label: "Technicien" },
    { label: "Carrière / Provenance" },
    { label: "Client" },
    { label: "Chantier" },
    { label: "Produit" },
    { label: "Masse sèche initiale M1 (g)" },
    { label: "Masse après lavage M2 (g)" },
    { label: "Observations", colSpan: 2, rows: 2 },
    { label: "Résultats de tamisage", type: "table", colSpan: 2, tableHeaders: ["Tamis (mm)", "Refus partiel (g)", "Refus cumulé (g)", "Refus cumulé (%)", "Passant (%)"], tableRows: TAMIS_GRANULAT.length + 1, tableData: [...TAMIS_GRANULAT.map(t => [t, "", "", "", ""]), ["Fond P", "", "", "", ""]] },
  ],
  "Forme des Granulats": [
    { label: "N° Échantillon" },
    { label: "Date d'essai" },
    { label: "Technicien" },
    { label: "Carrière / Provenance" },
    { label: "Client" },
    { label: "Chantier" },
    { label: "Produit" },
    { label: "Masse totale (g)" },
    { label: "Observations", colSpan: 2, rows: 2 },
    { label: "Mesures par fraction", type: "table", colSpan: 2, tableHeaders: ["Fraction di/Di", "Masse Mi (g)", "Passant grille mi (g)", "FI partiel (%)"], tableRows: 6 },
  ],
  "Masse Volumique et Absorption": [
    { label: "N° Échantillon" },
    { label: "Date d'essai" },
    { label: "Technicien" },
    { label: "Carrière / Provenance" },
    { label: "Client" },
    { label: "Chantier" },
    { label: "Produit" },
    { label: "Méthode (Pycnomètre / Panier)" },
    { label: "M1 - Masse SSS dans l'air (g)" },
    { label: "M2 - Masse dans l'eau (g)" },
    { label: "M3 - Masse sèche (g)" },
    { label: "Masse volumique réelle ρa (Mg/m³)" },
    { label: "Masse volumique SSS ρssd (Mg/m³)" },
    { label: "Absorption WA24 (%)" },
    { label: "Observations", colSpan: 2, rows: 2 },
  ],
  "Teneur en Eau": [
    { label: "N° Échantillon" },
    { label: "Date d'essai" },
    { label: "Technicien" },
    { label: "Carrière / Provenance" },
    { label: "Client" },
    { label: "Chantier" },
    { label: "Produit" },
    { label: "Masse récipient Mr (g)" },
    { label: "Mesures", type: "table", colSpan: 2, tableHeaders: ["Essai", "M1 - Masse humide + récipient (g)", "M2 - Masse sèche + récipient (g)", "Teneur en eau w (%)"], tableRows: 3 },
    { label: "Observations", colSpan: 2, rows: 2 },
  ],
  "Équivalent de Sable": [
    { label: "N° Échantillon" },
    { label: "Date d'essai" },
    { label: "Technicien" },
    { label: "Carrière / Provenance" },
    { label: "Client" },
    { label: "Chantier" },
    { label: "Produit" },
    { label: "Température de la solution (°C)" },
    { label: "Mesures", type: "table", colSpan: 2, tableHeaders: ["Éprouvette", "h1 - Hauteur totale (mm)", "h2 - Hauteur sable au piston (mm)", "h'2 - Hauteur sable visuel (mm)", "ES piston (%)", "ES visuel (%)"], tableRows: 3 },
    { label: "ES moyen piston (%)" },
    { label: "ES moyen visuel (%)" },
    { label: "Observations", colSpan: 2, rows: 2 },
  ],
  "Bleu de Méthylène": [
    { label: "N° Échantillon" },
    { label: "Date d'essai" },
    { label: "Technicien" },
    { label: "Carrière / Provenance" },
    { label: "Client" },
    { label: "Chantier" },
    { label: "Produit" },
    { label: "Masse échantillon M0 (g)" },
    { label: "Mesures", type: "table", colSpan: 2, tableHeaders: ["Dose N°", "Volume ajouté (ml)", "Volume cumulé V (ml)", "Auréole (Oui/Non)"], tableRows: 10 },
    { label: "Volume total V (ml)" },
    { label: "MB = V × 0,01 / M0 (g/kg)" },
    { label: "Observations", colSpan: 2, rows: 2 },
  ],
  "Matière Organique": [
    { label: "N° Échantillon" },
    { label: "Date d'essai" },
    { label: "Technicien" },
    { label: "Carrière / Provenance" },
    { label: "Client" },
    { label: "Chantier" },
    { label: "Produit" },
    { label: "Classe de couleur (0 à 4)" },
    { label: "Comparaison solution étalon" },
    { label: "Résultat (Acceptable / Impropre)" },
    { label: "Observations", colSpan: 2, rows: 2 },
  ],
  "Essai Los Angeles": [
    { label: "N° Échantillon" },
    { label: "Date d'essai" },
    { label: "Technicien" },
    { label: "Carrière / Provenance" },
    { label: "Client" },
    { label: "Chantier" },
    { label: "Produit" },
    { label: "Classe granulaire" },
    { label: "Masse initiale M (g)" },
    { label: "Nombre de boulets" },
    { label: "Mesures", type: "table", colSpan: 2, tableHeaders: ["Essai", "Masse initiale (g)", "Refus tamis 1,6 mm m (g)", "LA = 100×(M-m)/M (%)"], tableRows: 3 },
    { label: "LA moyen (%)" },
    { label: "Catégorie" },
    { label: "Observations", colSpan: 2, rows: 2 },
  ],
  "Essai Micro-Deval": [
    { label: "N° Échantillon" },
    { label: "Date d'essai" },
    { label: "Technicien" },
    { label: "Carrière / Provenance" },
    { label: "Client" },
    { label: "Chantier" },
    { label: "Produit" },
    { label: "Classe granulaire" },
    { label: "Mesures", type: "table", colSpan: 2, tableHeaders: ["Essai", "Masse initiale (g)", "Refus tamis 1,6 mm m (g)", "MDE = 100×(500-m)/500 (%)"], tableRows: 3 },
    { label: "MDE moyen (%)" },
    { label: "Catégorie" },
    { label: "Observations", colSpan: 2, rows: 2 },
  ],
  "Friabilité des Sables": [
    { label: "N° Échantillon" },
    { label: "Date d'essai" },
    { label: "Technicien" },
    { label: "Carrière / Provenance" },
    { label: "Client" },
    { label: "Chantier" },
    { label: "Produit" },
    { label: "Mesures", type: "table", colSpan: 2, tableHeaders: ["Essai", "Masse initiale (g)", "Passant 0,1 mm p (g)", "FS = 100×p/500 (%)"], tableRows: 3 },
    { label: "FS moyen (%)" },
    { label: "Classification" },
    { label: "Observations", colSpan: 2, rows: 2 },
  ],
  "Coefficient d'Écrasement": [
    { label: "N° Échantillon" },
    { label: "Date d'essai" },
    { label: "Technicien" },
    { label: "Carrière / Provenance" },
    { label: "Client" },
    { label: "Chantier" },
    { label: "Produit" },
    { label: "Classe granulaire" },
    { label: "Diamètre moule (mm)" },
    { label: "Charge appliquée (kN)" },
    { label: "Mesures", type: "table", colSpan: 2, tableHeaders: ["Essai", "Masse initiale M0 (g)", "Passant tamis m (g)", "Ce = 100×m/M0 (%)"], tableRows: 3 },
    { label: "Ce moyen (%)" },
    { label: "Classification" },
    { label: "Observations", colSpan: 2, rows: 2 },
  ],
  // === BÉTON FRAIS ===
  "Essai d'Affaissement": [
    { label: "N° Échantillon" },
    { label: "Date d'essai" },
    { label: "Technicien" },
    { label: "Client" },
    { label: "Chantier" },
    { label: "Centrale à béton" },
    { label: "Ouvrage / Destination" },
    { label: "Classe de résistance" },
    { label: "Classe de consistance" },
    { label: "Température béton (°C)" },
    { label: "Température air (°C)" },
    { label: "Mesures", type: "table", colSpan: 2, tableHeaders: ["Mesure N°", "Affaissement (mm)", "Type (Vrai/Cisaillé)", "Observations"], tableRows: 3 },
    { label: "Affaissement moyen (mm)" },
    { label: "Conformité (Oui/Non)" },
    { label: "Observations", colSpan: 2, rows: 2 },
  ],
  "Masse Volumique du Béton Frais": [
    { label: "N° Échantillon" },
    { label: "Date d'essai" },
    { label: "Technicien" },
    { label: "Client" },
    { label: "Chantier" },
    { label: "Centrale à béton" },
    { label: "Masse du récipient vide m1 (kg)" },
    { label: "Volume du récipient V (L)" },
    { label: "Mesures", type: "table", colSpan: 2, tableHeaders: ["Mesure N°", "Masse récipient + béton m2 (kg)", "ρ = (m2-m1)/V (kg/m³)"], tableRows: 3 },
    { label: "Masse volumique moyenne (kg/m³)" },
    { label: "Observations", colSpan: 2, rows: 2 },
  ],
  "Teneur en Air du Béton Frais": [
    { label: "N° Échantillon" },
    { label: "Date d'essai" },
    { label: "Technicien" },
    { label: "Client" },
    { label: "Chantier" },
    { label: "Centrale à béton" },
    { label: "Type d'aéromètre" },
    { label: "Mesures", type: "table", colSpan: 2, tableHeaders: ["Mesure N°", "Teneur en air A (%)", "Facteur de correction G (%)", "A corrigé (%)"], tableRows: 3 },
    { label: "Teneur en air moyenne (%)" },
    { label: "Observations", colSpan: 2, rows: 2 },
  ],
  "Essai de Température": [
    { label: "N° Échantillon" },
    { label: "Date d'essai" },
    { label: "Technicien" },
    { label: "Client" },
    { label: "Chantier" },
    { label: "Centrale à béton" },
    { label: "Mesures", type: "table", colSpan: 2, tableHeaders: ["Mesure N°", "Température béton (°C)", "Température ambiante (°C)", "Heure"], tableRows: 5 },
    { label: "Température moyenne béton (°C)" },
    { label: "Observations", colSpan: 2, rows: 2 },
  ],
  // === BÉTON DURCI ===
  "Résistance à la Compression": [
    { label: "N° Échantillon" },
    { label: "Date de coulage" },
    { label: "Date d'essai" },
    { label: "Technicien" },
    { label: "Client" },
    { label: "Chantier" },
    { label: "Centrale à béton" },
    { label: "Classe de résistance" },
    { label: "Type d'éprouvette" },
    { label: "Dimension éprouvette" },
    { label: "Mesures", type: "table", colSpan: 2, tableHeaders: ["Éprouvette N°", "Âge (j)", "Masse (g)", "Dimensions (mm)", "Charge F (kN)", "fc (MPa)", "Type rupture"], tableRows: 6 },
    { label: "fc moyen (MPa)" },
    { label: "Conformité" },
    { label: "Observations", colSpan: 2, rows: 2 },
  ],
  "Traction par Fendage": [
    { label: "N° Échantillon" },
    { label: "Date de coulage" },
    { label: "Date d'essai" },
    { label: "Technicien" },
    { label: "Client" },
    { label: "Chantier" },
    { label: "Mesures", type: "table", colSpan: 2, tableHeaders: ["Éprouvette N°", "Diamètre d (mm)", "Longueur L (mm)", "Charge F (kN)", "fct (MPa)"], tableRows: 4 },
    { label: "fct moyen (MPa)" },
    { label: "Observations", colSpan: 2, rows: 2 },
  ],
  "Module d'Élasticité": [
    { label: "N° Échantillon" },
    { label: "Date de coulage" },
    { label: "Date d'essai" },
    { label: "Technicien" },
    { label: "Client" },
    { label: "Chantier" },
    { label: "fc de référence (MPa)" },
    { label: "Mesures", type: "table", colSpan: 2, tableHeaders: ["Cycle", "σb (MPa)", "σa (MPa)", "εb (×10⁻⁶)", "εa (×10⁻⁶)", "Ec (GPa)"], tableRows: 4 },
    { label: "Ec moyen (GPa)" },
    { label: "Observations", colSpan: 2, rows: 2 },
  ],
  "Perméabilité à l'Eau": [
    { label: "N° Échantillon" },
    { label: "Date d'essai" },
    { label: "Technicien" },
    { label: "Client" },
    { label: "Chantier" },
    { label: "Pression appliquée (kPa)" },
    { label: "Durée d'essai (h)" },
    { label: "Mesures", type: "table", colSpan: 2, tableHeaders: ["Éprouvette N°", "Dimensions (mm)", "Profondeur max Dmax (mm)", "Profondeur moy (mm)"], tableRows: 4 },
    { label: "Conformité (Dmax ≤ 50 mm)" },
    { label: "Observations", colSpan: 2, rows: 2 },
  ],
  // === GÉOTECHNIQUE - IDENTIFICATION ===
  "Limites d'Atterberg": [
    { label: "N° Échantillon" },
    { label: "Date d'essai" },
    { label: "Technicien" },
    { label: "Client" },
    { label: "Chantier" },
    { label: "Profondeur (m)" },
    { label: "Type de sol" },
    { label: "Essais WL (Coupelle de Casagrande)", type: "table", colSpan: 2, tableHeaders: ["Essai N°", "Nb coups", "Tare (g)", "Mh (g)", "Ms (g)", "w (%)"], tableRows: 6 },
    { label: "Essais WP (Rouleau)", type: "table", colSpan: 2, tableHeaders: ["Essai N°", "Tare (g)", "Mh (g)", "Ms (g)", "w (%)"], tableRows: 2 },
    { label: "WL (%)" },
    { label: "WP (%)" },
    { label: "IP = WL - WP (%)" },
    { label: "Classification Casagrande" },
    { label: "Observations", colSpan: 2, rows: 2 },
  ],
  "Analyse Granulométrique des Sols": [
    { label: "N° Échantillon" },
    { label: "Date d'essai" },
    { label: "Technicien" },
    { label: "Client" },
    { label: "Chantier" },
    { label: "Profondeur (m)" },
    { label: "Masse sèche initiale (g)" },
    { label: "Tamisage", type: "table", colSpan: 2, tableHeaders: ["Tamis (mm)", "Refus partiel (g)", "Refus cumulé (g)", "Refus cumulé (%)", "Passant (%)"], tableRows: TAMIS_SOL.length + 1, tableData: [...TAMIS_SOL.map(t => [t, "", "", "", ""]), ["Fond P", "", "", "", ""]] },
    { label: "Observations", colSpan: 2, rows: 2 },
  ],
  "Teneur en Eau Pondérale": [
    { label: "N° Échantillon" },
    { label: "Date d'essai" },
    { label: "Technicien" },
    { label: "Client" },
    { label: "Chantier" },
    { label: "Profondeur (m)" },
    { label: "Mesures", type: "table", colSpan: 2, tableHeaders: ["Essai N°", "Tare (g)", "Mh + tare (g)", "Ms + tare (g)", "w (%)"], tableRows: 3 },
    { label: "Teneur en eau moyenne w (%)" },
    { label: "Observations", colSpan: 2, rows: 2 },
  ],
  "Classification des Sols": [
    { label: "N° Échantillon" },
    { label: "Date d'essai" },
    { label: "Technicien" },
    { label: "Client" },
    { label: "Chantier" },
    { label: "Profondeur (m)" },
    { label: "Dmax (mm)" },
    { label: "% passant 80 µm" },
    { label: "% passant 2 mm" },
    { label: "WL (%)" },
    { label: "IP (%)" },
    { label: "VBS (g/100g)" },
    { label: "Classification GTR" },
    { label: "État hydrique" },
    { label: "Observations", colSpan: 2, rows: 2 },
  ],
  // === GÉOTECHNIQUE - COMPACTAGE ===
  "Essai Proctor Normal": [
    { label: "N° Échantillon" },
    { label: "Date d'essai" },
    { label: "Technicien" },
    { label: "Client" },
    { label: "Chantier" },
    { label: "Type de sol" },
    { label: "Type de moule" },
    { label: "Mesures", type: "table", colSpan: 2, tableHeaders: ["Point N°", "Eau ajoutée (ml)", "Mh moule (g)", "Teneur en eau w (%)", "γd (kN/m³)"], tableRows: 5 },
    { label: "γd max (kN/m³)" },
    { label: "w OPN (%)" },
    { label: "Observations", colSpan: 2, rows: 2 },
  ],
  "Essai Proctor Modifié": [
    { label: "N° Échantillon" },
    { label: "Date d'essai" },
    { label: "Technicien" },
    { label: "Client" },
    { label: "Chantier" },
    { label: "Type de sol" },
    { label: "Type de moule" },
    { label: "Mesures", type: "table", colSpan: 2, tableHeaders: ["Point N°", "Eau ajoutée (ml)", "Mh moule (g)", "Teneur en eau w (%)", "γd (kN/m³)"], tableRows: 5 },
    { label: "γd max (kN/m³)" },
    { label: "w OPM (%)" },
    { label: "Observations", colSpan: 2, rows: 2 },
  ],
  "Essai CBR": [
    { label: "N° Échantillon" },
    { label: "Date d'essai" },
    { label: "Technicien" },
    { label: "Client" },
    { label: "Chantier" },
    { label: "Type de sol" },
    { label: "Énergie de compactage" },
    { label: "Mesures poinçonnement", type: "table", colSpan: 2, tableHeaders: ["Enfoncement (mm)", "Force 10 coups (kN)", "Force 25 coups (kN)", "Force 55 coups (kN)"], tableRows: 8 },
    { label: "CBR immédiat (IPI)" },
    { label: "CBR imbibé (4j)" },
    { label: "Gonflement (%)" },
    { label: "Observations", colSpan: 2, rows: 2 },
  ],
  "Densité en Place": [
    { label: "N° Échantillon" },
    { label: "Date d'essai" },
    { label: "Technicien" },
    { label: "Client" },
    { label: "Chantier" },
    { label: "Point kilométrique / Localisation" },
    { label: "Couche" },
    { label: "Mesures", type: "table", colSpan: 2, tableHeaders: ["Point N°", "Mh (g)", "Volume V (cm³)", "w (%)", "γd (kN/m³)", "% compactage"], tableRows: 5 },
    { label: "Observations", colSpan: 2, rows: 2 },
  ],
  // === GÉOTECHNIQUE - MÉCANIQUE ===
  "Cisaillement Direct": [
    { label: "N° Échantillon" },
    { label: "Date d'essai" },
    { label: "Technicien" },
    { label: "Client" },
    { label: "Chantier" },
    { label: "Profondeur (m)" },
    { label: "Type de sol" },
    { label: "Type d'essai (CD/CU/UU)" },
    { label: "Dimensions éprouvette" },
    { label: "Mesures", type: "table", colSpan: 2, tableHeaders: ["Essai N°", "σn (kPa)", "τ max (kPa)", "δh à rupture (mm)", "δv max (mm)"], tableRows: 3 },
    { label: "c (kPa)" },
    { label: "φ (°)" },
    { label: "Observations", colSpan: 2, rows: 2 },
  ],
  "Compression Simple": [
    { label: "N° Échantillon" },
    { label: "Date d'essai" },
    { label: "Technicien" },
    { label: "Client" },
    { label: "Chantier" },
    { label: "Profondeur (m)" },
    { label: "Type de sol" },
    { label: "Mesures", type: "table", colSpan: 2, tableHeaders: ["Éprouvette N°", "Ø (mm)", "H (mm)", "Masse (g)", "Force F (kN)", "qu (kPa)"], tableRows: 3 },
    { label: "qu moyen (kPa)" },
    { label: "cu = qu/2 (kPa)" },
    { label: "Observations", colSpan: 2, rows: 2 },
  ],
  "Essai Triaxial": [
    { label: "N° Échantillon" },
    { label: "Date d'essai" },
    { label: "Technicien" },
    { label: "Client" },
    { label: "Chantier" },
    { label: "Profondeur (m)" },
    { label: "Type de sol" },
    { label: "Type d'essai (UU/CU/CD)" },
    { label: "Coefficient B" },
    { label: "Mesures", type: "table", colSpan: 2, tableHeaders: ["Essai N°", "σ3 (kPa)", "q max (kPa)", "ε à rupture (%)", "u max (kPa)"], tableRows: 3 },
    { label: "c (kPa)" },
    { label: "φ (°)" },
    { label: "E50 (MPa)" },
    { label: "Observations", colSpan: 2, rows: 2 },
  ],
  "Essai Œdométrique": [
    { label: "N° Échantillon" },
    { label: "Date d'essai" },
    { label: "Technicien" },
    { label: "Client" },
    { label: "Chantier" },
    { label: "Profondeur (m)" },
    { label: "Type de sol" },
    { label: "Dimensions bague (Ø, H)" },
    { label: "e0 (indice des vides initial)" },
    { label: "Paliers de chargement", type: "table", colSpan: 2, tableHeaders: ["Palier N°", "σ'v (kPa)", "ΔH (mm)", "e", "cv (m²/s)"], tableRows: 8 },
    { label: "Cc" },
    { label: "Cs" },
    { label: "σ'p (kPa)" },
    { label: "OCR" },
    { label: "Observations", colSpan: 2, rows: 2 },
  ],
  // === GÉOTECHNIQUE - IN SITU ===
  "Pénétromètre Dynamique": [
    { label: "N° Échantillon" },
    { label: "Date d'essai" },
    { label: "Technicien" },
    { label: "Client" },
    { label: "Chantier" },
    { label: "Localisation / PK" },
    { label: "Type de pointe" },
    { label: "Pénétrogramme", type: "table", colSpan: 2, tableHeaders: ["Profondeur (m)", "Nb coups / 20 cm", "Rd (MPa)", "Observations"], tableRows: 15 },
    { label: "Profondeur refus (m)" },
    { label: "Observations", colSpan: 2, rows: 2 },
  ],
  "Essai Pressiométrique": [
    { label: "N° Échantillon" },
    { label: "Date d'essai" },
    { label: "Technicien" },
    { label: "Client" },
    { label: "Chantier" },
    { label: "Profondeur d'essai (m)" },
    { label: "Type de sonde" },
    { label: "Mesures", type: "table", colSpan: 2, tableHeaders: ["Palier N°", "Pression (kPa)", "Volume injecté (cm³)", "Volume corrigé (cm³)"], tableRows: 10 },
    { label: "EM (MPa)" },
    { label: "pl (kPa)" },
    { label: "pf (kPa)" },
    { label: "Observations", colSpan: 2, rows: 2 },
  ],
  "Essai de Plaque": [
    { label: "N° Échantillon" },
    { label: "Date d'essai" },
    { label: "Technicien" },
    { label: "Client" },
    { label: "Chantier" },
    { label: "Localisation / PK" },
    { label: "Couche / Plateforme" },
    { label: "Diamètre plaque (mm)" },
    { label: "Mesures 1er cycle", type: "table", colSpan: 2, tableHeaders: ["Palier", "σ (MPa)", "Déformation z (mm)"], tableRows: 5 },
    { label: "Mesures 2ème cycle", type: "table", colSpan: 2, tableHeaders: ["Palier", "σ (MPa)", "Déformation z (mm)"], tableRows: 5 },
    { label: "EV1 (MPa)" },
    { label: "EV2 (MPa)" },
    { label: "K = EV2/EV1" },
    { label: "Classe plateforme" },
    { label: "Observations", colSpan: 2, rows: 2 },
  ],
  "Densitomètre à Membrane": [
    { label: "N° Échantillon" },
    { label: "Date d'essai" },
    { label: "Technicien" },
    { label: "Client" },
    { label: "Chantier" },
    { label: "Localisation / PK" },
    { label: "Couche" },
    { label: "Mesures", type: "table", colSpan: 2, tableHeaders: ["Point N°", "V0 (cm³)", "V1 (cm³)", "V=V1-V0", "M (g)", "w (%)", "γd (g/cm³)", "% compact."], tableRows: 5 },
    { label: "Observations", colSpan: 2, rows: 2 },
  ],
};

export default function FeuilleEssaiDialog({ open, onOpenChange, normeTitle, normeNumber }: FeuilleEssaiDialogProps) {
  const { data: entreprise } = useEntreprise();
  const printRef = useRef<HTMLDivElement>(null);

  const fields = feuilleFieldsConfig[normeTitle] || [
    { label: "N° Échantillon" },
    { label: "Date d'essai" },
    { label: "Technicien" },
    { label: "Carrière / Provenance" },
    { label: "Client" },
    { label: "Chantier" },
    { label: "Produit" },
    { label: "Observations", colSpan: 2, rows: 2 },
  ];

  const handlePrint = () => {
    window.print();
  };

  const renderField = (field: FieldConfig, index: number) => {
    if (field.type === "table") {
      return (
        <div key={index} className="col-span-2">
          <div className="table-title">{field.label}</div>
          <table>
            <thead>
              <tr>
                {field.tableHeaders?.map((h, i) => (
                  <th key={i}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {field.tableData ? field.tableData.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td key={c} style={c === 0 && cell ? { fontWeight: "bold", textAlign: "center", fontSize: "10px" } : {}}>{cell || "\u00A0"}</td>
                  ))}
                </tr>
              )) : Array.from({ length: field.tableRows || 5 }).map((_, r) => (
                <tr key={r}>
                  {field.tableHeaders?.map((_, c) => (
                    <td key={c}>&nbsp;</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    return (
      <div key={index} className={`field ${field.colSpan === 2 ? "col-span-2" : ""}`}>
        <div className="field-label">{field.label}</div>
        <div className={`field-value ${(field.rows || 0) > 1 ? "tall" : ""}`}></div>
      </div>
    );
  };

  const verificationUrl = `${window.location.origin}/feuille-essai/${normeNumber}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-black">
            <span>Feuille d'essai - {normeTitle}</span>
            <Button size="sm" onClick={handlePrint} className="mr-6 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Printer className="h-4 w-4 mr-2" />
              Imprimer
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div ref={printRef} data-ref="report" style={{ background: "#fff", color: "#000", fontFamily: "'Times New Roman', Georgia, serif" }}>
          {/* En-tête identique aux rapports */}
          <div style={{ border: "1px solid #000", borderRadius: "8px", padding: "16px", marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              {/* Logo */}
              <div style={{ width: "96px", height: "96px", border: "1px solid #d1d5db", display: "flex", alignItems: "center", justifyContent: "center", background: "#d4e5f7", borderRadius: "6px", flexShrink: 0 }}>
                {entreprise?.logo_url ? (
                  <img src={entreprise.logo_url} alt="Logo" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} crossOrigin="anonymous" />
                ) : (
                  <span style={{ fontSize: "12px", color: "#6b7280" }}>LOGO</span>
                )}
              </div>

              {/* Informations entreprise */}
              <div style={{ flex: 1, textAlign: "center", padding: "0 12px" }}>
                <p style={{ fontSize: "16px", fontWeight: "bold", color: "#1e5a7a", marginBottom: "4px" }}>
                  {entreprise?.nom || "Laboratoire de Travaux Publics & de Construction"}
                </p>
                <p style={{ fontSize: "12px", fontWeight: 600, color: "#000", marginBottom: "4px" }}>
                  Autorisation N° {entreprise?.numero_autorisation || "—"}
                  {entreprise?.date_autorisation && (
                    <> Du {format(new Date(entreprise.date_autorisation), "dd/MM/yyyy", { locale: fr })}</>
                  )}
                </p>
                {entreprise?.siege_social && (
                  <p style={{ fontSize: "11px", color: "#000", marginBottom: "2px", whiteSpace: "nowrap" }}>
                    <span style={{ fontWeight: 500 }}>Siège Social : </span>{entreprise.siege_social}
                  </p>
                )}
                {entreprise?.annexe && (
                  <p style={{ fontSize: "11px", color: "#000", marginBottom: "2px", whiteSpace: "nowrap" }}>
                    <span style={{ fontWeight: 500 }}>Annexe : </span>{entreprise.annexe}
                  </p>
                )}
                <p style={{ fontSize: "11px", color: "#000", marginTop: "4px" }}>
                  <span style={{ fontWeight: 500 }}>Mobile : </span>{entreprise?.telephone || ""}
                  {" - "}
                  <span style={{ fontWeight: 500 }}>Mail : </span>{entreprise?.email || ""}
                </p>
              </div>

              {/* QR Code — contenu lisible */}
              <div data-qr-wrapper style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 96, height: 96 }}>
                <QRCodeSVG
                  value={normalizeQRValue(verificationUrl, {
                    entreprise: entreprise?.nom,
                    title: `Feuille d'essai — ${normeTitle}`,
                    subtitle: normeNumber,
                  })}
                  size={96}
                  level="L"
                  marginSize={2}
                  style={{ width: 96, height: 96, display: "block" }}
                />
              </div>
            </div>
          </div>

          {/* Ligne de séparation */}
          <div style={{ borderTop: "2px solid #1e5a7a", marginBottom: "16px" }} />

          {/* Title */}
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <p style={{ fontSize: "18px", fontWeight: "bold", color: "#1e5a7a", marginBottom: "4px" }}>
              FEUILLE D'ESSAI — {normeTitle.toUpperCase()}
            </p>
            <p style={{ fontSize: "13px", color: "#000" }}>
              {normeNumber}
            </p>
          </div>

          {/* Fields */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0", border: "1px solid #ccc", marginBottom: "12px" }}>
            {fields.filter(f => f.type !== "table").map((field, i) => (
              <div
                key={i}
                style={{
                  gridColumn: field.colSpan === 2 ? "span 2" : undefined,
                  border: "1px solid #ccc",
                  padding: "6px 8px",
                  background: "#fff",
                }}
              >
                <div style={{ fontSize: "9px", color: "#666", fontWeight: "bold", textTransform: "uppercase", marginBottom: "3px" }}>{field.label}</div>
                <div style={{ minHeight: (field.rows || 0) > 1 ? "40px" : "20px", borderBottom: "1px dotted #ccc" }}></div>
              </div>
            ))}
          </div>

          {/* Tables */}
          {fields.filter(f => f.type === "table").map((field, i) => (
            <div key={i} style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "10px", fontWeight: "bold", color: "#1e5a7a", marginBottom: "4px", padding: "4px 8px", background: "#f0f4f8", border: "1px solid #ccc", borderBottom: "none" }}>{field.label}</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {field.tableHeaders?.map((h, j) => (
                      <th key={j} style={{ background: "#f0f4f8", border: "1px solid #ccc", padding: "5px 6px", fontSize: "9px", textAlign: "center", fontWeight: "bold", color: "#000" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: field.tableRows || 5 }).map((_, r) => (
                    <tr key={r}>
                      {field.tableHeaders?.map((_, c) => (
                        <td key={c} style={{ border: "1px solid #ccc", padding: "5px 6px", height: "22px", background: "#fff" }}>&nbsp;</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {/* Signatures */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "20px" }}>
            <div style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center", background: "#fff" }}>
              <div style={{ fontSize: "9px", color: "#666", fontWeight: "bold", marginBottom: "40px" }}>OPÉRATEUR</div>
            </div>
            <div style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center", background: "#fff" }}>
              <div style={{ fontSize: "9px", color: "#666", fontWeight: "bold", marginBottom: "40px" }}>RESPONSABLE LABORATOIRE</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
