import * as vscode from "vscode"
import * as vasc from "../vasc"
import { Item } from "."

export const item: Item = {
  label: "$(plug) Plugin",
  description: "Install or uninstall Vasc plugin for Roblox Studio",
  action: "plugin",
}

function getMode(): Promise<vasc.PluginMode> {
  return new Promise((resolve, reject) => {
    const items: { label: string; mode: vasc.PluginMode }[] = [
      {
        label: "$(arrow-down) Install",
        mode: "install",
      },
      {
        label: "$(x) Uninstall",
        mode: "uninstall",
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
  vasc.plugin(await getMode())
}
