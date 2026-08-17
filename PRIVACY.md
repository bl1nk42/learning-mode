# Privacy Policy

Effective date: 2026-08-17

Learning Mode is local-first. It stores learning evidence only in locations the
user controls:

- the source project: `.learning-mode/insights.jsonl`;
- the user's learning workspace: `~/.learning-mode/`, unless
  `LEARNING_MODE_HOME` changes that location; and
- on-demand wiki artifacts within that learning workspace.

The plugin does not operate a service, collect telemetry, sell data, or send
project files, prompts, raw logs, or wiki content to its developer.

## On-demand artifacts

An Insight Wiki is created or refreshed only when the user requests it. Raw
insight logs are evidence for that wiki; they are not automatically published
or copied to another service.

## Optional third-party storage

Future storage integrations, including Google Drive, are optional and require
the user's explicit request for each save or sync. The intended behavior is:

- ask the user to choose the artifact and destination folder;
- send only the selected wiki artifact, not the complete local log collection;
- retain only the provider document/folder identifiers, source hash, and sync
  timestamps needed to identify a later requested update;
- never run background sync, telemetry, or automatic sharing; and
- never overwrite a remotely edited document silently.

If an integration is enabled, the connected provider and coding-agent host
process data under their own terms and privacy policies. Review those policies
and the permissions shown by the host before authorizing access.

## Your choices

You can keep all artifacts local, choose a different learning-workspace path,
or delete local artifacts you no longer want. Disabling Learning Mode stops
new insight capture; it does not delete existing files.
