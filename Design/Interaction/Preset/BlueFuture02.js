(() => {
  "use strict";

  const cards = document.querySelectorAll(".card");
  cards.forEach((card) => {
    card.addEventListener("pointerenter", () => {
      card.style.borderColor = "rgba(127, 228, 255, 0.7)";
      card.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.08), 0 18px 36px rgba(0,0,0,0.28)";
    });

    card.addEventListener("pointerleave", () => {
      card.style.borderColor = "rgba(118, 226, 255, 0.38)";
      card.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.08), 0 16px 32px rgba(0,0,0,0.2)";
    });
  });

  document.querySelectorAll("input, textarea").forEach((field) => {
    field.addEventListener("focus", () => {
      field.parentElement?.style.borderColor = "rgba(127, 228, 255, 0.7)";
    });
    field.addEventListener("blur", () => {
      field.parentElement?.style.borderColor = "rgba(118, 226, 255, 0.38)";
    });
  });
})();
