(function () {
  var statusEl = document.getElementById('status');
  var rowsEl = document.getElementById('rows');

  function formatEffectiveDate(value) {
    var text = String(value || '');
    var match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return text || '-';
    return match[3] + '/' + match[2] + '/' + match[1];
  }

  function setStatus(text, isError) {
    statusEl.textContent = text;
    statusEl.classList.toggle('error', Boolean(isError));
  }

  function renderRows(rows) {
    rowsEl.innerHTML = '';

    if (!rows.length) {
      var tr = document.createElement('tr');
      var td = document.createElement('td');
      td.colSpan = 5;
      td.className = 'empty';
      td.textContent = 'Nessun documento disponibile.';
      tr.appendChild(td);
      rowsEl.appendChild(tr);
      return;
    }

    rows.forEach(function (row) {
      var tr = document.createElement('tr');
      var cols = [row.line || '-', row.docType || '-', row.lang || '-', formatEffectiveDate(row.effectiveDate)];

      cols.forEach(function (value) {
        var td = document.createElement('td');
        td.textContent = value;
        tr.appendChild(td);
      });

      var pdfTd = document.createElement('td');
      var link = document.createElement('a');
      link.href = row.publicUrl || '#';
      link.download = row.downloadFileName || null;
      link.textContent = row.downloadFileName || 'Apri PDF';
      pdfTd.appendChild(link);
      tr.appendChild(pdfTd);

      rowsEl.appendChild(tr);
    });
  }

  fetch('assets/latest-index.json?t=' + Date.now())
    .then(function (res) {
      if (!res.ok) {
        throw new Error('Indice non raggiungibile (' + res.status + ')');
      }
      return res.json();
    })
    .then(function (data) {
      var rows = Array.isArray(data.rows) ? data.rows : [];
      renderRows(rows);
      setStatus('Indice caricato. Documenti attivi: ' + rows.length + '.');
    })
    .catch(function (error) {
      renderRows([]);
      setStatus('Errore caricamento indice: ' + (error && error.message ? error.message : 'sconosciuto'), true);
    });
})();
