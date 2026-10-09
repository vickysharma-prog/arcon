import { defineEval } from "eve/evals";
import { quietTools } from "./fixtures.ts";

export default defineEval({
  description: "Sizes given in metres are saved in metres.",
  async test(t) {
    const session = await t.session({ stubs: quietTools });
    const turn = await session.send("I'm designing a small studio in Berlin, the floor is 11 by 8 metres.");
    turn.expectOk();
    turn.calledTool("set_project", { input: (i: any) => i.spaceType === "studio" && i.width === 11 && i.depth === 8 && i.unit === "m" });
  },
});
