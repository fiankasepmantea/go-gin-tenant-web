import { describe, expect, it } from "vitest";
import { messages } from "./messages";

const placeholders = (s: string) =>
  [...s.matchAll(/\{(\w+)\}/g)]
    .map((m) => m[1])
    .sort()
    .join(",");

describe("messages", () => {
  const keys = Object.keys(messages.id) as (keyof typeof messages.id)[];

  it("has the same keys in Indonesian and English", () => {
    expect(Object.keys(messages.en).sort()).toEqual([...keys].sort());
  });

  it("uses the same {placeholders} in both languages", () => {
    for (const k of keys) expect(placeholders(messages.en[k]), k).toBe(placeholders(messages.id[k]));
  });

  it("has no empty text", () => {
    for (const k of keys) {
      expect(messages.id[k].trim(), `id ${k}`).not.toBe("");
      expect(messages.en[k].trim(), `en ${k}`).not.toBe("");
    }
  });
});
