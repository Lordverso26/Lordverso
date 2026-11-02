/* ==========================================================
   LORDVERSO – menu.js
   Marca no menu (azul) a seção que está na tela enquanto você rola.
   Se o JavaScript não carregar, o menu continua funcionando
   normalmente: só não muda a cor do item ativo.
   ========================================================== */
(function () {
  'use strict';

  var links = Array.prototype.slice.call(document.querySelectorAll('.menu a[href^="#"]'));
  if (!links.length || !('IntersectionObserver' in window)) return;

  var secoes = links.map(function (a) {
    return document.getElementById(a.getAttribute('href').slice(1));
  });

  function marcar(id) {
    links.forEach(function (a) {
      var ativo = a.getAttribute('href') === '#' + id;
      a.classList.toggle('ativo', ativo);
      if (ativo) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      if (ativo && a.parentNode) {            // no celular, leva o item ativo para a parte visível do menu
        a.parentNode.scrollLeft = a.offsetLeft - (a.parentNode.clientWidth - a.offsetWidth) / 2;
      }
    });
  }

  /* a faixa de leitura fica um pouco abaixo do cabeçalho */
  var visiveis = {};
  var obs = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (e) { visiveis[e.target.id] = e.isIntersecting; });
    for (var i = 0; i < secoes.length; i++) {
      if (secoes[i] && visiveis[secoes[i].id]) { marcar(secoes[i].id); return; }
    }
  }, { rootMargin: '-90px 0px -60% 0px' });

  secoes.forEach(function (s) { if (s) obs.observe(s); });
})();
