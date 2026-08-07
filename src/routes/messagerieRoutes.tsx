import { lazy } from "react";
import { Route } from "react-router-dom";

const Messagerie = lazy(() => import("@/pages/messagerie/Messagerie"));

/** Messagerie interne LTPC (conversations directes et conversations de chantier). */
export const messagerieRoutes = (
  <>
    <Route path="/messagerie" element={<Messagerie />} />
    <Route path="/messagerie/:conversationId" element={<Messagerie />} />
  </>
);
