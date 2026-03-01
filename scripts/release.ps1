[CmdletBinding()]
param(
    [string]$Version,
    [switch]$SkipConfirmation,
    [switch]$AllowDirty,
    [switch]$SkipInstall
)

$ErrorActionPreference = 'Stop'

function Require-Command {
    param([Parameter(Mandatory = $true)][string]$Name)

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command '$Name' was not found in PATH."
    }
}

function Exec {
    param(
        [Parameter(Mandatory = $true)][string]$File,
        [string[]]$Arguments = @()
    )

    & $File @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed: $File $($Arguments -join ' ')"
    }
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Push-Location $repoRoot

try {
    Require-Command -Name 'git'
    Require-Command -Name 'node'
    Require-Command -Name 'npm'
    Require-Command -Name 'gh'

    $status = git status --porcelain
    if (-not $AllowDirty -and $status) {
        Write-Host 'Working tree has uncommitted changes:' -ForegroundColor Yellow
        $status
        throw 'Working tree is not clean. Commit/stash changes first, or run with -AllowDirty (example: npm run release:ps1 -- -AllowDirty).'
    }

    $branch = (git rev-parse --abbrev-ref HEAD).Trim()
    if (-not $branch) {
        throw 'Failed to detect current git branch.'
    }

    if (-not $Version) {
        $latestTag = ''
        try {
            $latestTag = (gh release view --json tagName --jq .tagName 2>$null).Trim()
        }
        catch {
            $latestTag = ''
        }

        if ($latestTag) {
            Write-Host "Current latest release tag: $latestTag"
        }

        $Version = Read-Host 'Enter a new version/tag to release (e.g. v2.0.24)'
    }

    if (-not $Version) {
        throw 'Version/tag cannot be empty.'
    }

    $vsixName = "vasc-$Version.vsix"
    $vsixPath = Join-Path $repoRoot $vsixName

    if (-not $SkipConfirmation) {
        Write-Host ''
        Write-Host "Branch: $branch"
        Write-Host "Tag:    $Version"
        Write-Host "VSIX:   $vsixName"
        $confirm = Read-Host 'Continue with release? [y/N]'
        if ($confirm -notin @('y', 'Y', 'yes', 'YES')) {
            throw 'Aborted by user.'
        }
    }

    if (-not $SkipInstall) {
        Write-Host "Installing dependencies..."
        Exec -File 'npm' -Arguments @('ci')
    }

    Write-Host "Building extension bundle..."
    Exec -File 'npm' -Arguments @('run', 'package')

    Write-Host "Packaging VSIX: $vsixName"
    Exec -File 'npx' -Arguments @('--yes', '@vscode/vsce', 'package', '--out', $vsixName)

    Write-Host "Pushing branch '$branch'..."
    Exec -File 'git' -Arguments @('push', 'origin', $branch)

    $existingTag = git tag --list $Version
    if (-not [string]::IsNullOrWhiteSpace(($existingTag | Out-String).Trim())) {
        throw "Tag '$Version' already exists locally."
    }

    Write-Host "Creating and pushing tag '$Version'..."
    Exec -File 'git' -Arguments @('tag', $Version)
    Exec -File 'git' -Arguments @('push', 'origin', $Version)

    $releaseExists = $false
    try {
        gh release view $Version *> $null
        $releaseExists = $true
    }
    catch {
        $releaseExists = $false
    }

    if ($releaseExists) {
        Write-Host "Release '$Version' exists. Uploading asset..."
        Exec -File 'gh' -Arguments @('release', 'upload', $Version, $vsixPath, '--clobber')
    }
    else {
        Write-Host "Creating release '$Version' with asset..."
        Exec -File 'gh' -Arguments @('release', 'create', $Version, $vsixPath, '--title', $Version, '--generate-notes')
    }

    Write-Host ''
    Write-Host "Release complete: $Version"
    Write-Host "Asset uploaded: $vsixName"
}
finally {
    Pop-Location
}
