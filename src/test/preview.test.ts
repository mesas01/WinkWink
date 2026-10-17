import { describe, expect, it } from "vitest";

import { adminUiVisible, inboxFor } from "@/lib/preview";

const mine = { id: "1", user_id: "me" };
const theirs = { id: "2", user_id: "other" };

describe("Employee-view preview", () => {
  it("hides administration UI only for an admin who turned the preview on", () => {
    expect(adminUiVisible(true, true)).toBe(false);
    expect(adminUiVisible(true, false)).toBe(true);
    expect(adminUiVisible(false, true)).toBe(false);
    expect(adminUiVisible(false, false)).toBe(false);
  });

  it("shows an admin only their own documents while previewing", () => {
    expect(inboxFor([mine, theirs], true, true, "me")).toEqual([mine]);
    expect(inboxFor([mine, theirs], true, false, "me")).toEqual([mine, theirs]);
    expect(inboxFor([mine, theirs], false, false, "me")).toEqual([mine, theirs]);
  });
});
