import fs from "node:fs";
import { fileURLToPath } from "node:url";

const instructions = fs.readFileSync(fileURLToPath(new URL("../AGENTS.md", import.meta.url)), "utf8");

export default function learningMode(pi) {
  pi.on("before_agent_start", async (event) => ({
    systemPrompt: event?.systemPrompt ? `${event.systemPrompt}\n\n${instructions}` : instructions,
  }));
}
