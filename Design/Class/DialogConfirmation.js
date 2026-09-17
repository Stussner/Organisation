/*
 * Komponente: DialogConfirmation
 * Zweck: Öffnet ausdrücklich markierte Bestätigungsdialoge modal.
 */

(() => {
  "use strict";

  document.querySelectorAll("[data-dialog-confirmation-open]").forEach((trigger) => {
    const dialog = document.getElementById(trigger.dataset.dialogConfirmationOpen);
    if (!(dialog instanceof HTMLDialogElement)) return;

    trigger.addEventListener("click", () => {
      if (!dialog.open) dialog.showModal();
    });
  });
})();
