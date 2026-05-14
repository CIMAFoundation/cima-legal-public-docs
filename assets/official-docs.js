(function () {
  var statusEl = document.getElementById('status');
  var rowsEl = document.getElementById('rows');
  var lineFilterEl = document.getElementById('filter-line');
  var langFilterEl = document.getElementById('filter-lang');
  var allRows = [];

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

  function formatTimestamp(value) {
    var date = new Date(String(value || ''));
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString('it-IT');
  }

  function sortRows(rows) {
    return rows.slice().sort(function (a, b) {
      var lineCmp = String(a.line || '').localeCompare(String(b.line || ''));
      if (lineCmp !== 0) return lineCmp;
      var langCmp = String(a.lang || '').localeCompare(String(b.lang || ''));
      if (langCmp !== 0) return langCmp;
      return String(a.docType || '').localeCompare(String(b.docType || ''));
    });
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

  function uniqueSorted(values) {
    return Array.from(new Set(values)).sort(function (a, b) {
      return String(a).localeCompare(String(b));
    });
  }

  function setSelectOptions(selectEl, values) {
    var current = selectEl.value;
    selectEl.innerHTML = '';
    var allOpt = document.createElement('option');
    allOpt.value = '';
    allOpt.textContent = 'tutte';
    selectEl.appendChild(allOpt);
    values.forEach(function (value) {
      var option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      selectEl.appendChild(option);
    });
    if (current && values.indexOf(current) !== -1) {
      selectEl.value = current;
    }
  }

  function applyFilters() {
    var selectedLine = String(lineFilterEl.value || '');
    var selectedLang = String(langFilterEl.value || '');
    var filtered = allRows.filter(function (row) {
      if (selectedLine && String(row.line || '-') !== selectedLine) return false;
      if (selectedLang && String(row.lang || '-') !== selectedLang) return false;
      return true;
    });
    renderRows(filtered);
    setStatus('Filtro attivo. Risultati: ' + filtered.length + ' / ' + allRows.length + '.');
  }

  fetch('assets/latest-index.json?t=' + Date.now())
    .then(function (res) {
      if (!res.ok) {
        throw new Error('Indice non raggiungibile (' + res.status + ')');
      }
      return res.json();
    })
    .then(function (data) {
      allRows = Array.isArray(data.rows)
        ? sortRows(
            data.rows.filter(function (row) {
              return !row.deletedAt;
            })
          )
        : [];
      var lines = uniqueSorted(
        allRows.map(function (row) {
          return String(row.line || '-');
        })
      );
      var langs = uniqueSorted(
        allRows.map(function (row) {
          return String(row.lang || '-');
        })
      );
      setSelectOptions(lineFilterEl, lines);
      setSelectOptions(langFilterEl, langs);
      renderRows(allRows);
      setStatus(
        'Indice caricato. Documenti attivi: ' +
          allRows.length +
          '. Aggiornato: ' +
          formatTimestamp(data && data.generatedAt)
      );
    })
    .catch(function (error) {
      renderRows([]);
      setStatus('Errore caricamento indice: ' + (error && error.message ? error.message : 'sconosciuto'), true);
    });

  lineFilterEl.addEventListener('change', applyFilters);
  langFilterEl.addEventListener('change', applyFilters);
})();
