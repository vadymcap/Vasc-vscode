import { commands } from "vscode"
import * as vasc from "../vasc"

export function run() {
  return commands.registerCommand("vasc.run", () => {
    vasc.debug("run")
  })
}
