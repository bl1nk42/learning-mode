import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const instructions = fs.readFileSync(path.join(root, "AGENTS.md"), "utf8");

export default async () => ({
  config: async (config) => {
    config.skills = config.skills || {};
    config.skills.paths = config.skills.paths || [];
    const skills = path.join(root, "skills");
    if (!config.skills.paths.includes(skills)) config.skills.paths.push(skills);
  },
  "experimental.chat.system.transform": async (_input, output) => {
    if (output.system.length) output.system[output.system.length - 1] += `\n\n${instructions}`;
    else output.system.push(instructions);
  },
});
