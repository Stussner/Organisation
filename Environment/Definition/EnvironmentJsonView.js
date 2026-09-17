/* Die zugehörige JSON-Datei ist die maßgebliche Datenquelle. */
(() => {
  "use strict";
  const page = document.body, source = page.dataset.environmentSource, status = document.querySelector("[data-status]");
  const state = { data: null, handle: null, workspace: { primary: "", secondary: [] } };
  const say = text => { status.textContent = text; };
  const documentPage = () => source === "Document.json";
  async function workspace(interactive = false) { try { const r = await fetch(new URL("Workspace.json", document.baseURI)); if (!r.ok) throw new Error(); state.workspace = await r.json(); } catch { if (!interactive || !("showOpenFilePicker" in window)) return; try { const [handle] = await window.showOpenFilePicker({ multiple: false, types: [{ description: "Workspace-Daten", accept: { "application/json": [".json"] } }] }); if (handle.name === "Workspace.json") state.workspace = JSON.parse(await (await handle.getFile()).text()); else say("Für die Workspace-Auswahl bitte Workspace.json auswählen."); } catch (error) { if (error?.name !== "AbortError") say("Workspace.json konnte nicht geladen werden."); } } }
  const options = () => [["<primary>", state.workspace.primary], ...(state.workspace.secondary || []).map((path, index) => [`<secondary:${index + 1}>`, path])];
  function renderVariables() {
    document.title = state.data.title; document.querySelector("[data-title]").textContent = state.data.title; document.querySelector("[data-description]").textContent = state.data.description || "";
    const body = document.querySelector("[data-variables]"); body.replaceChildren(...state.data.variables.map((item, index) => {
      const row = document.createElement("tr"), number = document.createElement("td"), name = document.createElement("td"), value = document.createElement("td"), code = document.createElement("code");
      number.textContent = index + 1; code.textContent = item.name; name.append(code);
      const input = Array.isArray(item.value) ? document.createElement("textarea") : document.createElement("input"); input.value = Array.isArray(item.value) ? item.value.join("\n") : item.value; input.dataset.variable = item.name; input.setAttribute("aria-label", item.label || item.name); value.append(input); row.append(number, name, value); return row;
    }));
  }
  function sourceButton(value = "") { const button = document.createElement("button"); button.type = "button"; button.className = "design-source"; button.dataset.designSource = ""; button.textContent = value || "Datei auswählen"; return button; }
  function row(item = {}, index = 0) {
    const tr = document.createElement("tr"), ordinal = document.createElement("td"), workspaceCell = document.createElement("td"), sourceCell = document.createElement("td"), number = document.createElement("span"), remove = document.createElement("button"), select = document.createElement("select");
    number.textContent = index + 1; remove.type = "button"; remove.dataset.removeRow = ""; remove.textContent = "Entfernen"; ordinal.className = "document-row-number"; ordinal.append(number, remove);
    options().forEach(([key, path]) => select.add(new Option(path ? `${key} — ${path}` : key, key, false, key === (item.workspace || "<primary>")))); select.dataset.workspace = ""; workspaceCell.append(select); sourceCell.append(sourceButton(item.designSource)); tr.append(ordinal, workspaceCell, sourceCell); return tr;
  }
  function renderDocument() {
    document.title = state.data.title; document.querySelector("[data-title]").textContent = state.data.title; document.querySelector("[data-description]").textContent = state.data.description || "";
    const container = document.querySelector("[data-categories]"); container.replaceChildren(...Object.entries(state.data.categories).map(([category, entries]) => {
      const section = document.createElement("section"), heading = document.createElement("h2"), table = document.createElement("table"), add = document.createElement("button"); section.className = "card document-category"; heading.textContent = category; table.dataset.category = category; table.innerHTML = "<thead><tr><th>In</th><th>Workspace</th><th>Design Source</th></tr></thead><tbody></tbody>"; entries.forEach((item, index) => table.tBodies[0].append(row(item, index))); add.type = "button"; add.dataset.addRow = category; add.textContent = "Zeile hinzufügen"; section.append(heading, table, add); return section;
    }));
  }
  function render() { documentPage() ? renderDocument() : renderVariables(); }
  function capture() {
    if (!documentPage()) { document.querySelectorAll("[data-variable]").forEach(input => { const item = state.data.variables.find(value => value.name === input.dataset.variable); item.value = input instanceof HTMLTextAreaElement ? input.value.split("\n").map(value => value.trim()).filter(Boolean) : input.value; }); if (source === "Workspace.json") { state.data.primary = state.data.variables.find(item => item.name === "WorkspacePrimary")?.value || ""; state.data.secondary = state.data.variables.find(item => item.name === "WorkspaceSecondary")?.value || []; } return; }
    state.data.categories = Object.fromEntries([...document.querySelectorAll("[data-category]")].map(table => [table.dataset.category, [...table.tBodies[0].rows].map(tr => ({ workspace: tr.querySelector("[data-workspace]").value, designSource: tr.querySelector("[data-design-source]").textContent }))]));
  }
  async function selectDesignSource(button) {
    let name = ""; try { if ("showOpenFilePicker" in window) { const [handle] = await window.showOpenFilePicker({ multiple: false }); name = handle.name; } else { name = await new Promise(resolve => { const input = document.createElement("input"); input.type = "file"; input.onchange = () => resolve(input.files?.[0]?.name || ""); input.click(); }); } } catch (error) { if (error?.name !== "AbortError") say("Die Dateiauswahl konnte nicht geöffnet werden."); return; }
    const relative = name && window.prompt("Pfad relativ zum gewählten Workspace eingeben:", name); if (relative?.trim()) button.textContent = relative.trim();
  }
  async function refresh() {
    try { if ("showOpenFilePicker" in window) { const [handle] = await window.showOpenFilePicker({ multiple: false, types: [{ description: "JSON-Datei", accept: { "application/json": [".json"] } }] }); if (handle.name !== source) return say(`Bitte genau ${source} auswählen.`); state.handle = handle; state.data = JSON.parse(await (await handle.getFile()).text()); await workspace(documentPage()); render(); return say(`${source} wurde aktualisiert.`); }
      const input = document.createElement("input"); input.type = "file"; input.accept = ".json,application/json"; input.onchange = async () => { const file = input.files?.[0]; if (!file) return; if (file.name !== source) return say(`Bitte genau ${source} auswählen.`); state.data = JSON.parse(await file.text()); await workspace(); render(); say(`${source} wurde aktualisiert.`); }; input.click();
    } catch (error) { say(`Aktualisierung fehlgeschlagen: ${error.message}`); }
  }
  async function save() { capture(); const text = `${JSON.stringify(state.data, null, 2)}\n`; try { if (state.handle && await state.handle.requestPermission({ mode: "readwrite" }) === "granted") { const writable = await state.handle.createWritable(); await writable.write(text); await writable.close(); return say(`${source} wurde gespeichert.`); } } catch (error) { return say(`Speichern fehlgeschlagen: ${error.message}`); } const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([text], { type: "application/json" })); link.download = source; link.click(); URL.revokeObjectURL(link.href); say(`${source} wurde zum Speichern heruntergeladen.`); }
  document.addEventListener("click", event => { if (event.target.closest("[data-refresh]")) refresh(); if (event.target.closest("[data-save]")) save(); const add = event.target.closest("[data-add-row]"); if (add) { const table = document.querySelector(`[data-category="${add.dataset.addRow}"]`); table.tBodies[0].append(row({}, table.tBodies[0].rows.length)); } const remove = event.target.closest("[data-remove-row]"); if (remove) { const table = remove.closest("table"); remove.closest("tr").remove(); [...table.tBodies[0].rows].forEach((tr, index) => tr.querySelector(".document-row-number span").textContent = index + 1); } const button = event.target.closest("[data-design-source]"); if (button) selectDesignSource(button); });
  (async () => { try { const response = await fetch(new URL(source, document.baseURI)); if (!response.ok) throw new Error(); state.data = await response.json(); await workspace(); render(); say(`${source} wurde automatisch geladen.`); } catch { say(`Lokaler Browserzugriff: ${source} über „Aktualisieren“ auswählen.`); } })();
})();
