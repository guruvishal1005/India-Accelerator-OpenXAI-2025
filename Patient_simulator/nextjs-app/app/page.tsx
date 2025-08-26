import { Chat } from "@/components/chat";

export default function HomePage() {
  return (
    <div>
      <h2>Medical Student Simulation</h2>
      <p>
        Talk to the virtual patient. When you’re done, click{" "}
        <strong>Finish Simulation</strong> to get feedback.
      </p>
      <Chat />
    </div>
  );
}
