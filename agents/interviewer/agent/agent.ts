import { defineAgent } from "eve";
import { chatModel } from "../../../lib/models.ts";

export default defineAgent({
  model: chatModel(),
  // The interviewer only talks and calls its own tools: no shell, files, web or sandbox.
  defaultTools: false,
});
