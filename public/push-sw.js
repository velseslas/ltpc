/* LOT 14.2 — Handlers Push du Service Worker LTPC.
 *
 * Ce fichier est injecté dans le Service Worker généré par vite-plugin-pwa
 * via `workbox.importScripts`. Il n'ajoute QUE les handlers `push` et
 * `notificationclick` : aucune stratégie de cache, d'installation ou de mise à
 * jour n'est modifiée.
 */

/* eslint-disable no-undef */

var LTPC_ICON = "/icon-192.png";
var LTPC_BADGE = "/icon-96.png";

/** N'accepte qu'une cible interne LTPC (chemin relatif). Jamais d'URL externe. */
function ltpcSafePath(raw) {
  if (typeof raw !== "string" || raw.length === 0) return "/notifications";
  // Refus explicite de toute URL absolue / protocole / protocol-relative.
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw)) return "/notifications";
  if (raw.indexOf("//") === 0) return "/notifications";
  if (raw.charAt(0) !== "/") return "/notifications";
  if (raw.indexOf("..") !== -1) return "/notifications";
  return raw;
}

self.addEventListener("push", function (event) {
  var payload = {};
  if (event.data) {
    try {
      payload = event.data.json() || {};
    } catch (e) {
      try {
        payload = { title: "LTPC", body: event.data.text() };
      } catch (e2) {
        payload = {};
      }
    }
  }

  var title = typeof payload.title === "string" && payload.title ? payload.title : "LTPC";
  var body = typeof payload.body === "string" ? payload.body : "";
  var targetUrl = ltpcSafePath(payload.target_url);

  var options = {
    body: body,
    icon: typeof payload.icon === "string" && payload.icon.charAt(0) === "/" ? payload.icon : LTPC_ICON,
    badge: typeof payload.badge === "string" && payload.badge.charAt(0) === "/" ? payload.badge : LTPC_BADGE,
    tag: typeof payload.notification_id === "string" ? payload.notification_id : undefined,
    renotify: typeof payload.notification_id === "string",
    data: {
      target_url: targetUrl,
      notification_id: payload.notification_id || null,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  var data = event.notification.data || {};
  var path = ltpcSafePath(data.target_url);
  var absolute = new URL(path, self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (clientList) {
        for (var i = 0; i < clientList.length; i++) {
          var client = clientList[i];
          // Réutilise une fenêtre LTPC déjà ouverte (même origine).
          if (client.url.indexOf(self.location.origin) === 0) {
            if ("navigate" in client) {
              return client.navigate(absolute).then(function (c) {
                return c && c.focus ? c.focus() : undefined;
              });
            }
            return client.focus();
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(absolute);
        return undefined;
      })
      .catch(function () {
        if (self.clients.openWindow) return self.clients.openWindow(absolute);
        return undefined;
      })
  );
});
