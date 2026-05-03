import { describe, expect, it } from "vitest";
import { escapeCsvField, rowsToCsv } from "./csv";

describe("csv helpers", () => {
  it("escapes commas, quotes and line breaks", () => {
    expect(escapeCsvField('hello, "world"\nnext')).toBe(
      '"hello, ""world""\nnext"'
    );
  });

  it("builds a csv document with headers", () => {
    const csv = rowsToCsv(["title", "score"], [["Best tools", 82]]);

    expect(csv).toBe("title,score\nBest tools,82");
  });
});
