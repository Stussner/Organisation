/*
 * Komponente: TextListSelection
 * Zweck: Allgemeine, statische Textauswahl mit schreibgeschütztem Feld und Auswahlliste.
 * Schnittstelle: Nach einer Auswahl sendet das select-Element das Ereignis
 * "textlistselectionchange". Der Empfänger kann mit "textlistselectionrevert"
 * und detail.index eine Auswahl zurücksetzen.
 */

(() => {
  "use strict";

  document.querySelectorAll("[data-text-list-selection]").forEach((select) => {
    const container = select.parentElement;
    const combo = document.createElement("div");
    combo.className = "text-list-selection";
    const input = document.createElement("input");
    input.className = "text-list-selection__input";
    input.type = "text";
    input.readOnly = true;
    input.value = select.options[select.selectedIndex]?.text || "";
    input.setAttribute("aria-label", select.getAttribute("aria-label") || "Auswahl");
    input.setAttribute("aria-haspopup", "listbox");
    input.setAttribute("aria-expanded", "false");

    const button = document.createElement("button");
    button.className = "text-list-selection__button";
    button.type = "button";
    button.setAttribute("aria-label", `${input.getAttribute("aria-label")}-Liste öffnen`);
    button.setAttribute("aria-expanded", "false");
    button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>';

    const options = document.createElement("div");
    options.className = "text-list-selection__options";
    options.setAttribute("role", "listbox");
    options.setAttribute("aria-label", input.getAttribute("aria-label"));
    [...select.options].forEach((option, index) => {
      const item = document.createElement("button");
      item.className = "text-list-selection__option";
      item.type = "button";
      item.dataset.textListSelectionOption = String(index);
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", String(option.selected));
      item.textContent = option.text;
      options.append(item);
    });

    const setValue = (index) => {
      select.selectedIndex = index;
      input.value = select.options[index].text;
      options.querySelectorAll(".text-list-selection__option").forEach((item, itemIndex) => {
        item.setAttribute("aria-selected", String(itemIndex === index));
      });
    };
    const close = () => {
      combo.classList.remove("text-list-selection--open");
      input.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-expanded", "false");
    };
    const open = () => {
      combo.classList.add("text-list-selection--open");
      input.setAttribute("aria-expanded", "true");
      button.setAttribute("aria-expanded", "true");
    };

    select.hidden = true;
    container.insertBefore(combo, select);
    combo.append(input, button, options);
    button.addEventListener("click", () => combo.classList.contains("text-list-selection--open") ? close() : open());
    input.addEventListener("click", open);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });
    options.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;
      const item = event.target.closest("[data-text-list-selection-option]");
      if (!item) return;
      const previousIndex = select.selectedIndex;
      const nextIndex = Number(item.dataset.textListSelectionOption);
      close();
      if (nextIndex === previousIndex) return;
      setValue(nextIndex);
      select.dispatchEvent(new CustomEvent("textlistselectionchange", {
        bubbles: true,
        detail: { previousIndex, nextIndex, previousValue: select.options[previousIndex].value, value: select.value }
      }));
    });
    select.addEventListener("textlistselectionrevert", (event) => {
      const index = event.detail && event.detail.index;
      if (Number.isInteger(index) && select.options[index]) setValue(index);
    });
    document.addEventListener("click", (event) => {
      if (event.target instanceof Element && !event.target.closest(".text-list-selection")) close();
    });
  });
})();
