/*
 * Komponente: TableEditableOrdered
 * Basis: TableEditable.js
 * Zweck: Bearbeiten, Einfügen, Verschieben, Löschen und lokales Speichern
 * von Datenzeilen mit statischer Indexspalte.
 */

(() => {
  "use strict";

  const selector = "[data-table-editable-ordered]";
  const actionOrder = ["add", "up", "down", "delete"];
  const icons = {
    add: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>',
    up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5m0 0-5 5m5-5 5 5" /></svg>',
    down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14m0 0-5-5m5 5 5-5" /></svg>',
    delete: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M9 7V5h6v2m-7 3v8m4-8v8m4-8v8M7 7l1 14h8l1-14" /></svg>'
  };
  const labels = { add: "Zeile erstellen", up: "Zeile nach oben verschieben", down: "Zeile nach unten verschieben", delete: "Zeile löschen" };

  function makeAction(action) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.tableOrderedAction = action;
    button.setAttribute("aria-label", labels[action]);
    button.title = labels[action];
    button.innerHTML = icons[action];
    return button;
  }

  function initializeRow(row) {
    const indexCell = row.cells[0];
    indexCell.classList.add("table-editable-ordered__index");
    indexCell.scope = "row";
    let label = indexCell.querySelector(".table-editable-ordered__index-label");
    if (!label) {
      label = document.createElement("span");
      label.className = "table-editable-ordered__index-label";
      indexCell.textContent = "";
      indexCell.append(label);
    }
    let controls = indexCell.querySelector(".table-editable-ordered__controls");
    if (!controls) {
      controls = document.createElement("span");
      controls.className = "table-editable-ordered__controls";
      controls.setAttribute("aria-label", "Zeilenaktionen");
      indexCell.append(controls);
    }
    controls.replaceChildren(...actionOrder.map(makeAction));
    [...row.cells].slice(1).forEach((cell) => { cell.contentEditable = "true"; cell.spellcheck = true; });
  }

  function createRow(values, columns) {
    const row = document.createElement("tr");
    row.append(document.createElement("th"));
    for (let index = 0; index < columns; index += 1) {
      const cell = document.createElement("td");
      cell.textContent = values[index] ?? "";
      row.append(cell);
    }
    initializeRow(row);
    return row;
  }

  function startIndex(table) {
    const pointerKey = table.dataset.tableEditableOrderedPointer;
    if (!pointerKey || pointerKey === "NULL") return 1;
    const pointer = document.querySelector(`[data-table-editable-ordered="${pointerKey}"]`);
    const pointerRows = pointer?.tBodies[0]?.rows;
    const lastRow = pointerRows?.[pointerRows.length - 1];
    const lastIndex = Number.parseInt(lastRow?.querySelector(".table-editable-ordered__index-label")?.textContent, 10);
    return Number.isFinite(lastIndex) ? lastIndex + 1 : 1;
  }

  function numberRows(table) {
    const start = startIndex(table);
    [...table.tBodies[0].rows].forEach((row, index) => {
      row.querySelector(".table-editable-ordered__index-label").textContent = String(start + index).padStart(2, "0");
    });
  }

  function numberAllRows() {
    document.querySelectorAll(selector).forEach(numberRows);
  }

  function exportRows(table) {
    return [...table.tBodies[0].rows].map((row) => [...row.cells].slice(1).map((cell) => cell.textContent.trim()));
  }

  document.querySelectorAll(selector).forEach((table) => {
    const body = table.tBodies[0];
    if (!body) return;
    const columns = table.tHead.rows[0].cells.length - 1;
    const storageKey = table.dataset.tableEditableOrdered;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        let rows = JSON.parse(saved);
        if (Array.isArray(rows) && rows.every((row) => Array.isArray(row) && row.length === columns + 1)) {
          rows = rows.map((row) => row.slice(1));
        }
        if (Array.isArray(rows) && rows.every((row) => Array.isArray(row) && row.length === columns)) {
          body.replaceChildren(...rows.map((values) => createRow(values, columns)));
        }
      } catch { localStorage.removeItem(storageKey); }
    }
    [...body.rows].forEach(initializeRow);
    numberAllRows();

    table.addEventListener("pointermove", (event) => {
      const row = event.target.closest("tbody tr");
      [...body.rows].forEach((candidate) => candidate.classList.toggle("table-editable-ordered--pointer-inside", candidate === row));
    });
    table.addEventListener("pointerleave", () => [...body.rows].forEach((row) => row.classList.remove("table-editable-ordered--pointer-inside")));
    table.addEventListener("click", (event) => {
      const button = event.target.closest("[data-table-ordered-action]");
      if (!button || !table.contains(button)) return;
      const row = button.closest("tr");
      switch (button.dataset.tableOrderedAction) {
        case "add": row.after(createRow([], columns)); break;
        case "up": if (row.previousElementSibling) body.insertBefore(row, row.previousElementSibling); break;
        case "down": if (row.nextElementSibling) body.insertBefore(row.nextElementSibling, row); break;
        case "delete": row.remove(); break;
      }
      numberAllRows();
    });
    document.querySelector(`[data-table-controls="${storageKey}"]`)?.querySelector("[data-table-save]")?.addEventListener("click", () => localStorage.setItem(storageKey, JSON.stringify(exportRows(table))));
  });
})();
