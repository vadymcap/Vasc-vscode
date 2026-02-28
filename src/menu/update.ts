import * as vscode from "vscode"
import * as vasc from "../vasc"
import { Item } from "."

export const item: Item = {
  label: "$(sync) Update",
  description: "Manually check for Vasc updates and install them",
  action: "update",
}

function getMode(): Promise<vasc.UpdateMode> {
  return new Promise((resolve, reject) => {
    const items: { label: string; mode: vasc.UpdateMode }[] = [
      {
        label: "$(check-all) All",
        mode: "all",
      },
      {
        label: "$(terminal) CLI",
        mode: "cli",
      },
      {
        label: "$(plug) Plugin",
        mode: "plugin",
      },
      {
        label: "$(folder) Templates",
        mode: "templates",
      },
    ]

    vscode.window
      .showQuickPick(items, {
        title: "Select command mode",
      })
      .then((mode) => {
        if (!mode) {
          return reject()
        }

        resolve(mode.mode)
      })
  })
}

export async function run() {
  vasc.update(await getMode())
}
