/* Blog em Markdown — lê posts/posts.json e cada posts/<slug>.md.
   Renderiza a lista de artigos e a página de artigo (article.html?post=slug). */
(function () {
  var MONTHS = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];

  function fmtDate(iso) {
    var p = (iso || '').split('-');
    if (p.length === 3) return parseInt(p[2], 10) + ' de ' + MONTHS[parseInt(p[1], 10) - 1] + ' de ' + p[0];
    return iso || '';
  }
  function readingTime(body) {
    var w = body.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(w / 200));
  }
  function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function parseFrontMatter(text) {
    text = text.replace(/^﻿/, '');
    var m = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
    var meta = {}, body = text;
    if (m) {
      m[1].split('\n').forEach(function (line) {
        var i = line.indexOf(':');
        if (i > -1) meta[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
      });
      body = m[2];
    }
    return { meta: meta, body: body };
  }

  function inline(s) {
    s = esc(s);
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
    s = s.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    return s;
  }
  function mdToHtml(body) {
    var out = [], para = [], list = [];
    function flushP() { if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; } }
    function flushL() { if (list.length) { out.push('<ul>' + list.map(function (x) { return '<li>' + inline(x) + '</li>'; }).join('') + '</ul>'); list = []; } }
    body.split('\n').forEach(function (raw) {
      var line = raw.replace(/\s+$/, '');
      if (!line.trim()) { flushP(); flushL(); return; }
      if (line.indexOf('## ') === 0) { flushP(); flushL(); out.push('<h2>' + inline(line.slice(3).trim()) + '</h2>'); }
      else if (line.indexOf('> ') === 0) { flushP(); flushL(); out.push('<blockquote>' + inline(line.slice(2).trim()) + '</blockquote>'); }
      else if (line.indexOf('- ') === 0) { flushP(); list.push(line.slice(2).trim()); }
      else { flushL(); para.push(line.trim()); }
    });
    flushP(); flushL();
    return out.join('\n');
  }

  function fetchText(url) { return fetch(url).then(function (r) { if (!r.ok) throw new Error(url); return r.text(); }); }

  function loadPosts() {
    return fetchText('posts/posts.json').then(function (t) {
      var files = JSON.parse(t);
      return Promise.all(files.map(function (fn) {
        return fetchText('posts/' + fn).then(function (txt) {
          var pf = parseFrontMatter(txt);
          return {
            slug: fn.replace(/\.md$/, ''), meta: pf.meta, body: pf.body,
            title: pf.meta.title || fn, tag: pf.meta.tag || 'Artigo',
            excerpt: pf.meta.excerpt || '', cover: pf.meta.cover || '',
            date: fmtDate(pf.meta.date), min: readingTime(pf.body)
          };
        });
      }));
    });
  }

  function thumb(p) {
    if (p.cover && /\.(png|jpe?g|webp|gif|svg)$/i.test(p.cover))
      return '<div class="thumb"><img src="' + p.cover + '" alt=""></div>';
    return '<div class="thumb">❧</div>';
  }
  function card(p) {
    return '<a class="post reveal in" href="article.html?post=' + p.slug + '">' + thumb(p) +
      '<div class="body"><div class="meta"><span class="tag">' + p.tag + '</span>' +
      '<span class="byline">Patrícia Kayo</span><span>' + p.date + ' · ' + p.min + ' min</span></div>' +
      '<h3>' + esc(p.title) + '</h3><p>' + esc(p.excerpt) + '</p>' +
      '<span class="more">Ler artigo →</span></div></a>';
  }

  function renderList() {
    var host = document.querySelector('[data-posts]');
    if (!host) return;
    var limit = parseInt(host.getAttribute('data-limit') || '0', 10);
    loadPosts().then(function (posts) {
      var items = limit ? posts.slice(0, limit) : posts;
      host.innerHTML = items.map(card).join('');
    }).catch(function () { host.innerHTML = '<p class="post-empty">Não foi possível carregar os artigos.</p>'; });
  }

  function renderArticle() {
    var host = document.querySelector('[data-article]');
    if (!host) return;
    var slug = new URLSearchParams(location.search).get('post');
    if (!slug) { host.innerHTML = '<p class="post-empty">Artigo não encontrado.</p>'; return; }
    fetchText('posts/' + slug + '.md').then(function (txt) {
      var pf = parseFrontMatter(txt), m = pf.meta;
      document.title = (m.title || 'Artigo') + ' | Patrícia Kayo';
      var fig = (m.cover && /\.(png|jpe?g|webp|gif|svg)$/i.test(m.cover))
        ? '<figure class="article-figure"><img src="' + m.cover + '" alt=""></figure>' : '';
      var lead = m.excerpt ? '<p class="article-lead">' + esc(m.excerpt) + '</p>' : '';
      host.innerHTML =
        '<section class="article-hero"><div class="wrap wrap--narrow">' +
        '<div class="breadcrumb"><a href="index.html">Início</a> · <a href="blog.html">Blog</a></div>' +
        '<span class="article-kicker">' + esc(m.tag || 'Artigo') + '</span>' +
        '<h1 class="article-title">' + esc(m.title || '') + '</h1>' +
        lead +
        '<div class="article-byline"><span>Por Patrícia Kayo</span><span class="dot"></span>' +
        '<span>' + fmtDate(m.date) + '</span><span class="dot"></span>' +
        '<span>' + readingTime(pf.body) + ' min de leitura</span></div>' +
        '</div></section>' +
        '<section class="section article-body-sec"><div class="wrap wrap--narrow">' +
        '<div class="article">' + fig + mdToHtml(pf.body) + '</div>' +
        '<div class="article-foot"><a href="blog.html" class="btn btn--ghost">← Voltar ao blog</a></div>' +
        '</div></section>';
    }).catch(function () { host.innerHTML = '<p class="post-empty">Artigo não encontrado.</p>'; });
  }

  renderList();
  renderArticle();
})();
