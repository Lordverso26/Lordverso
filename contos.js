/* ==========================================================
   LORDVERSO – contos.js
   Lê os contos da pasta "meus contos" (conto-1.txt, conto-2.txt, conto-3.txt).
   - index.html : monta os cards da seção Contos
   - conto.html : mostra o conto inteiro para leitura

   Se algo der errado (arquivo faltando, texto com erro, sem internet),
   o site não quebra: os cards de reserva do HTML continuam na tela.
   ========================================================== */
(function () {
  'use strict';

  var PASTA = 'meus%20contos/';   // o espaço do nome da pasta vira %20
  var TOTAL = 3;                  // quantos contos o site procura

  /* Separa os dados do topo (titulo:, genero:...) do texto do conto */
  function ler(texto) {
    texto = String(texto).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
    var linhas = texto.split('\n');
    var meta = {};
    var corte = -1;

    for (var i = 0; i < linhas.length; i++) {
      if (linhas[i].trim() === '---') { corte = i; break; }
    }
    if (corte >= 0) {
      for (var j = 0; j < corte; j++) {
        var m = linhas[j].match(/^\s*([A-Za-zÀ-ÿ]+)\s*:\s*(.*)$/);
        if (m) meta[m[1].toLowerCase()] = m[2].trim();
      }
    }
    return {
      meta: meta,
      corpo: linhas.slice(corte + 1).join('\n').trim()
    };
  }

  /* Busca um conto; se não existir ou der erro, devolve null */
  function carregar(n) {
    return fetch(PASTA + 'conto-' + n + '.txt', { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('sem arquivo');
        return r.text();
      })
      .then(function (t) {
        var c = ler(t);
        if (!c.corpo) return null;
        return c;
      })
      .catch(function () { return null; });
  }

  function el(tag, classe, texto) {
    var e = document.createElement(tag);
    if (classe) e.className = classe;
    if (texto) e.textContent = texto;   // textContent: nunca interpreta HTML
    return e;
  }

  /* ---------- index.html: cards ---------- */
  function montarCard(c, n) {
    var card = el('article', c ? 'conto' : 'conto breve');
    card.appendChild(el('span', 'aspas', '\u201C')).setAttribute('aria-hidden', 'true');

    var texto = el('div');
    if (c) {
      texto.appendChild(el('h3', '', c.meta.titulo || 'Sem título'));
      var linha = [c.meta.genero, c.meta.frase].filter(Boolean).join(' – ');
      if (linha) texto.appendChild(el('p', '', linha));
    } else {
      texto.appendChild(el('h3', '', 'Em breve'));
      texto.appendChild(el('p', '', 'Um novo conto está a caminho.'));
    }
    card.appendChild(texto);

    if (c) {
      var a = el('a', 'btn vazio pequeno', 'Ler');
      a.href = 'conto.html?n=' + n;
      card.appendChild(a);
    } else {
      card.appendChild(el('span', 'conto-breve', 'Em breve'));
    }
    return card;
  }

  var lista = document.getElementById('lista-contos');
  if (lista && window.fetch) {
    var numeros = [];
    for (var n = 1; n <= TOTAL; n++) numeros.push(n);

    Promise.all(numeros.map(carregar)).then(function (contos) {
      var algum = contos.some(function (c) { return c; });
      if (!algum) return;               // mantém os cards de reserva
      lista.textContent = '';
      contos.forEach(function (c, i) { lista.appendChild(montarCard(c, i + 1)); });
    });
  }

  /* ---------- conto.html: leitura ---------- */
  var leitor = document.getElementById('leitor');
  if (leitor) {
    var pedido = parseInt(new URLSearchParams(location.search).get('n'), 10);
    var num = (pedido >= 1 && pedido <= TOTAL) ? pedido : 1;

    carregar(num).then(function (c) {
      leitor.textContent = '';

      if (!c) {
        leitor.appendChild(el('h1', '', 'Conto não encontrado'));
        leitor.appendChild(el('p', 'leitor-erro', 'Não consegui abrir este conto agora. Tente de novo mais tarde ou volte para a lista.'));
        return;
      }

      var titulo = c.meta.titulo || 'Sem título';
      document.title = titulo + ' – Lordverso';

      leitor.appendChild(el('h1', '', titulo));
      if (c.meta.genero) leitor.appendChild(el('p', 'leitor-genero', c.meta.genero));
      if (c.meta.autoria) leitor.appendChild(el('p', 'leitor-autoria', c.meta.autoria));
      if (c.meta.dedicatoria) leitor.appendChild(el('p', 'leitor-dedic', c.meta.dedicatoria));
      if (c.meta.aviso) leitor.appendChild(el('p', 'leitor-aviso', c.meta.aviso));

      var corpo = el('div', 'leitor-texto');
      c.corpo.split(/\n\s*\n/).forEach(function (bloco) {
        bloco = bloco.trim();
        if (!bloco) return;
        if (/^(\*\s*){3,}$/.test(bloco)) {            // * * * * *  -> separador
          corpo.appendChild(el('hr'));
        } else if (/^##\s+/.test(bloco)) {            // ## Subtítulo
          corpo.appendChild(el('h2', '', bloco.replace(/^##\s+/, '')));
        } else {
          corpo.appendChild(el('p', '', bloco));
        }
      });
      leitor.appendChild(corpo);
    });
  }
})();
