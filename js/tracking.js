/* =========================================================================
   Patrícia Kayo — Rastreamento de conversão (Google Analytics 4 + Google Ads)
   -------------------------------------------------------------------------
   COMO ATIVAR (leva 2 minutos, depois que as contas estiverem criadas):

   1) GA4  -> troque "G-XXXXXXXXXX" pelo seu ID de Medição
             (Google Analytics > Administrador > Fluxos de dados)

   2) Ads  -> troque "AW-XXXXXXXXXX/XXXXXXXXXXXXXXXXXXX" pelo rótulo de
             conversão do Google Ads (Objetivos > Conversões > sua ação >
             "Instalar a tag" > o valor de send_to)

   Enquanto os valores forem os de exemplo (com "XXXX"), NADA é carregado —
   o site continua limpo e rápido. Assim que você preencher, passam a contar
   como conversão, automaticamente e em todas as páginas:
     • clique em qualquer botão de WhatsApp
     • clique no telefone
     • clique no e-mail
     • envio do formulário da página de contato
   ========================================================================= */
(function () {
  "use strict";

  var GA4_ID      = "G-XXXXXXXXXX";                          // <-- seu ID do GA4
  var ADS_SEND_TO = "AW-18197236635/_U8VCOru1_wcEJuXj-VD";    // <-- conversão "Clique no WhatsApp"

  var hasGA4 = GA4_ID && GA4_ID.indexOf("XXXX") === -1;
  var hasAds = ADS_SEND_TO && ADS_SEND_TO.indexOf("XXXX") === -1;
  if (!hasGA4 && !hasAds) return; // ainda não configurado — não carrega nada

  // --- carrega o gtag.js uma única vez ---
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  var primaryId = hasGA4 ? GA4_ID : ADS_SEND_TO.split("/")[0];
  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(primaryId);
  document.head.appendChild(s);

  gtag("js", new Date());
  if (hasGA4) gtag("config", GA4_ID);
  if (hasAds) gtag("config", ADS_SEND_TO.split("/")[0]);

  // --- dispara conversão (GA4 + Ads) ---
  function fireLead(origem) {
    if (hasGA4) gtag("event", "generate_lead", { method: origem });
    if (hasAds) gtag("event", "conversion", { send_to: ADS_SEND_TO, origem: origem });
  }

  // --- clique em WhatsApp / telefone / e-mail, em qualquer página ---
  document.addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest("a[href]") : null;
    if (!a) return;
    var href = (a.getAttribute("href") || "").toLowerCase();
    if (href.indexOf("wa.me") !== -1 || href.indexOf("api.whatsapp") !== -1) { fireLead("whatsapp"); return; }
    if (href.indexOf("tel:") === 0)    { fireLead("telefone"); return; }
    if (href.indexOf("mailto:") === 0) { fireLead("email"); return; }
  }, true);

  // --- envio do formulário (a página de contato dispara este evento) ---
  window.addEventListener("pk:lead", function () { fireLead("formulario"); });
})();
