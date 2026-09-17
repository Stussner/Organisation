/*
 * Komponente: TableEditable
 * Basis: Table.html
 * Zweck: Ermöglicht das Bearbeiten, Ergänzen, Löschen und lokale Speichern
 * von Datenzeilen einer ausdrücklich markierten HTML-Tabelle.
 */

(() => {
  "use strict";

  const selector = "[data-table-editable]";

  function createCell(value) {
    const cell = document.createElement("td");
    cell.contentEditable = "true";
    cell.spellcheck = true;
    cell.textContent = value;
    return cell;
  }

  function createRemoveCell() {
    const cell = document.createElement("td");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "secondary";
    button.textContent = "Zeile löschen";
    button.addEventListener("click", () => cell.parentElement.remove());
    cell.append(button);
    return cell;
  }

  function addRow(table, values = []) {
    const body = table.tBodies[0];
    const count = table.tHead.rows[0].cells.length - 1;
    const row = body.insertRow();
    for (let index = 0; index < count; index += 1) {
      row.append(createCell(values[index] ?? ""));
    }
    row.append(createRemoveCell());
  }

  function exportRows(table) {
    return [...table.tBodies[0].rows].map((row) =>
      [...row.cells].slice(0, -1).map((cell) => cell.textContent.trim())
    );
  }

  function saveRows(table) {
    localStorage.setItem(table.dataset.tableEditable, JSON.stringify(exportRows(table)));
  }

  function loadRows(table) {
    const saved = localStorage.getItem(table.dataset.tableEditable);
    if (!saved) return;
    try {
      const rows = JSON.parse(saved);
      if (!Array.isArray(rows)) return;
      table.tBodies[0].replaceChildren();
      rows.forEach((values) => addRow(table, values));
    } catch {
      localStorage.removeItem(table.dataset.tableEditable);
    }
  }

  document.querySelectorAll(selector).forEach((table) => {
    loadRows(table);
    [...table.tBodies[0].rows].forEach((row) => {
      [...row.cells].forEach((cell, index) => {
        if (index < row.cells.length - 1) cell.contentEditable = "true";
      });
      if (!row.cells[row.cells.length - 1].querySelector("button")) {
        row.cells[row.cells.length - 1].replaceWith(createRemoveCell());
      }
    });

    const controls = document.querySelector(`[data-table-controls="${table.dataset.tableEditable}"]`);
    controls?.querySelector("[data-table-add]")?.addEventListener("click", () => addRow(table));
    controls?.querySelector("[data-table-save]")?.addEventListener("click", () => saveRows(table));
  });
})();
