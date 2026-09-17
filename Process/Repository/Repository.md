# OAHSI Project Repository

**Scope:** development project  
**Intended system:** Git  
**Purpose:** traceable changes, verifiable project states, and reproducible releases

This file is the sole authoritative definition of repository management. A repository is set up only through a separate request.

## Content to Version

The following is generally versioned:

- prerequisite files and permitted bundled definitions under `Dependency/`, excluding external libraries, DLLs, models, and extensions,
- Visual Studio project definitions under `Environment/VisualStudio/`,
- persistent, non-excluded content under `Source/`,
- `Documentation/`, and
- binding files under `Organization/`.

`Organization/Agent/Agent.md` and associated operating modes are versioned, but remain read-only and may be changed only with the user's explicit consent.

## Controlled Data

Small, persistently required data under `Source/Data/Reference/`, `Source/Data/Calibration/`, or `Source/Data/Validation/` may be versioned depending on usage rights and size.

Large audio, video, model, and comparable binary data is managed outside Git and GitHub. Git may contain directory structure, descriptions, metadata, checksums, and unique dataset identifiers.

## External Library and Binary File

External headers, static libraries, import libraries, DLLs, models, and extensions under `Dependency/` are not versioned.

Their prerequisite, source, version, checksum, license, and installation procedure are documented instead.

## Content Not to Version

Exclude at least:

- `Environment/Python/`,
- `Environment/Definition.md`, because the file contains local absolute paths,
- `Environment/VisualStudio/Temporary/`,
- `Source/Data/Development/`,
- `.codex_tmp/`,
- `Dependency/Library/`,
- `Dependency/Model/`,
- `Dependency/Extension/`,
- user-specific Visual Studio files,
- credentials, API keys, passwords, and other secrets,
- `Program/` and `Data/` areas of active ManagementEnvironments, and
- local backup archives.

Released binary states may be archived separately as release artifacts. Excluding `Source/Data/Development/` means Git does not protect this data; the separate data backup under [Backup.md](./Backup.md) applies instead.

## Repository Setup

Before initial setup, a backup of the initial state verified according to [Backup.md](./Backup.md) must be available.

Before regular use, create and verify at least:

- `.gitignore` for local and generated files, and
- `.gitattributes` for consistent text files and, where applicable, Git LFS assignments.

Check exclusion rules before initially adding large files, binary files, or local environments.

## Change and Commit

- A commit contains one coherent, traceable change.
- The commit message briefly describes purpose and effect.
- Run affected builds or tests before an important commit.
- Do not overwrite external or existing changes without verification.
- Do not add secret or clearly temporary files.

Use separate working branches for larger work. The main branch contains only traceable and fundamentally runnable states.

## Release

A release receives a unique version number and Git tag. It refers at minimum to source state, build configuration, target platform, prerequisite and dependency state, authoritative test results, and, where applicable, related release artifacts.

## Verification

Before push, merge, or release, verify:

- no credentials are included,
- no local Python environment or local environment definition is included,
- no temporary Visual Studio files are included,
- no content from `Source/Data/Development/` is included,
- external binary files are permitted by license,
- large files are handled deliberately, and
- protected Agent files have not been changed unintentionally.

## Scope Boundary

Repository management replaces neither a local backup nor backup of production or excluded data. [Backup.md](./Backup.md) applies exclusively for that purpose.
