import { commands } from "vscode"
import { run } from "../menu/exec"

export function exec() {
  return commands.registerCommand("vasc.exec", () => {
    run()
  })
}
