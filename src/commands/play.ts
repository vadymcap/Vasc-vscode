import { commands } from "vscode"
import * as vasc from "../vasc"

export function play() {
  return commands.registerCommand("vasc.play", () => {
    vasc.debug("play")
  })
}
