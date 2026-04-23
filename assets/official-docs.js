(function () {
  var statusEl = document.getElementById('status');
  var rowsEl = document.getElementById('rows');

  function formatVersion(version) {
    return 'v' + String(version).padStart(3, '0');
  }

  function setStatus(text, isError) {
    statusEl.textContent = text;
    statusEl.classList.toggle('error', Boolean(isError));
  }

  function buildRows(latest) {
    var rows = [];

    Object.keys(latest || {}).forEach(function (platform) {
      var byType = latest[platform] || {};
      Object.keys(byType).forEach(function (docType) {
        var byLang = byType[docType] || {};
        Object.keys(byLang).forEach(function (lang) {
          var entry = byLang[lang] || {};
          if (entry.deletedAt) return;

          rows.push({
            line: entry.line || '-',
            platform: platform,
            docType: docType,
            lang: lang,
            version: Number(entry.version || 0),
            effectiveDate: entry.effectiveDate || '-',
            publicUrl: entry.url || entry.downloadUrl || '#',
            downloadFileName: entry.downloadFileName || entry.originalFileName || entry.id || 'Apri PDF'
          });
        });
      });
    });

    rows.sort(function (a, b) {
      var lineCmp = a.line.localeCompare(b.line);
      if (lineCmp !== 0) return lineCmp;
      var platformCmp = a.platform.localeCompare(b.platform);
      if (platformCmp !== 0) return platformCmp;
      var typeCmp = a.docType.localeCompare(b.docType);
      if (typeCmp !== 0) return typeCmp;
      return a.lang.localeCompare(b.lang);
    });

    return rows;
  }

  function renderRows(rows) {
    rowsEl.innerHTML = '';

    if (!rows.length) {
      var tr = document.createElement('tr');
      var td = document.createElement('td');
      td.colSpan = 7;
      td.className = 'empty';
      td.textContent = 'Nessun documento ufficiale disponibile.';
      tr.appendChild(td);
      rowsEl.appendChild(tr);
      return;
    }

    rows.forEach(function (row) {
      var tr = document.createElement('tr');

      var cols = [
        row.line,
        row.platform,
        row.docType,
        row.lang,
        formatVersion(row.version),
        row.effectiveDate
      ];

      cols.forEach(function (value) {
        var td = document.createElement('td');
        td.textContent = value;
        tr.appendChild(td);
      });

      var pdfTd = document.createElement('td');
      var link = document.createElement('a');
      link.href = row.publicUrl;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = row.downloadFileName;
      pdfTd.appendChild(link);
      tr.appendChild(pdfTd);

      rowsEl.appendChild(tr);
    });
  }

  fetch('legal-docs/manifests/latest.json?t=' + Date.now())
    .then(function (res) {
      if (!res.ok) {
        throw new Error('Manifest non raggiungibile (' + res.status + ')');
      }
      return res.json();
    })
    .then(function (data) {
      var rows = buildRows(data.latest || {});
      renderRows(rows);
      setStatus('Manifest caricato. Documenti attivi: ' + rows.length + '.');
    })
    .catch(function (error) {
      renderRows([]);
      setStatus('Errore caricamento manifest: ' + (error && error.message ? error.message : 'sconosciuto'), true);
    });
})();

