// Guajuvira: comportamento do site (sem dependências)
(function () {
  "use strict";
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  // Menu do celular
  var btn = $(".menu-btn"), menu = $("#menu");
  if (btn && menu) {
    btn.addEventListener("click", function () {
      var aberto = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!aberto));
      btn.setAttribute("aria-label", aberto ? "Abrir menu" : "Fechar menu");
      menu.hidden = aberto;
      document.body.style.overflow = aberto ? "" : "hidden";
      document.body.classList.toggle("menu-aberto", !aberto);
      var t = document.querySelector(".topo");
      if (!aberto) t.classList.add("compacto"); else if (window.scrollY < 10) t.classList.remove("compacto");
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && !menu.hidden) { btn.click(); btn.focus(); }
    });
  }

  // Cabeçalho: logo grande no topo, compacto ao rolar (com folga para não ficar piscando)
  var topo = $(".topo");
  if (topo) {
    var ajustarTopo = function () {
      var y = window.scrollY;
      if (y > 120) topo.classList.add("compacto");
      else if (y < 10 && !document.body.classList.contains("menu-aberto")) topo.classList.remove("compacto");
    };
    window.addEventListener("scroll", ajustarTopo, { passive: true });
    ajustarTopo();
  }

  // Megamenu de produtos (desktop): abre no hover/foco pelo CSS; aqui só acessibilidade e Esc
  var mega = $("[data-mega]");
  if (mega) {
    var link = $("a", mega);
    var marcar = function (v) { link.setAttribute("aria-expanded", String(v)); };
    mega.addEventListener("mouseenter", function () { mega.classList.remove("fechado"); marcar(true); });
    mega.addEventListener("mouseleave", function () { marcar(false); });
    mega.addEventListener("focusin", function () { marcar(true); });
    mega.addEventListener("focusout", function (ev) { if (!mega.contains(ev.relatedTarget)) marcar(false); });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && mega.matches(":hover, :focus-within")) {
        mega.classList.add("fechado"); marcar(false); link.focus();
      }
    });
    link.addEventListener("focus", function () { mega.classList.remove("fechado"); });
  }

  var semMovimento =window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Revelar blocos ao rolar
  var revelar = $$(".revela");
  if (!semMovimento && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("visto"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revelar.forEach(function (el) { io.observe(el); });
  } else {
    revelar.forEach(function (el) { el.classList.add("visto"); });
  }

  // Vitrine (carrossel do topo)
  var vit = $("[data-vitrine]");
  if (vit) {
    var slides = $$(".slide", vit), pontos = $$(".ponto", vit), atual = 0, timer = null, TEMPO = 5000;
    vit.style.setProperty("--tempo", TEMPO + "ms");
    var mostrar = function (n) {
      n = (n + slides.length) % slides.length;
      if (n === atual) return;
      var velho = slides[atual];
      velho.classList.remove("ativo"); velho.classList.add("sai");
      velho.setAttribute("aria-hidden", "true"); velho.setAttribute("tabindex", "-1");
      setTimeout(function () { velho.classList.remove("sai"); }, 700);
      var novo = slides[n];
      var im = $("img", novo); if (im) im.loading = "eager";
      novo.classList.add("ativo"); novo.removeAttribute("aria-hidden"); novo.removeAttribute("tabindex");
      pontos[atual].removeAttribute("aria-current");
      pontos[n].setAttribute("aria-current", "true");
      atual = n;
    };
    var iniciar = function () {
      if (semMovimento) { vit.classList.add("parada"); return; }
      parar(); timer = setInterval(function () { mostrar(atual + 1); reiniciarBarra(); }, TEMPO);
      vit.classList.remove("pausada"); reiniciarBarra();
    };
    var reiniciarBarra = function () {
      vit.classList.add("parada"); void vit.offsetWidth; vit.classList.remove("parada");
    };
    var parar = function () { clearInterval(timer); timer = null; };
    var pausar = function () { parar(); vit.classList.add("pausada"); };
    $("[data-prox]", vit).addEventListener("click", function () { mostrar(atual + 1); iniciar(); });
    $("[data-ant]", vit).addEventListener("click", function () { mostrar(atual - 1); iniciar(); });
    pontos.forEach(function (p, i) { p.addEventListener("click", function () { mostrar(i); iniciar(); }); });
    vit.addEventListener("mouseenter", pausar);
    vit.addEventListener("mouseleave", iniciar);
    vit.addEventListener("focusin", pausar);
    vit.addEventListener("focusout", iniciar);
    document.addEventListener("visibilitychange", function () { document.hidden ? pausar() : iniciar(); });
    // arrastar com o dedo no celular
    var x0 = null;
    vit.addEventListener("touchstart", function (ev) { x0 = ev.touches[0].clientX; }, { passive: true });
    vit.addEventListener("touchend", function (ev) {
      if (x0 === null) return;
      var dx = ev.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) { mostrar(atual + (dx < 0 ? 1 : -1)); iniciar(); }
    });
    iniciar();
  }

  // Galeria do produto
  var principal = $(".galeria-principal");
  $$(".galeria-thumbs button").forEach(function (b, _, todos) {
    b.addEventListener("click", function () {
      principal.src = b.getAttribute("data-img");
      if (!semMovimento && principal.animate) principal.animate([{ opacity: 0.2 }, { opacity: 1 }], { duration: 300 });
      todos.forEach(function (x) { x.removeAttribute("aria-current"); });
      b.setAttribute("aria-current", "true");
    });
  });

  // Escolha de versão: atualiza botões de orçamento e barra fixa
  var versoes = $("[data-versoes]");
  if (versoes) {
    var atualizar = function () {
      var r = $("input:checked", versoes);
      if (!r) return;
      $$("[data-cta]").forEach(function (a) { a.href = r.getAttribute("data-wa"); });
      $$("[data-cta-nome], [data-barra-nome]").forEach(function (el) { el.textContent = r.getAttribute("data-nome"); });
      var p = $("[data-barra-preco]"); if (p) p.textContent = r.getAttribute("data-preco");
    };
    versoes.addEventListener("change", atualizar);
    atualizar();
  }

  // Barra fixa aparece quando o botão principal sai da tela
  var barra = $("[data-barra]"), ctaPrincipal = $(".produto-acoes [data-cta]");
  if (barra && ctaPrincipal) {
    var checarBarra = function () {
      barra.classList.toggle("visivel", ctaPrincipal.getBoundingClientRect().bottom < 0);
    };
    window.addEventListener("scroll", checarBarra, { passive: true });
    checarBarra();
  }

  // Filtro do catálogo por etapa (aceita #etapa na URL)
  var grade = $("[data-grade]");
  if (grade) {
    var chips = $$(".chip");
    var filtrar = function (f, animar) {
      if (!chips.some(function (c) { return c.getAttribute("data-filtro") === f; })) f = "todas";
      chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c.getAttribute("data-filtro") === f)); });
      $$(".card", grade).forEach(function (c) { c.hidden = f !== "todas" && c.getAttribute("data-etapa") !== f; });
      var txt = $("[data-filtro-txt]"), ch = chips.filter(function (c) { return c.getAttribute("data-filtro") === f; })[0];
      if (txt) {
        if (!txt.hasAttribute("data-padrao")) txt.setAttribute("data-padrao", txt.textContent);
        txt.textContent = (ch && ch.getAttribute("data-texto")) || txt.getAttribute("data-padrao");
      }
      if (animar && !semMovimento && grade.animate) $$(".card:not([hidden])", grade).forEach(function (c, i) {
        c.classList.add("visto");
        c.animate([{ opacity: 0, transform: "translateY(16px)" }, { opacity: 1, transform: "none" }], { duration: 400, delay: i * 35, easing: "cubic-bezier(.2,.7,.2,1)", fill: "backwards" });
      });
    };
    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        var f = c.getAttribute("data-filtro");
        filtrar(f, true);
        history.replaceState(null, "", f === "todas" ? location.pathname : "#" + f);
      });
    });
    filtrar(location.hash.slice(1) || "todas");
  }

  // Vídeos do YouTube carregam só ao clicar (página mais leve)
  $$(".yt").forEach(function (b) {
    b.addEventListener("click", function () {
      var f = document.createElement("iframe");
      f.src = "https://www.youtube-nocookie.com/embed/" + b.getAttribute("data-yt") + "?autoplay=1&rel=0";
      f.allow = "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture";
      f.allowFullscreen = true;
      f.title = b.getAttribute("aria-label") || "Vídeo";
      b.replaceWith(wrap(f));
    });
  });
  function wrap(f) { var d = document.createElement("div"); d.className = "yt"; d.appendChild(f); return d; }

  // Formulário de contato: monta a mensagem e abre WhatsApp ou e-mail
  var form = $("[data-form-whats]");
  if (form) {
    var via = "whats";
    $$("button[type=submit]", form).forEach(function (b) {
      b.addEventListener("click", function () { via = b.getAttribute("data-via"); });
    });
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var d = new FormData(form), erro = $(".form-erro", form);
      var nome = (d.get("nome") || "").trim();
      if (!nome) { erro.hidden = false; form.nome.focus(); return; }
      erro.hidden = true;
      var linhas = ["Olá! Meu nome é " + nome + (d.get("cidade") ? ", de " + d.get("cidade") : "") + "."];
      if (d.get("produto")) linhas.push("Tenho interesse em: " + d.get("produto") + ".");
      if ((d.get("msg") || "").trim()) linhas.push(d.get("msg").trim());
      var txt = linhas.join("\n");
      if (via === "email") {
        location.href = "mailto:guajuvira@guajuvira.com.br?subject=" + encodeURIComponent("Contato pelo site") + "&body=" + encodeURIComponent(txt);
      } else {
        window.open("https://wa.me/5551980231956?text=" + encodeURIComponent(txt), "_blank", "noopener");
      }
    });
  }

  // ---------- versão 2 ----------
  var podeAnimar = !(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

  // Barra de progresso de leitura no cabeçalho
  var topoEl = $(".topo");
  if (topoEl) {
    var prog = function () {
      var h = document.documentElement.scrollHeight - innerHeight;
      topoEl.style.setProperty("--prog", h > 0 ? Math.min(1, scrollY / h).toFixed(4) : 0);
    };
    addEventListener("scroll", prog, { passive: true }); prog();
  }

  // Cards: foto inclina seguindo o mouse
  if (podeAnimar && matchMedia("(hover: hover)").matches) {
    $$(".card").forEach(function (c) {
      c.addEventListener("pointermove", function (ev) {
        var r = c.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
        c.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
        c.style.setProperty("--my", (y * 100).toFixed(1) + "%");
        c.style.setProperty("--ry", ((x - .5) * 14).toFixed(2) + "deg");
        c.style.setProperty("--rx", ((.5 - y) * 10).toFixed(2) + "deg");
      });
      c.addEventListener("pointerleave", function () {
        c.style.setProperty("--rx", "0deg"); c.style.setProperty("--ry", "0deg");
      });
    });
  }

  // Efeito por máquina no topo da home:
  //   faiscas -> lixadeiras (saem do ponto onde a peça encosta na lixa)
  //   brasas  -> forja e forno (calor subindo)
  //   nada    -> prensa, banheira
  var palco = $(".hero-palco"), tela = $(".faiscas");
  if (palco && tela && podeAnimar && tela.getContext) {
    var ctx = tela.getContext("2d"), dpr = Math.min(devicePixelRatio || 1, 2), W = 0, H = 0;
    var parts = [], rodando = false, visivel = true, t = 0, cfg = null, ultimo = null;
    var medir = function () {
      var r = palco.getBoundingClientRect(); W = r.width; H = r.height;
      tela.width = W * dpr; tela.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    // área real da foto dentro do <img> (object-fit: contain deixa sobra nas laterais)
    var lerSlide = function () {
      var s = $(".slide.ativo", palco), im = s && $("img", s);
      if (!s || !im || !im.naturalWidth) return null;
      var ef = s.getAttribute("data-efeito"); if (!ef) return { ef: "" };
      var v = (s.getAttribute("data-fx") || "").split(",").map(parseFloat);
      var r = im.getBoundingClientRect(), pr = palco.getBoundingClientRect();
      var k = Math.min(r.width / im.naturalWidth, r.height / im.naturalHeight);
      var cw = im.naturalWidth * k, ch = im.naturalHeight * k;
      var L = r.left - pr.left + (r.width - cw) / 2, T = r.top - pr.top + (r.height - ch) / 2;
      if (ef === "faiscas") return { ef: ef, x: L + cw * v[0], y: T + ch * v[1], dir: v[2] || -1, esc: Math.max(.55, Math.min(1, cw / 560)) };
      return { ef: ef, x0: L + cw * v[0], x1: L + cw * v[1], y: T + ch * v[2], esc: Math.max(.6, Math.min(1, cw / 560)) };
    };
    var faiscas = function (n) {
      for (var i = 0; i < n; i++) {
        var a = Math.PI * (0.52 + Math.random() * 0.45);   // de reto para baixo até quase horizontal
        if (cfg.dir > 0) a = Math.PI - a;
        var v = (5 + Math.random() * 9) * cfg.esc;
        parts.push({ tipo: 0, x: cfg.x, y: cfg.y, px: cfg.x, py: cfg.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1.2,
                     vida: 0, max: 22 + Math.random() * 40, h: 26 + Math.random() * 24, w: (1 + Math.random() * 1.3) * cfg.esc });
      }
    };
    var brasas = function (n) {
      for (var i = 0; i < n; i++) {
        var x = cfg.x0 + Math.random() * (cfg.x1 - cfg.x0);
        parts.push({ tipo: 1, x: x, y: cfg.y + Math.random() * 6, vx: (Math.random() - .5) * .4, vy: -(.5 + Math.random() * 1.1) * cfg.esc,
                     vida: 0, max: 70 + Math.random() * 90, h: 12 + Math.random() * 26, r: (1 + Math.random() * 1.8) * cfg.esc, fase: Math.random() * 6.3 });
      }
    };
    var quadro = function () {
      if (!rodando) return;
      t++;
      var sa = $(".slide.ativo", palco);
      if (sa !== ultimo || t % 30 === 1) { ultimo = sa; cfg = lerSlide(); }
      if (cfg && cfg.ef === "faiscas") faiscas(t % 80 < 24 ? 8 : 2);          // jorro com rajadas
      else if (cfg && cfg.ef === "brasas" && t % 3 === 0) brasas(t % 120 < 40 ? 3 : 1);
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i]; p.vida++;
        var k = 1 - p.vida / p.max;
        if (k <= 0 || p.y > H + 20 || p.y < -20) { parts.splice(i, 1); continue; }
        if (p.tipo === 0) {
          p.px = p.x; p.py = p.y;
          p.vy += 0.24; p.vx *= 0.985; p.x += p.vx; p.y += p.vy;
          ctx.strokeStyle = "hsla(" + p.h + ",100%," + (55 + k * 30) + "%," + k + ")";
          ctx.lineWidth = p.w;
          ctx.beginPath(); ctx.moveTo(p.px - p.vx * 1.6, p.py - p.vy * 1.6); ctx.lineTo(p.x, p.y); ctx.stroke();
        } else {
          p.x += p.vx + Math.sin(p.vida * .06 + p.fase) * .35; p.y += p.vy;
          var al = Math.min(1, p.vida / 12) * k;
          var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
          g.addColorStop(0, "hsla(" + p.h + ",100%,70%," + al + ")");
          g.addColorStop(.35, "hsla(" + p.h + ",100%,50%," + al * .5 + ")");
          g.addColorStop(1, "hsla(" + p.h + ",100%,40%,0)");
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, 6.3); ctx.fill();
        }
      }
      if (parts.length > 900) parts.splice(0, parts.length - 900);
      requestAnimationFrame(quadro);
    };
    var ligar = function () {
      var deve = visivel && !document.hidden;
      if (deve && !rodando) { rodando = true; requestAnimationFrame(quadro); }
      if (!deve) rodando = false;
    };
    medir(); addEventListener("resize", medir);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) { visivel = e[0].isIntersecting; ligar(); }).observe(palco);
    }
    document.addEventListener("visibilitychange", ligar);
    setTimeout(ligar, 900); // começa depois da entrada da página
  }
})();
