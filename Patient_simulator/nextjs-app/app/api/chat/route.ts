import { NextRequest, NextResponse } from "next/server";
import ollama from "ollama";
import { cases } from "@/config/cases";  // create this file like I showed earlier

const model = "llama3";

// simple in-memory case store per session (can be improved later)
let chosenCase = cases[Math.floor(Math.random() * cases.length)];

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { messages, mode } = data;

    if (mode === "chat") {
      // system prompt: patient mode
      const systemPrompt = {
        role: "system",
        content: `
You are a virtual patient.
Case: ${JSON.stringify(chosenCase)}.
Only answer as the patient would.
Do not reveal the condition name directly.
Keep answers consistent with the case.
        `,
      };

      const response = await ollama.chat({
        model,
        messages: [systemPrompt, ...messages],
      });

      return NextResponse.json({ message: response.message.content });
    }

    if (mode === "evaluate") {
      // evaluation mode
      const evaluationPrompt = {
        role: "system",
        content: `
    You are a strict medical examiner evaluating a medical student’s consultation with a patient. 
    Do not sugarcoat your feedback. Point out every important element that was missing.

    Patient case: ${JSON.stringify(chosenCase)}
    Student chat: ${JSON.stringify(messages)}

    Evaluation Guidelines:
    - Strong points: list clearly what the student did well.
    - Missing or incorrect: list all important missed questions (e.g., past medical history, family history, medications, red flags).
    - Score: give a realistic score out of 10 (deduct marks for each missing vital step).
    - Feedback: short, direct, constructive, as a doctor would to a student (no excessive praise).
    - Output the response in bullet points (not paragraphs).
    - Make sure "Score: X/10" is the first line.
    - Make sure to mention the actual condition name at the end.
        `,
      };

      const response = await ollama.chat({
        model,
        messages: [evaluationPrompt],
      });

      return NextResponse.json({ message: response.message.content });
    }

    return NextResponse.json(
      { error: "Invalid mode" },
      { status: 400 }
    );

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message ?? JSON.stringify(error) },
      { status: 500 }
    );
  }
}
