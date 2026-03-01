import * as os from "os"
import * as fs from "fs"
import * as path from "path"
import * as childProcess from "child_process"
import { downloadRelease } from "@terascope/fetch-github-release"
import { updatePathVariable } from "./util"

const CLI_REPOSITORY_OWNER = "vadymcap"
const CLI_REPOSITORY_NAME = "Vasc"
const CLI_RELEASES_URL = "https://github.com/vadymcap/Vasc/releases"

function hasGlobalVasc() {
  try {
    childProcess.execFileSync("vasc", ["--version"], { stdio: "ignore" })
    return true
  } catch {
    return false
  }
}

export async function install() {
  const execPath =
    path.join(os.homedir(), ".vasc", "bin", "vasc") +
    (os.platform() === "win32" ? ".exe" : "")

  let versionIndex = 0

  fs.mkdirSync(path.dirname(execPath), { recursive: true })

  try {
    await downloadRelease(
      CLI_REPOSITORY_OWNER,
      CLI_REPOSITORY_NAME,
      path.dirname(execPath),
      undefined,
      (asset) => {
        if (versionIndex > 1) {
          throw new Error(
            `Your OS or CPU architecture is not yet supported by Vasc! (${os.platform()} ${os.arch()})`,
          )
        }

        if (asset.name.endsWith("linux-x86_64.zip")) {
          versionIndex++
        }

        const platform = os
          .platform()
          .replace("darwin", "macos")
          .replace("win32", "windows")

        const arch =
          os.platform() === "win32"
            ? "x86_64"
            : os.arch().replace("x64", "x86_64").replace("arm64", "aarch64")

        return asset.name.includes(platform) && asset.name.includes(arch)
      },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes("404")) {
      if (hasGlobalVasc()) {
        return
      }

      throw new Error(
        `No downloadable CLI releases were found in ${CLI_REPOSITORY_OWNER}/${CLI_REPOSITORY_NAME}. Publish platform binaries to ${CLI_RELEASES_URL}, or install Vasc manually and ensure 'vasc --version' works in PATH.`,
      )
    }

    throw err
  }

  // Trigger Vasc installer
  childProcess.execFileSync(execPath, ["--version"])

  updatePathVariable()
}
