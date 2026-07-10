import { lazy } from "react";
import { Route } from "react-router-dom";

const RH = lazy(() => import("@/pages/RH"));
const Postes = lazy(() => import("@/pages/rh/Postes"));
const PosteForm = lazy(() => import("@/pages/rh/PosteForm"));
const Employes = lazy(() => import("@/pages/rh/Employes"));
const EmployeForm = lazy(() => import("@/pages/rh/EmployeForm"));
const EmployeDetail = lazy(() => import("@/pages/rh/EmployeDetail"));
const Affectations = lazy(() => import("@/pages/rh/Affectations"));
const AffectationForm = lazy(() => import("@/pages/rh/AffectationForm"));
const TechnicienDetail = lazy(() => import("@/pages/rh/TechnicienDetail"));
const Documents = lazy(() => import("@/pages/rh/Documents"));

/** Routes RH (postes, employés, affectations, techniciens, documents RH). */
export const rhRoutes = (
  <>
    <Route path="/rh" element={<RH />} />
    <Route path="/rh/postes" element={<Postes />} />
    <Route path="/rh/postes/nouveau" element={<PosteForm />} />
    <Route path="/rh/postes/:id/modifier" element={<PosteForm />} />
    <Route path="/rh/employes" element={<Employes />} />
    <Route path="/rh/employes/nouveau" element={<EmployeForm />} />
    <Route path="/rh/employes/:id" element={<EmployeDetail />} />
    <Route path="/rh/employes/:id/modifier" element={<EmployeForm />} />
    <Route path="/rh/affectations" element={<Affectations />} />
    <Route path="/rh/affectations/nouveau" element={<AffectationForm />} />
    <Route path="/rh/affectations/:id/modifier" element={<AffectationForm />} />
    <Route path="/rh/techniciens/:id" element={<TechnicienDetail />} />
    <Route path="/rh/documents" element={<Documents />} />
  </>
);
