/* Maßgebliche Quelle für die vier Environment-Anzeigen: Environment.json. */
(() => {
  "use strict";
  const definitions = {
    Base: [["Project", "Projekt", data => data.project.name], ["Owner", "Besitzer", data => data.project.owner], ["Localization", "Lokalisierung", data => data.project.localization]],
    Workspace: [["WorkspacePrimary", "WorkspacePrimary", data => data.workspace.primary], ["WorkspaceSecondary", "WorkspaceSecondary", data => data.workspace.secondary]],
    BackupTarget: [["BackupTargetPrimary", "BackupTargetPrimary", data => data.backupTarget.primary], ["BackupTargetSecondary", "BackupTargetSecondary", data => data.backupTarget.secondary]],
    Access: [["OwnerOther", "OwnerOther", data => data.access.ownerOther]]
  };
  const format = value => Array.isArray(value) ? (value.length ? value.join("\n") : "—") : String(value);
  async function render() {
    const table = document.querySelector("[data-environment-document]");
    const type = table?.dataset.environmentDocument;
    if (!table || !definitions[type]) return;
    const response = await fetch(new URL("Environment.json", document.baseURI));
    if (!response.ok) throw new Error(`Environment.json konnte nicht geladen werden (${response.status}).`);
    const data = await response.json();
    const body = table.tBodies[0];
    body.replaceChildren(...definitions[type].map(([id, label, selector], index) => {
      const row = document.createElement("tr"); row.id = id;
      const number = document.createElement("td"); number.textContent = String(index + 1);
      const identifier = document.createElement("td"); const code = document.createElement("code"); code.textContent = label; identifier.append(code);
      const value = document.createElement("td"); value.className = "environment-value"; value.textContent = format(selector(data));
      row.append(number, identifier, value); return row;
    }));
    document.documentElement.dataset.environmentSource = "Environment.json";
  }
  render().catch(error => { const status = document.querySelector("[data-environment-status]"); if (status) status.textContent = `Umgebungswerte konnten nicht geladen werden: ${error.message}`; console.error("EnvironmentDefinition:", error); });
})();
