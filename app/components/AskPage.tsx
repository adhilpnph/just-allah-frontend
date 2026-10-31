"use client";

import { FormEvent, useState } from "react";
import PassageCard, { Passage } from "./PassageCard";

type AskFailure = { status?: number; code?: string };
type AskState = "idle" | "loading" | "answer" | "error";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export function visibleAnswer(raw: string) {
  return raw
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\[[\w:.-]*$/u, "")
    .replace(/[ \t]{2,}/g, " ");
}

function failureMessage(failure: AskFailure) {
  if (failure.status === 429 || failure.code === 429) {
    return "The service is rate limited right now. Please wait a moment and try again.";
  }
  if (failure.status === 413 || failure.code === 413) {
    return "The request was too large for the source service to process.";
  }
  return "The source provider could not complete this request. Please try again later.";
}

function parseData(data: string): unknown {
  try {
    return JSON.parse(data) as unknown;
  } catch {
    return data;
  }
}

export default function AskPage() {
  const [question, setQuestion] = useState("");
  const [rawAnswer, setRawAnswer] = useState("");
  const [cards, setCards] = useState<Passage[]>([]);
  const [state, setState] = useState<AskState>("idle");
  const [error, setError] = useState("");

  async function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question.trim() || state === "loading") return;

    setRawAnswer("");
    setCards([]);
    setError("");
    setState("loading");

    try {
      const response = await fetch(`${API_BASE_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim() }),
      });

      if (!response.ok) {
        throw new Error(
          response.status === 429
            ? "The service is rate limited right now. Please wait a moment and try again."
            : response.status === 413
              ? "The request was too large for the source service to process."
              : `The source service returned an error (${response.status}). Please try again later.`,
        );
      }
      if (!response.body) throw new Error("The source service returned an empty response.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let answer = "";
      const receivedCards: Passage[] = [];
      let completed = false;

      const consumeEvent = (block: string) => {
        let eventName = "message";
        const dataLines: string[] = [];
        for (const line of block.split(/\r?\n/)) {
          if (line.startsWith("event:")) eventName = line.slice(6).trim();
          if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
        }
        if (!dataLines.length) return;

        const data = parseData(dataLines.join("\n"));
        if (eventName === "token" && typeof data === "string") {
          answer += data;
          setRawAnswer(answer);
        } else if (eventName === "card" && data && typeof data === "object") {
          receivedCards.push(data as Passage);
          setCards([...receivedCards]);
        } else if (eventName === "error") {
          const failure = data && typeof data === "object" ? (data as AskFailure) : {};
          throw new Error(failureMessage(failure));
        } else if (eventName === "done") {
          completed = true;
        }
      };

      while (!completed) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const blocks = buffer.split(/\r?\n\r?\n/);
        buffer = blocks.pop() ?? "";
        for (const block of blocks) consumeEvent(block);
        if (done) {
          if (buffer.trim()) consumeEvent(buffer);
          break;
        }
      }

      if (!answer.trim()) throw new Error("The source service returned an empty answer.");
      setState("answer");
    } catch (caught) {
      setRawAnswer("");
      setCards([]);
      setError(caught instanceof Error ? caught.message : "The request could not be completed.");
      setState("error");
    }
  }

  const answer = visibleAnswer(rawAnswer);

  return (
    <main className="ask-shell">
      <header className="site-header">
        <p className="eyebrow">Primary sources, clearly presented</p>
        <h1>Just Allah</h1>
        <p className="disclaimer">
          A source-finder and study tool, not a fatwa. Reports of the sahaba are not included yet.
          Grades come from source data and are attributed to their named graders.
        </p>
      </header>

      <section className="ask-panel" aria-labelledby="ask-heading">
        <h2 id="ask-heading">Ask about the sources</h2>
        <form onSubmit={submitQuestion}>
          <label htmlFor="question">Your question</label>
          <textarea
            id="question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="What do the sources say about patience?"
            rows={4}
            required
          />
          <button type="submit" disabled={state === "loading" || !question.trim()}>
            {state === "loading" ? "Searching sources…" : "Ask"}
          </button>
        </form>

        {state === "loading" && (
          <p role="status" className="loading-message">Searching the sources…</p>
        )}
        {state === "error" && <p role="alert" className="error-message">{error}</p>}
        {state === "answer" && (
          <section className="answer-section" aria-label="Answer">
            <h2>Source summary</h2>
            {answer ? <p className="answer-text">{answer}</p> : <p>No answer text was returned.</p>}
            {cards.length > 0 && (
              <section className="cards-section" aria-label="Cited sources">
                <h2>Cited sources</h2>
                <div className="passage-list">
                  {cards.map((passage, index) => (
                    <PassageCard key={`${passage.ref}-${index}`} passage={passage} />
                  ))}
                </div>
              </section>
            )}
          </section>
        )}
      </section>
      <footer className="site-footer">
        Read the cited Arabic alongside its English translation. Translations may differ from the
        Arabic source text.
      </footer>
    </main>
  );
}
