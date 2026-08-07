import { describe, expect, it } from "vitest";
import { conversationLabel, isSendableMessage, MESSAGE_MAX_LENGTH, sortConversations, type ConversationSummary } from "@/lib/messagerie/model";

const base: ConversationSummary = {
  id: "c1",
  type: "direct",
  titre: null,
  chantier_id: null,
  chantier_nom: null,
  other_user_id: "u2",
  other_user_nom: "Ahmed Ben",
  last_message_at: "2026-01-01T10:00:00Z",
  last_message_preview: "Bonjour",
  unread_count: 2,
  is_archived: false,
};

const isSendable = isSendableMessage;

describe("messagerie", () => {
  it("libellé d'une conversation directe = nom de l'interlocuteur", () => {
    expect(conversationLabel(base)).toBe("Ahmed Ben");
  });

  it("libellé d'une conversation chantier = titre puis chantier", () => {
    expect(conversationLabel({ ...base, type: "chantier", titre: "Prélèvement", chantier_nom: "RN5" }))
      .toBe("Prélèvement");
    expect(conversationLabel({ ...base, type: "chantier", titre: null, chantier_nom: "RN5" }))
      .toBe("RN5");
  });

  it("refuse les messages vides ou uniquement des espaces", () => {
    expect(isSendable("")).toBe(false);
    expect(isSendable("    \n ")).toBe(false);
    expect(isSendable("Bonjour")).toBe(true);
  });

  it("refuse les messages trop longs", () => {
    expect(isSendable("a".repeat(MESSAGE_MAX_LENGTH))).toBe(true);
    expect(isSendable("a".repeat(MESSAGE_MAX_LENGTH + 1))).toBe(false);
  });

  it("trie les conversations par dernier message décroissant", () => {
    const list: ConversationSummary[] = [
      { ...base, id: "a", last_message_at: "2026-01-01T09:00:00Z" },
      { ...base, id: "b", last_message_at: "2026-01-01T12:00:00Z" },
    ];
    const sorted = sortConversations(list);
    expect(sorted.map((c) => c.id)).toEqual(["b", "a"]);
  });
});
