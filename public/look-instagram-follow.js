(() => {
  if (document.querySelector("[data-look-instagram-follow]")) return;

  const link = document.createElement("a");
  link.setAttribute("data-look-instagram-follow", "");
  link.href = "https://instagram.com/douglasbusta_uzi";
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.setAttribute("aria-label", "Segui Douglas Busta su Instagram");
  link.textContent = "FOLLOW ON INSTAGRAM ↗";

  Object.assign(link.style, {
    position: "fixed",
    right: "14px",
    bottom: "max(14px, env(safe-area-inset-bottom, 0px))",
    zIndex: "9990",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "38px",
    maxWidth: "calc(100vw - 28px)",
    padding: "0 14px",
    border: "1px solid rgba(231,224,210,.22)",
    borderRadius: "999px",
    background: "rgba(8,8,8,.78)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    boxShadow: "0 8px 30px rgba(0,0,0,.28)",
    color: "rgba(231,224,210,.78)",
    textDecoration: "none",
    fontFamily: 'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono",monospace',
    fontSize: "10px",
    fontWeight: "800",
    lineHeight: "1",
    letterSpacing: ".10em",
    whiteSpace: "nowrap",
    boxSizing: "border-box",
    transition: "color .18s ease, border-color .18s ease, background .18s ease"
  });

  link.addEventListener("mouseenter", () => {
    link.style.color = "#fff";
    link.style.borderColor = "rgba(231,224,210,.45)";
    link.style.background = "rgba(18,18,18,.92)";
  });

  link.addEventListener("mouseleave", () => {
    link.style.color = "rgba(231,224,210,.78)";
    link.style.borderColor = "rgba(231,224,210,.22)";
    link.style.background = "rgba(8,8,8,.78)";
  });

  document.body.appendChild(link);
})();
