import { commands } from "vscode"
import * as vasc from "../vasc"

export function stop() {
  return commands.registerCommand("vasc.stop", () => {
    vasc.debug("stop")
  })
}
