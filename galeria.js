/* ==========================================================
   LORDVERSO – galeria.js
   Linha do tempo das artes:
   1. As artes passam sozinhas (sem parar, em volta).
   2. Clicar numa arte abre ela em tamanho grande.

   Se o JavaScript não carregar, a linha do tempo continua
   funcionando do jeito normal: é só arrastar para o lado.
   ========================================================== */
(function () {
  'use strict';

  /* ---------- AJUSTES (mude aqui) ---------- */
  var VELOCIDADE = 35;   // pixels por segundo (maior = mais rápido)
  var SENTIDO = 1;       // 1 = anda de 2019 para 2025 | -1 = anda no sentido contrário

  var tempo = document.querySelector('.tempo');
  if (!tempo) return;

  var originais = Array.prototype.slice.call(tempo.children);
  var fotos = [];

  /* 1. Anota cada arte (ano, arquivo, descrição) */
  originais.forEach(function (marco) {
    var anoEl = marco.querySelector('.ano');
    var ano = anoEl ? anoEl.textContent : '';
    Array.prototype.forEach.call(marco.querySelectorAll('.arte-ano'), function (caixa) {
      var img = caixa.querySelector('img');
      if (!img) return;
      caixa.setAttribute('data-foto', fotos.length);
      fotos.push({ src: img.getAttribute('src'), alt: img.getAttribute('alt') || '', ano: ano });
    });
  });
  if (!fotos.length) return;

  /* 2. Cópias para a rolagem dar a volta sem pulo (escondidas de leitores de tela) */
  var copias = originais.map(function (marco) {
    var c = marco.cloneNode(true);
    c.setAttribute('aria-hidden', 'true');
    Array.prototype.forEach.call(c.querySelectorAll('img'), function (i) { i.setAttribute('alt', ''); });
    tempo.appendChild(c);
    return c;
  });

  /* 3. Deixa as artes originais acessíveis pelo teclado */
  originais.forEach(function (marco) {
    Array.prototype.forEach.call(marco.querySelectorAll('.arte-ano[data-foto]'), function (caixa) {
      var f = fotos[caixa.getAttribute('data-foto')];
      caixa.setAttribute('role', 'button');
      caixa.setAttribute('tabindex', '0');
      caixa.setAttribute('aria-label', 'Ampliar arte de ' + f.ano);
    });
  });


  /* ==========================================================
     AMPLIAR (lightbox)
     ========================================================== */
  var dlg = document.createElement('dialog');
  dlg.className = 'lightbox';
  dlg.setAttribute('aria-label', 'Arte ampliada');
  dlg.innerHTML =
    '<button type="button" class="lb-fechar" aria-label="Fechar">\u2715</button>' +
    '<button type="button" class="lb-seta lb-ant" aria-label="Arte anterior">\u2039</button>' +
    '<figure class="lb-fig"><img alt=""><figcaption></figcaption></figure>' +
    '<button type="button" class="lb-seta lb-prox" aria-label="Próxima arte">\u203A</button>';
  document.body.appendChild(dlg);

  var lbImg = dlg.querySelector('img');
  var lbLegenda = dlg.querySelector('figcaption');
  var atual = 0;
  var aberto = false;
  var quemAbriu = null;

  function mostrar(i) {
    atual = (i + fotos.length) % fotos.length;
    var f = fotos[atual];
    lbImg.src = f.src;
    lbImg.alt = f.alt;
    lbLegenda.textContent = f.ano;
  }

  function abrir(i, origem) {
    quemAbriu = origem || null;
    mostrar(i);
    if (typeof dlg.showModal === 'function') dlg.showModal();
    else dlg.setAttribute('open', '');
    aberto = true;
    document.body.classList.add('lb-aberto');
  }

  dlg.addEventListener('close', function () {
    aberto = false;
    document.body.classList.remove('lb-aberto');
    lbImg.removeAttribute('src');
    if (quemAbriu && quemAbriu.focus) quemAbriu.focus({ preventScroll: true });
  });

  dlg.addEventListener('click', function (e) {
    if (e.target.closest('.lb-ant')) { mostrar(atual - 1); return; }
    if (e.target.closest('.lb-prox')) { mostrar(atual + 1); return; }
    if (e.target.tagName === 'IMG') return;       // clicar na arte não fecha
    dlg.close();                                  // fundo ou botão ✕ fecha
  });

  dlg.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { mostrar(atual - 1); e.preventDefault(); }
    if (e.key === 'ArrowRight') { mostrar(atual + 1); e.preventDefault(); }
  });

  tempo.addEventListener('click', function (e) {
    var caixa = e.target.closest('.arte-ano[data-foto]');
    if (caixa) abrir(parseInt(caixa.getAttribute('data-foto'), 10), caixa);
  });

  tempo.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var caixa = e.target.closest('.arte-ano[data-foto]');
    if (caixa) { e.preventDefault(); abrir(parseInt(caixa.getAttribute('data-foto'), 10), caixa); }
  });


  /* ==========================================================
     ROLAGEM AUTOMÁTICA
     Pausa quando: o mouse está em cima, a pessoa toca/rola/usa o teclado,
     uma arte está ampliada, a aba está escondida ou a seção está fora da tela.
     ========================================================== */
  var reduz = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduz) return;                      // quem pede menos movimento não recebe a animação

  tempo.classList.add('auto');

  var volta = 0;                          // largura de um "giro" completo
  var pos = 0;                            // posição com casas decimais
  var colocado = 0;                       // última posição que o código definiu
  var ultimo = 0;
  var pausado = false;
  var emFoco = false;
  var naTela = true;
  var timer = null;

  function medir() {
    volta = copias[0].offsetLeft - originais[0].offsetLeft;
  }

  function pausarPor(ms) {
    pausado = true;
    clearTimeout(timer);
    timer = setTimeout(function () { pausado = false; }, ms);
  }

  tempo.addEventListener('pointerenter', function (e) {
    if (e.pointerType === 'mouse') { clearTimeout(timer); pausado = true; }
  });
  tempo.addEventListener('pointerleave', function (e) {
    if (e.pointerType === 'mouse') pausarPor(600);
  });
  tempo.addEventListener('touchstart', function () { pausarPor(3000); }, { passive: true });
  tempo.addEventListener('wheel', function () { pausarPor(2500); }, { passive: true });
  tempo.addEventListener('focusin', function () { emFoco = true; });
  tempo.addEventListener('focusout', function () { emFoco = false; });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entradas) {
      naTela = entradas[0].isIntersecting;
    }).observe(tempo);
  }

  window.addEventListener('resize', medir);
  medir();
  if (SENTIDO < 0) { pos = volta; tempo.scrollLeft = pos; colocado = tempo.scrollLeft; }

  function passo(t) {
    if (!ultimo) ultimo = t;
    var dt = Math.min(t - ultimo, 100) / 1000;
    ultimo = t;

    /* se a pessoa mexeu na rolagem sozinha, o código respeita e espera um pouco */
    if (Math.abs(tempo.scrollLeft - colocado) > 2) {
      pos = tempo.scrollLeft;
      colocado = tempo.scrollLeft;
      pausarPor(2500);
    }

    if (!pausado && !aberto && !emFoco && naTela && !document.hidden && volta > 0) {
      pos += SENTIDO * VELOCIDADE * dt;
      if (pos >= volta) pos -= volta;
      if (pos < 0) pos += volta;
      tempo.scrollLeft = pos;
      colocado = tempo.scrollLeft;
    }
    requestAnimationFrame(passo);
  }
  requestAnimationFrame(passo);
})();
