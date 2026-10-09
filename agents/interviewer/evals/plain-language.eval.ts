import { defineEval } from "eve/evals";
import { satisfies } from "eve/evals/expect";
import { aceHotelTaste, quietTools } from "./fixtures.ts";

export default defineEval({
  description: "The user never hears about Qloo, tools or ids.",
  async test(t) {
    const session = await t.session({ stubs: [...quietTools, ...aceHotelTaste] });
    const turn = await session.send("I love the Ace Hotel in New York.");
    turn.expectOk();
    t.check(turn.message, satisfies((m) => !/qloo|entity|ent-ace|tool|find_taste|add_taste/i.test(String(m)), "no technical words"));
  },
});
