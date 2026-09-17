/*
 * Komponente: TableEditableExpansion
 * Basis: TableEditableOrdered.js
 * Zweck: Bearbeiten, Einfügen, Verschieben, Löschen und lokales Speichern
 * mit Textvorschau und einem Editor aus TextEditable und DialogConfirmation
 * für längere Zellinhalte.
 */

(() => {
  "use strict";

  const selector = "[data-table-editable-expansion]";
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
    button.dataset.tableExpansionAction = action;
    button.setAttribute("aria-label", labels[action]);
    button.title = labels[action];
    button.innerHTML = icons[action];
    return button;
  }

  function initializeRow(row) {
    const indexCell = row.cells[0];
    indexCell.classList.add("table-editable-expansion__index");
    indexCell.scope = "row";
    let label = indexCell.querySelector(".table-editable-expansion__index-label");
    if (!label) {
      label = document.createElement("span");
      label.className = "table-editable-expansion__index-label";
      indexCell.textContent = "";
      indexCell.append(label);
    }
    let controls = indexCell.querySelector(".table-editable-expansion__controls");
    if (!controls) {
      controls = document.createElement("span");
      controls.className = "table-editable-expansion__controls";
      controls.setAttribute("aria-label", "Zeilenaktionen");
      indexCell.append(controls);
    }
    controls.replaceChildren(...actionOrder.map(makeAction));
    [...row.cells].slice(1).forEach((cell) => cell.classList.add("table-editable-expansion__cell"));
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
    const pointerKey = table.dataset.tableEditableExpansionPointer;
    if (!pointerKey || pointerKey === "NULL") return 1;
    const pointer = document.querySelector(`[data-table-editable-expansion="${pointerKey}"], [data-table-editable-ordered="${pointerKey}"]`);
    const pointerRows = pointer?.tBodies[0]?.rows;
    const lastRow = pointerRows?.[pointerRows.length - 1];
    const lastIndex = Number.parseInt(lastRow?.querySelector(".table-editable-expansion__index-label, .table-editable-ordered__index-label")?.textContent, 10);
    return Number.isFinite(lastIndex) ? lastIndex + 1 : 1;
  }

  function numberRows(table) {
    const start = startIndex(table);
    [...table.tBodies[0].rows].forEach((row, index) => {
      row.querySelector(".table-editable-expansion__index-label").textContent = String(start + index).padStart(2, "0");
    });
  }

  function numberAllRows() {
    document.querySelectorAll(selector).forEach(numberRows);
  }

  function exportRows(table) {
    return [...table.tBodies[0].rows].map((row) => [...row.cells].slice(1).map((cell) => cell.textContent));
  }

  function createPreview() {
    const preview = document.createElement("div");
    preview.className = "table-editable-expansion__preview notice notice--info";
    preview.hidden = true;
    preview.setAttribute("role", "tooltip");
    document.body.append(preview);
    return preview;
  }

  function createEditor() {
    const dialog = document.createElement("dialog");
    dialog.className = "dialog-confirmation card";
    dialog.innerHTML = '<form method="dialog" class="dialog-confirmation__form"><section class="text-editable"><textarea class="text-editable__field" aria-label="Text bearbeiten" wrap="off" spellcheck="true"></textarea></section><p class="dialog-confirmation__actions"><button class="button--secondary" value="cancel">Cancel</button><button value="confirm">Confirm</button></p></form>';
    document.body.append(dialog);
    return dialog;
  }

  const preview = createPreview();
  const editor = createEditor();
  const editorText = editor.querySelector(".text-editable__field");
  let editedCell = null;

  editor.addEventListener("close", () => {
    if (editor.returnValue === "confirm" && editedCell) editedCell.textContent = editorText.value;
    editedCell = null;
  });

  document.querySelectorAll(selector).forEach((table) => {
    const body = table.tBodies[0];
    if (!body) return;
    const columns = table.tHead.rows[0].cells.length - 1;
    const storageKey = table.dataset.tableEditableExpansion;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        let rows = JSON.parse(saved);
        if (Array.isArray(rows) && rows.every((row) => Array.isArray(row) && row.length === columns + 1)) rows = rows.map((row) => row.slice(1));
        if (Array.isArray(rows) && rows.every((row) => Array.isArray(row) && row.length === columns)) body.replaceChildren(...rows.map((values) => createRow(values, columns)));
      } catch { localStorage.removeItem(storageKey); }
    }
    [...body.rows].forEach(initializeRow);
    numberAllRows();

    table.addEventListener("pointermove", (event) => {
      const row = event.target.closest("tbody tr");
      [...body.rows].forEach((candidate) => candidate.classList.toggle("table-editable-expansion--pointer-inside", candidate === row));
      const cell = event.target.closest("td.table-editable-expansion__cell");
      if (!cell || !table.contains(cell)) { preview.hidden = true; return; }
      preview.textContent = cell.textContent;
      preview.hidden = !preview.textContent;
      preview.style.left = `${Math.min(event.clientX + 14, window.innerWidth - 360)}px`;
      preview.style.top = `${Math.min(event.clientY + 14, window.innerHeight - 180)}px`;
    });
    table.addEventListener("pointerleave", () => { preview.hidden = true; [...body.rows].forEach((row) => row.classList.remove("table-editable-expansion--pointer-inside")); });
    table.addEventListener("click", (event) => {
      const button = event.target.closest("[data-table-expansion-action]");
      if (button && table.contains(button)) {
        const row = button.closest("tr");
        switch (button.dataset.tableExpansionAction) {
          case "add": row.after(createRow([], columns)); break;
          case "up": if (row.previousElementSibling) body.insertBefore(row, row.previousElementSibling); break;
          case "down": if (row.nextElementSibling) body.insertBefore(row.nextElementSibling, row); break;
          case "delete": row.remove(); break;
        }
        numberAllRows();
        return;
      }
      const cell = event.target.closest("td.table-editable-expansion__cell");
      if (!cell || !table.contains(cell)) return;
      editedCell = cell;
      editorText.value = cell.textContent;
      editor.showModal();
      editorText.focus();
    });
    document.querySelector(`[data-table-controls="${storageKey}"]`)?.querySelector("[data-table-save]")?.addEventListener("click", () => localStorage.setItem(storageKey, JSON.stringify(exportRows(table))));
  });
})();
