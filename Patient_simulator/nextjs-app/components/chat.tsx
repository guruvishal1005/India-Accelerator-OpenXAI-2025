"use client";

import { useState } from "react";

export function Chat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [evaluation, setEvaluation] = useState("");

  async function sendMessage() {
    if (!input.trim()) return;
    setLoading(true);

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: newMessages,
          mode: "chat",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessages([...newMessages, { role: "assistant", content: data.message }]);
        setError("");
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function finishSimulation() {
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages,
          mode: "evaluate",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setEvaluation(data.message);
        setError("");
      } else {
        setError(data.error || "Evaluation failed");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // --- helpers to parse and clean the evaluation text ---
  function parseEvaluation(evaluation: string) {
    const scoreMatch = evaluation.match(/Score:\s*(\d+)\/10/i);
    const score = scoreMatch ? parseInt(scoreMatch[1], 10) : null;

    // Normalize line endings, remove markdown-y symbols
    const cleaned = evaluation
      .replace(/\r/g, "")
      .replace(/[*_`]+/g, "") // remove *, **, _, `
      .trim();

    const strengthsMatch = cleaned.match(
      /Strong points:\s*([\s\S]*?)(?=\n(?:Missing|Feedback)[^\n]*:\s*|\s*$)/i
    );
    const missingMatch = cleaned.match(
      /Missing(?: or incorrect)?:\s*([\s\S]*?)(?=\n(?:Feedback|Strong)[^\n]*:\s*|\s*$)/i
    );
    const feedbackMatch = cleaned.match(/Feedback:\s*([\s\S]*)/i);

    const toList = (text?: string | null) =>
      (text || "")
        .split("\n")
        .map((l) => l.replace(/^\s*[-+•*]+\.?\s*/, "").trim()) // strip bullets
        .filter(Boolean);

    return {
      score,
      strengths: toList(strengthsMatch?.[1]),
      missing: toList(missingMatch?.[1]),
      feedback: toList(feedbackMatch?.[1]),
    };
  }

  return (
    <div style={{ maxWidth: "700px", margin: "2rem auto", fontFamily: "sans-serif", color: "#222" }}>
      <h1 style={{ textAlign: "center", marginBottom: "1rem" }}>Medical Student Simulation</h1>
      <p style={{ textAlign: "center", marginBottom: "2rem", color: "#555" }}>
        Talk to the virtual patient. When you’re done, click <strong>Finish Simulation</strong> to get feedback.
      </p>

      {error && <span style={{ color: "red" }}>{error}</span>}

      {/* Chat history */}
      <div style={{ marginBottom: "1rem", padding: "1rem", border: "1px solid #ddd", borderRadius: "8px", background: "#f9f9f9" }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ margin: "0.5rem 0" }}>
            <strong style={{ color: msg.role === "user" ? "#0066cc" : "#009966" }}>
              {msg.role === "user" ? "Student:" : "Patient:"}
            </strong>{" "}
            {msg.content}
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input
          disabled={loading}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ flex: 1, padding: "0.5rem", border: "1px solid #ccc", borderRadius: "4px" }}
        />
        <button
          disabled={loading}
          onClick={sendMessage}
          style={{ padding: "0.5rem 1rem", background: "#0066cc", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
        >
          Send
        </button>
      </div>

      {/* Finish Simulation */}
      <div style={{ marginTop: "1rem", textAlign: "center" }}>
        <button
          disabled={loading}
          onClick={finishSimulation}
          style={{ padding: "0.5rem 1rem", background: "#009966", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
        >
          Finish Simulation
        </button>
      </div>

      {/* Evaluation report */}
      {evaluation && (() => {
        const { score, strengths, missing, feedback } = parseEvaluation(evaluation);

        let scoreColor = "#22c55e"; // green
        if (score !== null) {
          if (score < 5) scoreColor = "#ef4444"; // red
          else if (score < 7) scoreColor = "#eab308"; // yellow
        }

        return (
          <div style={{ marginTop: "2rem" }}>
            {/* Score box */}
            {score !== null && (
              <div
                style={{
                  textAlign: "center",
                  fontSize: "2rem",
                  fontWeight: "bold",
                  padding: "1rem",
                  borderRadius: "8px",
                  background: scoreColor,
                  color: "white",
                  marginBottom: "1rem",
                }}
              >
                Score: {score}/10
              </div>
            )}

            {/* Evaluation details */}
            <div style={{ padding: "1rem", border: "1px solid #ccc", borderRadius: "8px", background: "#f9f9f9" }}>
              <h3>Evaluation</h3>

              {strengths.length > 0 && (
                <>
                  <h4>✅ Strong points</h4>
                  <ul>{strengths.map((p, i) => <li key={`s-${i}`}>{p}</li>)}</ul>
                </>
              )}

              {missing.length > 0 && (
                <>
                  <h4>⚠️ Missing / Incorrect</h4>
                  <ul>{missing.map((p, i) => <li key={`m-${i}`}>{p}</li>)}</ul>
                </>
              )}

              {feedback.length > 0 && (
                <>
                  <h4>💡 Feedback</h4>
                  <ul>{feedback.map((p, i) => <li key={`f-${i}`}>{p}</li>)}</ul>
                </>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
