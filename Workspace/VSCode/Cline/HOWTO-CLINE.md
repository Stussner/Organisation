Kurzanleitung: Cline in VS Code — minimal, sicher, kostensparend

1) Erweiterung installieren
- VS Code öffnen → Extensions → nach "Cline" suchen → Installieren.

2) API‑Key / lokales Modell konfigurieren
- Lege deine API‑Keys lokal ab (z. B. in einer .env, aber niemals öffentlich commiten).
- Beispiel: setze OPENROUTER_API_KEY in deiner Umgebungsvariablen oder nutze eine lokale Modell‑URL (Ollama).
- Siehe provider.env.example in diesem Ordner.

3) cline.config.json anpassen
- Öffne Cline\cline.config.json und setze provider, model und apiKeyEnvVar entsprechend.
- Für lokale Modelle setze localEndpoint.

4) VS Code Trust & Workspace
- Öffne das gespeicherte .code-workspace (nicht das übergeordnete Laufwerk).
- Wenn VS Code nach Trust fragt: "Trust" (nur für bekannte/vertrauenswürdige Repos).
- Kopiere bei Bedarf den Inhalt von vs-settings.json in deine Workspace‑Settings oder .vscode/settings.json.

5) Minimaler, strikter Workflow (unbedingt einhalten)
- Aufgabe: 1 klar definierter Arbeitsschritt (keine Off‑scope Aufgaben)
- Kontext: maximal die betroffenen Dateien (kein gesamter Verlauf)
- Änderung: konkrete Datei/Zeile oder diff‑Patch
- Test: genau ein Testbefehl oder kurzer Verifikationstext
- Stop: nach positiver Verifikation sofort beenden

6) Testlauf (erste sichere Aktion)
- Beispiel: Kleine Leseprüfung
  - Prompt: "Öffne Datei src/foo.js, liefere mir nur die Zeilen 1-40 mit relevanten TODOs. Keine Änderungen." (verwende Prompt‑Template)
- Wenn Output ok: nächster Schritt, sonst Task verkleinern

7) Sicherheit & Kosten
- Begrenze Kontextlänge und Anzahl der Aufrufe (siehe cline.config.json safety)
- Keine langen automatische Durchläufe oder Endlosschleifen
- Behalte API‑Verbrauch im Blick (Provider Dashboard)

8) Supportdateien in diesem Ordner
- cline.config.json — Grundkonfiguration
- provider.env.example — Beispiel Umgebungsvariablen
- prompt-template.txt — striktes Prompt‑Template
- verification-rules.md — kurze Regeln für Verifikation
- vs-settings.json — VS Code Settings zum Kopieren

Wenn du willst, setze ich jetzt die Umgebungsvariablen im Terminal oder helfe beim ersten Test‑Prompt.