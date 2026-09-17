/*
 * Komponente: ListDirectory
 * Zweck: Auswahl und temporäre Bearbeitung eines primären sowie mehrerer sekundärer Ordnerpfade.
 * Hinweis: Die Komponente schreibt keine HTML-Dateien. Ein vollständiger Pfad wird nach der
 * Ordnerauswahl ausdrücklich als Text bestätigt, weil Browser ihn nicht bereitstellen.
 */

(() => {
  "use strict";

  const icons = {
    add: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>',
    up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5m0 0-5 5m5-5 5 5" /></svg>',
    down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14m0 0-5-5m5 5 5-5" /></svg>',
    delete: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M9 7V5h6v2m-7 3v8m4-8v8m4-8v8M7 7l1 14h8l1-14" /></svg>',
    save: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h12l3 3v13H4V4h8m-5 0v6h8V4m-7 16v-6h8v6" /></svg>'
  };

  const labels = {
    add: "Ordner hinzufügen",
    up: "Ordner nach oben verschieben",
    down: "Ordner nach unten verschieben",
    delete: "Ordner löschen",
    save: "Aktuelle Verzeichniswerte speichern"
  };
  const savedFileHandles = new Map();

  function createButton(action) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.directoryAction = action;
    button.setAttribute("aria-label", labels[action]);
    button.title = labels[action];
    button.innerHTML = icons[action];
    return button;
  }

  async function selectDirectoryName() {
    if ("showDirectoryPicker" in window) {
      const handle = await window.showDirectoryPicker({ mode: "read" });
      return { confirmed: true, name: handle.name };
    }

    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.multiple = true;
      input.setAttribute("webkitdirectory", "");
      input.addEventListener("change", () => {
        const firstFile = input.files && input.files[0];
        const relativePath = firstFile && firstFile.webkitRelativePath;
        // Leere Ordner enthalten keine Datei. Der Browser bestätigt ihre Auswahl trotzdem,
        // liefert dann aber keinen Namen. Der vollständige Pfad wird anschließend manuell
        // eingegeben; ein fehlender Name ist daher kein Abbruch.
        resolve({ confirmed: true, name: relativePath ? relativePath.split("/")[0] : "" });
      }, { once: true });
      input.addEventListener("cancel", () => resolve({ confirmed: false, name: "" }), { once: true });
      input.click();
    });
  }

  async function selectPath(currentPath = "") {
    try {
      const selection = await selectDirectoryName();
      if (!selection.confirmed) return null;
      const directoryName = selection.name;
      const message = directoryName
        ? `Der Browser hat den Ordner „${directoryName}“ ausgewählt. Vollständigen Ordnerpfad bestätigen oder eingeben:`
        : "Die Browserauswahl wurde bestätigt, der Browser hat jedoch keinen Ordnernamen übermittelt. Vollständigen Ordnerpfad eingeben:";
      const value = window.prompt(
        message,
        currentPath || directoryName
      );
      return value && value.trim() ? value.trim() : null;
    } catch (error) {
      if (error && error.name === "AbortError") return null;
      window.alert("Der Ordnerauswahldialog konnte nicht geöffnet werden.");
      return null;
    }
  }

  function createItem(path, list) {
    const item = document.createElement("li");
    item.className = "directory-list__item";
    const value = document.createElement("code");
    value.className = "directory-list__value";
    value.textContent = path;
    const controls = document.createElement("span");
    controls.className = "directory-list__controls";
    controls.setAttribute("aria-label", "Ordneraktionen");
    ["up", "down", "delete"].forEach((action) => controls.append(createButton(action)));
    item.append(value, controls);
    list.append(item);
    return item;
  }

  function updateControls(list) {
    const items = [...list.children];
    items.forEach((item, index) => {
      item.querySelector('[data-directory-action="up"]').hidden = index === 0;
      item.querySelector('[data-directory-action="down"]').hidden = index === items.length - 1;
    });
  }

  function serializeDocument() {
    return `<!doctype html>\n${document.documentElement.outerHTML}`;
  }

  function secondaryValues(table) {
    return [...table.querySelectorAll("[data-directory-secondary-list] .directory-list__value")]
      .map((value) => value.textContent.trim());
  }

  function escapeHtml(value) {
    return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  }

  function serializeDirectoryValues(source, table) {
    const primaryValue = table.querySelector("[data-directory-primary] code")?.textContent.trim();
    const secondary = secondaryValues(table);
    const primaryRowId = table.querySelector("[data-directory-primary]")?.closest("tr")?.id;
    const primaryRow = primaryRowId ? source.indexOf(`id="${primaryRowId}"`) : -1;
    const primaryIdentifierEnd = primaryRow < 0 ? -1 : source.indexOf("</code>", primaryRow);
    const primaryBegin = primaryIdentifierEnd < 0 ? -1 : source.indexOf("<code>", primaryIdentifierEnd);
    const primaryEnd = primaryBegin < 0 ? -1 : source.indexOf("</code>", primaryBegin);
    const listMarker = source.indexOf("data-directory-secondary-list");
    const listBegin = listMarker < 0 ? -1 : source.indexOf(">", listMarker);
    const listEnd = listBegin < 0 ? -1 : source.indexOf("</ul>", listBegin);
    if (!primaryValue || primaryEnd < 0 || listEnd < 0) return null;
    const withPrimary = `${source.slice(0, primaryBegin + 6)}${escapeHtml(primaryValue)}${source.slice(primaryEnd)}`;
    const updatedMarker = withPrimary.indexOf("data-directory-secondary-list");
    const updatedBegin = withPrimary.indexOf(">", updatedMarker);
    const updatedEnd = withPrimary.indexOf("</ul>", updatedBegin);
    const items = secondary.map((value) => `<li class="directory-list__item"><code class="directory-list__value">${escapeHtml(value)}</code></li>`).join("");
    return `${withPrimary.slice(0, updatedBegin + 1)}${items}${withPrimary.slice(updatedEnd)}`;
  }

  function downloadDocument(fileName) {
    const blob = new Blob([serializeDocument()], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function saveDocument(table, status) {
    const location = document.querySelector("[data-header-minimum-location-from-url]")?.textContent.trim() || "";
    const fileName = location.split(/[\\/]/).pop() || table.dataset.directorySaveFile;
    if ("showOpenFilePicker" in window) {
      try {
        let handle = savedFileHandles.get(location);
        if (!handle) {
          [handle] = await window.showOpenFilePicker({
            multiple: false,
            types: [{ description: "HTML-Datei", accept: { "text/html": [".html"] } }]
          });
          if (!handle || handle.name !== fileName) {
            status.textContent = `Speichern abgebrochen: Bitte genau ${fileName} auswählen.`;
            return;
          }
          savedFileHandles.set(location, handle);
        }
        let permission = await handle.queryPermission({ mode: "readwrite" });
        if (permission !== "granted") permission = await handle.requestPermission({ mode: "readwrite" });
        if (permission !== "granted") {
          status.textContent = "Speichern abgebrochen: keine Schreibfreigabe erteilt.";
          savedFileHandles.delete(location);
          return;
        }
        const expectedSecondaryValues = secondaryValues(table);
        const sourceDocument = await (await handle.getFile()).text();
        const directoryDocument = serializeDirectoryValues(sourceDocument, table);
        if (!directoryDocument) {
          status.textContent = "Speichern abgebrochen: Die Ausgangsstruktur der Verzeichniswerte wurde nicht erkannt.";
          return;
        }
        const writable = await handle.createWritable();
        await writable.write(directoryDocument);
        await writable.close();
        const savedDocument = await (await handle.getFile()).text();
        const missingValues = expectedSecondaryValues.filter((value) => !savedDocument.includes(`>${value}</code>`));
        if (missingValues.length) {
          status.textContent = `Speichern fehlerhaft: ${missingValues.length} sekundäre Zielwerte fehlen nach dem Rücklesen.`;
          return;
        }
        status.textContent = `${fileName} wurde direkt gespeichert (${location}).`;
        return;
      } catch (error) {
        savedFileHandles.delete(location);
        if (error && error.name === "AbortError") {
          status.textContent = "Speichern abgebrochen.";
          return;
        }
        status.textContent = "Direktes Speichern nicht verfügbar; aktualisierte HTML-Datei wird heruntergeladen.";
      }
    }
    downloadDocument(fileName);
    if (!status.textContent) status.textContent = "Aktualisierte HTML-Datei wurde zum Speichern heruntergeladen.";
  }

  document.querySelectorAll("[data-directory-list]").forEach((table) => {
    const list = table.querySelector("[data-directory-secondary-list]");
    const primary = table.querySelector("[data-directory-primary]");
    const addButton = table.querySelector('[data-directory-action="add"]');
    const saveButton = table.parentElement.querySelector("[data-directory-save]");
    const status = table.parentElement.querySelector("[data-directory-save-status]");
    if (!list || !primary) return;

    [...list.children].forEach((item) => {
      if (item.querySelector(".directory-list__controls")) return;
      const controls = document.createElement("span");
      controls.className = "directory-list__controls";
      controls.setAttribute("aria-label", "Ordneraktionen");
      ["up", "down", "delete"].forEach((action) => controls.append(createButton(action)));
      item.append(controls);
    });
    updateControls(list);

    primary.addEventListener("click", async () => {
      const code = primary.querySelector("code");
      const path = await selectPath(code ? code.textContent : "");
      if (path && code) {
        code.textContent = path;
        if (status) status.textContent = "Primärer Ordner wurde übernommen.";
      } else if (status) {
        status.textContent = "Ordnerauswahl abgebrochen; keine Änderung übernommen.";
      }
    });

    if (addButton) {
      addButton.addEventListener("click", async () => {
        const path = await selectPath();
        if (path) {
          createItem(path, list);
          updateControls(list);
          if (status) status.textContent = "Sekundärer Ordner wurde übernommen.";
        } else if (status) {
          status.textContent = "Ordnerauswahl abgebrochen; kein sekundärer Ordner hinzugefügt.";
        }
      });
    }

    table.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-directory-action]");
      if (!button || !table.contains(button)) return;
      const action = button.dataset.directoryAction;
      if (action === "add") return;
      const item = button.closest(".directory-list__item");
      if (!item) return;
      if (action === "delete") item.remove();
      if (action === "up" && item.previousElementSibling) list.insertBefore(item, item.previousElementSibling);
      if (action === "down" && item.nextElementSibling) list.insertBefore(item.nextElementSibling, item);
      updateControls(list);
    });

    if (saveButton && status) {
      saveButton.addEventListener("click", () => saveDocument(table, status));
    }
  });
})();
