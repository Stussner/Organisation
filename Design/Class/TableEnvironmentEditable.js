/*
 * Komponente: TableEnvironmentEditable
 * Zweck: Bearbeiten, Einfügen, Löschen und Sortieren von Umgebungszeilen.
 */

(() => {
  "use strict";

  const selector = "[data-table-environment-editable]";
  const actionOrder = ["add", "up", "down", "delete"];
  const icons = {
    delete: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M9 7V5h6v2m-7 3v8m4-8v8m4-8v8M7 7l1 14h8l1-14" /></svg>',
    up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5m0 0-5 5m5-5 5 5" /></svg>',
    down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14m0 0-5-5m5 5 5-5" /></svg>',
    add: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>'
  };
  const labels = { delete: "Zeile löschen", up: "Zeile nach oben verschieben", down: "Zeile nach unten verschieben", add: "Zeile erstellen" };

  function createAction(action) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.environmentAction = action;
    button.setAttribute("aria-label", labels[action]);
    button.title = labels[action];
    button.innerHTML = icons[action];
    return button;
  }

  function createRow(values = ["", ""]) {
    const row = document.createElement("tr");
    const numberCell = document.createElement("td");
    numberCell.className = "table-environment-editable__number";
    const number = document.createElement("span");
    number.className = "table-environment-editable__number-label";
    const controls = document.createElement("span");
    controls.className = "table-environment-editable__controls";
    controls.setAttribute("aria-label", "Zeilenaktionen");
    actionOrder.forEach((action) => controls.append(createAction(action)));
    numberCell.append(number, controls);
    row.append(numberCell);
    values.forEach((value) => {
      const cell = document.createElement("td");
      cell.contentEditable = "true";
      cell.spellcheck = true;
      cell.textContent = value;
      row.append(cell);
    });
    return row;
  }

  function numberRows(table) {
    [...table.tBodies[0].rows].forEach((row, index) => {
      row.querySelector(".table-environment-editable__number-label").textContent = String(index + 1);
    });
  }

  function initializeRow(row) {
    [...row.cells].slice(1).forEach((cell) => {
      cell.contentEditable = "true";
      cell.spellcheck = true;
    });
    const numberCell = row.cells[0];
    numberCell.classList.add("table-environment-editable__number");
    if (!numberCell.querySelector(".table-environment-editable__number-label")) {
      const number = document.createElement("span");
      number.className = "table-environment-editable__number-label";
      numberCell.prepend(number);
    }
    let controls = numberCell.querySelector(".table-environment-editable__controls");
    if (!controls) {
      controls = document.createElement("span");
      controls.className = "table-environment-editable__controls";
      controls.setAttribute("aria-label", "Zeilenaktionen");
      numberCell.append(controls);
    }
    controls.replaceChildren(...actionOrder.map(createAction));
  }

  function updatePointerRow(table, target) {
    const row = target instanceof Element ? target.closest("tbody tr") : null;
    [...table.tBodies[0].rows].forEach((candidate) => {
      candidate.classList.toggle("table-environment-editable--pointer-inside", candidate === row && table.contains(row));
    });
  }

  document.querySelectorAll(selector).forEach((table) => {
    const body = table.tBodies[0];
    if (!body) return;
    [...body.rows].forEach(initializeRow);
    numberRows(table);

    table.addEventListener("pointermove", (event) => updatePointerRow(table, event.target));
    table.addEventListener("pointerleave", () => updatePointerRow(table, null));

    table.addEventListener("click", (event) => {
      const button = event.target.closest("[data-environment-action]");
      if (!button || !table.contains(button)) return;
      const row = button.closest("tr");
      if (!row) return;
      switch (button.dataset.environmentAction) {
        case "delete": row.remove(); break;
        case "up": if (row.previousElementSibling) body.insertBefore(row, row.previousElementSibling); break;
        case "down": if (row.nextElementSibling) body.insertBefore(row.nextElementSibling, row); break;
        case "add": row.after(createRow()); break;
      }
      numberRows(table);
      updatePointerRow(table, document.elementFromPoint(event.clientX, event.clientY));
    });
  });
})();
