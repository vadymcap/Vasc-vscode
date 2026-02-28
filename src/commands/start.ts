import { commands } from "vscode"
import * as vasc from "../vasc"

export function start() {
  return commands.registerCommand("vasc.start", () => {
    vasc.debug("start")
  })
}
