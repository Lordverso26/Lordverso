/* ==========================================================
   LORDVERSO – webtoons.js
   Lê os webtoons da pasta "webtoons":
     webtoons/webtoon-1/info.txt  + 01.jpg, 02.jpg, 03.jpg ...
     webtoons/webtoon-2/...       webtoons/webtoon-3/...
   - index.html   : monta as 3 capinhas da seção Webtoons
   - webtoon.html : mostra as páginas uma embaixo da outra, para ler rolando

   Se algo falhar (pasta faltando, sem JavaScript), os cartões de reserva
   do HTML continuam na tela e o site não quebra.
   ========================================================== */
(function () {
  'use strict';

  var PASTA = 'webtoons/';
  var TOTAL = 3;           // quantos webtoons o site procura
  var MAX_PAGINAS = 150;   // limite de segurança ao descobrir páginas sozinho

  function baseDe(n) { return PASTA + 'webtoon-' + n + '/'; }

  function el(tag, classe, texto) {
    var e = document.createElement(tag);
    if (classe) e.className = classe;
    if (texto) e.textContent = texto;      // textContent: nunca interpreta HTML
    return e;
  }

  function doisDigitos(i) { return (i < 10 ? '0' : '') + i; }

  /* info.txt: linhas "chave: valor" */
  function lerInfo(texto) {
    var meta = {};
    String(texto).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').split('\n').forEach(function (linha) {
      var m = linha.match(/^\s*([A-Za-zÀ-ÿ]+)\s*:\s*(.*)$/);
      if (m && !(m[1].toLowerCase() in meta)) meta[m[1].toLowerCase()] = m[2].trim();
    });
    return meta;
  }

  function carregar(n) {
    return fetch(baseDe(n) + 'info.txt', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('sem info'); return r.text(); })
      .then(function (t) {
        var meta = lerInfo(t);
        if (!meta.titulo) return null;
        meta.formato = (meta.formato || 'jpg').replace(/^\./, '').toLowerCase();
        return meta;
      })
      .catch(function () { return null; });
  }

  function existe(url) {
    return fetch(url, { method: 'HEAD', cache: 'no-cache' })
      .then(function (r) { return r.ok; })
      .catch(function () { return false; });
  }

  /* Lista as páginas: usa "paginas:" do info.txt ou procura 01, 02, 03... até faltar uma */
  function listarPaginas(n, meta) {
    var base = baseDe(n), fmt = meta.formato, lista = [];
    var qtd = parseInt(meta.paginas, 10);

    if (qtd > 0) {
      for (var i = 1; i <= Math.min(qtd, MAX_PAGINAS); i++) lista.push(base + doisDigitos(i) + '.' + fmt);
      return Promise.resolve(lista);
    }
    function proxima(i) {
      if (i > MAX_PAGINAS) return Promise.resolve(lista);
      var url = base + doisDigitos(i) + '.' + fmt;
      return existe(url).then(function (ok) {
        if (!ok) return lista;
        lista.push(url);
        return proxima(i + 1);
      });
    }
    return proxima(1);
  }

  /* ---------- index.html: capinhas ---------- */
  function montarCapa(meta, n) {
    var tipo = meta ? 'wt' : 'wt breve';
    var raiz = meta ? el('a', tipo) : el('div', tipo);
    var capa = el('div', 'wt-capa');
    capa.style.setProperty('--h', String(200 + n * 70));

    if (meta) {
      raiz.href = 'webtoon.html?n=' + n;
      raiz.setAttribute('aria-label', 'Ler ' + meta.titulo);
      var img = el('img');
      img.src = baseDe(n) + (meta.capa || ('01.' + meta.formato));
      img.alt = 'Capa de ' + meta.titulo;
      img.loading = 'lazy';
      img.addEventListener('error', function () { img.remove(); });  // sem imagem: fica a cor de fundo
      capa.appendChild(img);
      capa.appendChild(el('span', 'poster-tag', 'Webtoon'));
    } else {
      raiz.setAttribute('aria-label', 'Webtoon, em breve');
      capa.appendChild(el('span', 'poster-tag', 'Webtoon'));
    }
    raiz.appendChild(capa);

    raiz.appendChild(el('h3', '', meta ? meta.titulo : 'Em breve'));
    var sub = meta ? [meta.genero, meta.frase].filter(Boolean).join(' – ') : 'Um novo webtoon está a caminho.';
    raiz.appendChild(el('p', '', sub));
    return raiz;
  }

  var grade = document.getElementById('lista-webtoons');
  if (grade && window.fetch) {
    var numeros = [];
    for (var n = 1; n <= TOTAL; n++) numeros.push(n);
    Promise.all(numeros.map(carregar)).then(function (metas) {
      if (!metas.some(function (m) { return m; })) return;   // mantém os cartões de reserva
      grade.textContent = '';
      metas.forEach(function (m, i) { grade.appendChild(montarCapa(m, i + 1)); });
    });
  }

  /* ---------- webtoon.html: leitura ---------- */
  var leitor = document.getElementById('leitor-wt');
  if (leitor) {
    var pedido = parseInt(new URLSearchParams(location.search).get('n'), 10);
    var num = (pedido >= 1 && pedido <= TOTAL) ? pedido : 1;

    function erro() {
      leitor.textContent = '';
      leitor.appendChild(el('h1', '', 'Webtoon não encontrado'));
      leitor.appendChild(el('p', 'leitor-erro', 'Não consegui abrir este webtoon agora. Tente de novo mais tarde ou volte para a lista.'));
    }

    carregar(num).then(function (meta) {
      if (!meta) return erro();
      return listarPaginas(num, meta).then(function (paginas) {
        if (!paginas.length) return erro();

        leitor.textContent = '';
        document.title = meta.titulo + ' – Lordverso';

        var topo = el('header', 'wt-topo');
        topo.appendChild(el('h1', '', meta.titulo));
        if (meta.genero) topo.appendChild(el('p', 'leitor-genero', meta.genero));
        if (meta.aviso) topo.appendChild(el('p', 'leitor-aviso', meta.aviso));
        leitor.appendChild(topo);

        var tira = el('div', 'wt-paginas');
        paginas.forEach(function (url, i) {
          var img = el('img', 'wt-pag');
          img.src = url;
          img.alt = meta.titulo + ', página ' + (i + 1);
          img.loading = i < 2 ? 'eager' : 'lazy';
          img.decoding = 'async';
          tira.appendChild(img);
        });
        leitor.appendChild(tira);

        var fim = el('div', 'wt-fim');
        var voltar = el('a', 'btn vazio', '← Voltar aos webtoons');
        voltar.href = 'index.html#webtoons';
        fim.appendChild(voltar);
        leitor.appendChild(fim);
      });
    }).catch(erro);
  }
})();
