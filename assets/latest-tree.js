(function () {
  var siteLinks = (window && window.CimaSiteLinks) || {};
  var statusEl = document.getElementById('status');
  var treeEl = document.getElementById('tree');

  function populateConfigLinks() {
    var links = document.querySelectorAll('[data-link-key]');
    links.forEach(function (linkEl) {
      var key = String(linkEl.getAttribute('data-link-key') || '');
      var href = String(siteLinks[key] || '').trim();
      if (href) {
        linkEl.setAttribute('href', href);
      } else {
        linkEl.remove();
      }
    });
  }

  function setStatus(text) {
    statusEl.textContent = text;
  }

  function buildTree(rows) {
    var root = {};
    rows.forEach(function (row) {
      var line = String(row.line || '-');
      var lang = String(row.lang || '-');
      if (!root[line]) root[line] = {};
      if (!root[line][lang]) root[line][lang] = [];
      root[line][lang].push(row);
    });
    return root;
  }

  function render(rows) {
    treeEl.innerHTML = '';
    if (!rows.length) {
      treeEl.textContent = 'Nessun file in latest.';
      return;
    }

    var tree = buildTree(rows);
    Object.keys(tree)
      .sort()
      .forEach(function (line) {
        var lineDetails = document.createElement('details');
        lineDetails.open = true;
        var lineSummary = document.createElement('summary');
        lineSummary.textContent = line;
        lineDetails.appendChild(lineSummary);

        Object.keys(tree[line])
          .sort()
          .forEach(function (lang) {
            var langDetails = document.createElement('details');
            langDetails.open = true;
            var langSummary = document.createElement('summary');
            langSummary.textContent = lang;
            langDetails.appendChild(langSummary);

            var list = document.createElement('ul');
            tree[line][lang]
              .slice()
              .sort(function (a, b) {
                return String(a.docType || '').localeCompare(String(b.docType || ''));
              })
              .forEach(function (row) {
                var li = document.createElement('li');
                var link = document.createElement('a');
                link.href = row.publicUrl || '#';
                link.textContent = String(row.downloadFileName || row.docType || 'file.pdf');
                link.target = '_blank';
                link.rel = 'noopener';
                li.appendChild(link);

                var meta = document.createElement('span');
                meta.className = 'meta';
                meta.textContent = '(' + String(row.effectiveDate || '-') + ')';
                li.appendChild(meta);
                list.appendChild(li);
              });
            langDetails.appendChild(list);
            lineDetails.appendChild(langDetails);
          });
        treeEl.appendChild(lineDetails);
      });
  }

  fetch('../assets/latest-index.json?t=' + Date.now())
    .then(function (res) {
      if (!res.ok) throw new Error('Indice non raggiungibile (' + res.status + ')');
      return res.json();
    })
    .then(function (data) {
      var rows = Array.isArray(data.rows)
        ? data.rows.filter(function (row) {
            return !row.deletedAt;
          })
        : [];
      render(rows);
      setStatus('Tree caricato. File: ' + rows.length + '.');
    })
    .catch(function (err) {
      setStatus('Errore caricamento: ' + (err && err.message ? err.message : 'sconosciuto'));
      treeEl.textContent = 'Impossibile caricare tree.';
    });
  populateConfigLinks();
})();
