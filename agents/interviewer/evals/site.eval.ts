import { defineEval } from "eve/evals";
import { quietTools } from "./fixtures.ts";

export default defineEval({
  description: "Site details given in feet are saved through set_project.",
  async test(t) {
    const session = await t.session({ stubs: quietTools });
    const turn = await session.send("Hi! I'm building a new two-storey house in Austin, Texas. The plot is 40 by 60 feet.");
    turn.expectOk();
    turn.calledTool("set_project", {
      input: (i: any) => i.spaceType === "house" && i.width === 40 && i.depth === 60 && i.unit === "ft" && i.floors === 2 && /austin/i.test(i.location ?? ""),
    });
  },
});
