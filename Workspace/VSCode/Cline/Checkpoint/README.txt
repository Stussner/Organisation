Cline Checkpoint Folder

Dieser Ordner wurde als lokaler Checkpoint-Speicher für Cline angelegt.
Wenn Cline Checkpoints verwendet, sollte es diesen Ordner nutzen, sofern das Workspace geöffnet ist.

Empfehlung:
- Öffne dein Workspace (OrganizationBase.code-workspace) in VS Code.
- Reload Window (Strg+Shift+P → Developer: Reload Window).
- In Cline Settings "Enable Checkpoints" an/aus schalten, damit die Extension den Workspace-Pfad übernimmt.
- Prüfe Output → Cline, um zu sehen, welcher Checkpoint-Pfad aktiv ist.

Hinweis: Wenn Cline kein explizites Pfad-Feld zur Verfügung stellt, nutzt es in der Regel das aktive Workspace-Root; daher ist das Workspace zu öffnen, bevor Checkpoints aktiviert werden.
