(() => {
  if (document.querySelector("[data-look-instagram]")) return;

  const wrap = document.createElement("div");
  wrap.setAttribute("data-look-instagram", "");
  wrap.style.cssText = `
    width:100%;
    display:flex;
    justify-content:center;
    align-items:center;
    padding:22px 16px max(18px, env(safe-area-inset-bottom, 0px));
    box-sizing:border-box;
  `;

  const link = document.createElement("a");
  link.href = "https://www.instagram.com/douglasbusta_uzi/";
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "Instagram · @douglasbusta_uzi ↗";

  link.style.cssText = `
    display:inline-flex;
    align-items:center;
    justify-content:center;
    max-width:100%;
    color:rgba(231,224,210,.62);
    text-decoration:none;
    font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono",monospace;
    font-size:11px;
    font-weight:700;
    letter-spacing:.08em;
    line-height:1.4;
    text-align:center;
    transition:color .18s ease, opacity .18s ease;
  `;

  link.addEventListener("mouseenter", () => {
    link.style.color = "rgba(231,224,210,.95)";
  });

  link.addEventListener("mouseleave", () => {
    link.style.color = "rgba(231,224,210,.62)";
  });

  wrap.appendChild(link);
  document.body.appendChild(wrap);
})();
