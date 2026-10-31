import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AskPage from "./AskPage";

const fetchMock = vi.fn();

function sseResponse(...events: Array<[string, unknown]>) {
  const content = events
    .map(([name, data]) => `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`)
    .join("");
  return new Response(content, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

function card(overrides: Record<string, unknown> = {}) {
  return {
    ref: "abudawud:407",
    kind: "hadith",
    collection: "Sunan Abi Dawud",
    arabic: "النص العربي",
    english: "The English translation.",
    narrator: "Abu Hurairah",
    grade: null,
    graded_by: null,
    grades: [{ name: "Al-Albani", grade: "Mawdu" }, { name: "Another grader", grade: "Daif" }],
    url: "https://sunnah.com/abudawud:407",
    ...overrides,
  };
}

async function ask() {
  fireEvent.change(screen.getByLabelText("Your question"), {
    target: { value: "What do the sources say?" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Ask" }));
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ask page", () => {
  it("renders cards after the answer with Arabic, translation and separate grades", async () => {
    fetchMock.mockResolvedValue(sseResponse(
      ["token", "The source says this. "] as [string, unknown],
      ["card", card()],
      ["done", {}],
    ));
    render(<AskPage />);

    await ask();

    expect(await screen.findByText("The source says this.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "abudawud:407" })).toHaveAttribute(
      "href",
      "https://sunnah.com/abudawud:407",
    );
    expect(screen.getByText("النص العربي")).toHaveAttribute("dir", "rtl");
    expect(screen.getByText("Translation (may differ from the Arabic)")).toBeInTheDocument();
    expect(screen.getByText("The English translation.")).toBeInTheDocument();
    expect(screen.getByText("Mawdu — graded by Al-Albani")).toBeInTheDocument();
    expect(screen.getByText("Daif — graded by Another grader")).toBeInTheDocument();
    expect(screen.getByText("Found, but graded weak or fabricated. Do not rely on it")).toBeInTheDocument();
  });

  it("shows the no-grade message when grade fields are null", async () => {
    fetchMock.mockResolvedValue(sseResponse(
      ["token", "A source summary."] as [string, unknown],
      ["card", card({ grade: null, graded_by: null, grades: null })],
      ["done", {}],
    ));
    render(<AskPage />);

    await ask();

    expect(await screen.findByText("No grade in the source data")).toBeInTheDocument();
  });

  it("shows loading while the mocked request is pending", async () => {
    fetchMock.mockReturnValue(new Promise(() => undefined));
    render(<AskPage />);

    await ask();

    expect(screen.getByRole("status")).toHaveTextContent("Searching the sources");
  });

  it("shows a clear rate-limit message for an error event", async () => {
    fetchMock.mockResolvedValue(sseResponse(["error", { status: 429, code: 429 }]));
    render(<AskPage />);

    await ask();

    expect(await screen.findByRole("alert")).toHaveTextContent(/rate limited/i);
    expect(screen.queryByText("abudawud:407")).not.toBeInTheDocument();
  });

  it("hides a reference marker split across token events", async () => {
    fetchMock.mockResolvedValue(sseResponse(
      ["token", "The verse "] ,
      ["token", "[quran:2:"],
      ["token", "153] applies here."],
      ["card", card({
        ref: "quran:2:153",
        kind: "quran",
        collection: "Quran",
        arabic: "وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ",
        english: "Seek help through patience and prayer.",
        narrator: null,
        grades: null,
        url: null,
      })],
      ["done", {}],
    ));
    render(<AskPage />);

    await ask();

    expect(await screen.findByText("The verse applies here.")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("quran:2:153")).toBeInTheDocument());
  });

  it("reports an empty answer", async () => {
    fetchMock.mockResolvedValue(sseResponse(["done", {}]));
    render(<AskPage />);

    await ask();

    expect(await screen.findByRole("alert")).toHaveTextContent("empty answer");
  });
});
