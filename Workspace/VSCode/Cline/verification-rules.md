Verifikationsregeln (kurz)

1) Ein Auftrag ist bestanden, wenn die angegebenen Verifikationstests exakt das erwartete Ergebnis liefern.
2) Mindestens ein reproduzierbarer Testbefehl oder drei kurze Assertions müssen grün sein.
3) Keine stillen Annahmen: wenn ein Test fehlt, gilt der Auftrag als unvollständig.
4) Bei Fehlschlag: Aufgabe stoppen, Fehler protokollieren, nächste Aktion nur nach Freigabe.
5) Änderungen müssen als Patch (diff) oder als klarer Code‑Block bereitgestellt werden.
6) Alle automatischen Iterationen sind verboten — nur ein Versuch pro freigegebenem Prompt.
