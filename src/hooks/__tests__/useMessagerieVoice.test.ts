import { describe, expect, it } from "vitest";
import {
  MAX_AUDIO_SECONDS,
  audioExtension,
  buildAudioPath,
  formatDuration,
  isAllowedAudioMime,
  pickAudioMimeType,
  validateAudioUpload,
} from "@/lib/messagerie/audio";

const CONV = "11111111-1111-1111-1111-111111111111";

describe("messagerie — vocal", () => {
  it("choisit le format compatible avec le navigateur", () => {
    expect(pickAudioMimeType(() => true)).toBe("audio/webm;codecs=opus");
    expect(pickAudioMimeType((t) => t === "audio/mp4")).toBe("audio/mp4");
    expect(pickAudioMimeType(() => false)).toBeNull();
  });

  it("refuse un type MIME invalide", () => {
    expect(isAllowedAudioMime("audio/webm;codecs=opus")).toBe(true);
    expect(isAllowedAudioMime("video/mp4")).toBe(false);
    expect(validateAudioUpload({ mime: "application/pdf", size: 100, duration: 5 }))
      .toBe("Format audio non supporté.");
  });

  it("refuse un vocal vide, trop long ou trop lourd", () => {
    expect(validateAudioUpload({ mime: "audio/webm", size: 0, duration: 5 })).toBe("Enregistrement vide.");
    expect(validateAudioUpload({ mime: "audio/webm", size: 10, duration: 0 })).toBe("Enregistrement trop court.");
    expect(validateAudioUpload({ mime: "audio/webm", size: 10, duration: MAX_AUDIO_SECONDS + 1 }))
      .toBe("Durée maximale atteinte.");
    expect(validateAudioUpload({ mime: "audio/webm", size: 50 * 1024 * 1024, duration: 5 }))
      .toBe("Fichier audio trop volumineux.");
  });

  it("accepte un vocal valide", () => {
    expect(validateAudioUpload({ mime: "audio/webm;codecs=opus", size: 20_000, duration: 8 })).toBeNull();
  });

  it("construit un chemin Storage préfixé par la conversation", () => {
    const path = buildAudioPath(CONV, "abc", "audio/webm;codecs=opus");
    expect(path).toBe(`${CONV}/abc.webm`);
    expect(path.split("/")[0]).toBe(CONV);
    expect(audioExtension("audio/mp4")).toBe("m4a");
    expect(audioExtension("audio/ogg")).toBe("ogg");
  });

  it("formate la durée", () => {
    expect(formatDuration(7)).toBe("00:07");
    expect(formatDuration(75)).toBe("01:15");
  });
});
