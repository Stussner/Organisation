/* Komponente: HeaderMinimum | Dateititel und stilisierte Auswahllisten. */
(() => {
  "use strict";

  const fileName = decodeURIComponent(window.location.pathname.split("/").pop() || "");
  const titleFromFileName = fileName.replace(/\.[^.]+$/, "") || "Dokumenttitel";
  document.querySelectorAll("[data-header-minimum-title-from-filename]").forEach((input) => {
    input.value = titleFromFileName;
  });
  const locationFromFileUrl = decodeURIComponent(window.location.pathname)
    .replace(/^\/?([A-Za-z]:)/, "$1")
    .replaceAll("/", "\\");
  document.querySelectorAll("[data-header-minimum-location-from-url]").forEach((field) => {
    field.textContent = locationFromFileUrl || "Dokumentpfad";
  });

  const combos = [];
  const closeCombo = (combo) => {
    combo.classList.remove("header-minimum__combo--open");
    combo.querySelector("input").setAttribute("aria-expanded", "false");
    combo.querySelector("button").setAttribute("aria-expanded", "false");
  };
  const openCombo = (combo) => {
    combos.forEach((candidate) => { if (candidate !== combo) closeCombo(candidate); });
    combo.classList.add("header-minimum__combo--open");
    combo.querySelector("input").setAttribute("aria-expanded", "true");
    combo.querySelector("button").setAttribute("aria-expanded", "true");
  };

  document.querySelectorAll(".header-minimum__select-row select").forEach((select) => {
    const existingButton = select.parentElement.querySelector("[data-header-minimum-list-button]");
    if (existingButton) existingButton.remove();

    const combo = document.createElement("div");
    combo.className = "header-minimum__combo";
    const input = document.createElement("input");
    input.className = "header-minimum__combo-input";
    input.type = "text";
    input.readOnly = true;
    input.value = select.options[select.selectedIndex]?.text || "";
    input.setAttribute("aria-label", select.getAttribute("aria-label") || "Auswahl");
    input.setAttribute("aria-haspopup", "listbox");
    input.setAttribute("aria-expanded", "false");

    const button = document.createElement("button");
    button.className = "header-minimum__list-button";
    button.type = "button";
    button.setAttribute("aria-label", `${input.getAttribute("aria-label")}-Auswahl öffnen`);
    button.setAttribute("aria-expanded", "false");
    button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>';

    const options = document.createElement("div");
    options.className = "header-minimum__options";
    options.setAttribute("role", "listbox");
    options.setAttribute("aria-label", input.getAttribute("aria-label"));
    [...select.options].forEach((option, index) => {
      const item = document.createElement("button");
      item.className = "header-minimum__option";
      item.type = "button";
      item.dataset.headerMinimumOption = String(index);
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", String(option.selected));
      item.textContent = option.text;
      options.append(item);
    });

    select.hidden = true;
    select.parentElement.insertBefore(combo, select);
    combo.append(input, button, options);
    combos.push(combo);
  });

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const option = event.target.closest(".header-minimum__option");
    if (option) {
      const combo = option.closest(".header-minimum__combo");
      const select = combo.parentElement.querySelector("select");
      select.selectedIndex = Number(option.dataset.headerMinimumOption);
      combo.querySelector("input").value = select.options[select.selectedIndex].text;
      combo.querySelectorAll(".header-minimum__option").forEach((item, index) => item.setAttribute("aria-selected", String(index === select.selectedIndex)));
      select.dispatchEvent(new Event("change", { bubbles: true }));
      closeCombo(combo);
      return;
    }

    const combo = event.target.closest(".header-minimum__combo");
    if (!combo) {
      combos.forEach(closeCombo);
      return;
    }
    if (event.target.closest(".header-minimum__combo-input, .header-minimum__list-button")) {
      if (combo.classList.contains("header-minimum__combo--open")) closeCombo(combo);
      else openCombo(combo);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (!(event.target instanceof Element)) return;
    const input = event.target.closest(".header-minimum__combo-input");
    if (!input) return;
    const combo = input.closest(".header-minimum__combo");
    if (event.key === "Escape") closeCombo(combo);
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openCombo(combo);
    }
  });
})();
