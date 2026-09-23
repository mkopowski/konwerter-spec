///////////////////////////////////////////////////////////////////////////////
////////////////////////// AKTUALIZACJA SPECYFIKACJI //////////////////////////
///////////////////////////////////////////////////////////////////////////////

document.getElementById('convertBtn').addEventListener('click', function () {
    const input = document.getElementById('input').value;
    if (!input.trim()) {
        alert('Wklej najpierw HTML tabeli.');
        return;
    }

    const temp = document.createElement('div');
    temp.innerHTML = input;

    let wrapper = temp.querySelector('div.table-responsive');
    let table = wrapper ? wrapper.querySelector('table.table') : temp.querySelector('table.table');
    if (!table) {
        alert('Nie znaleziono tabeli z klasą table.');
        return;
    }

    // USUWANIE scope="row" z nagłówków
    table.querySelectorAll('th[scope="row"]').forEach(th => {
        th.removeAttribute('scope');
    });

    const sections = [];
    let currentSection = null;

    [...table.querySelectorAll('thead, tbody')].forEach(section => {
        if (section.tagName === 'THEAD') {
            const tr = section.querySelector('tr');
            if (!tr) return;
            tr.className = 'thead';
            currentSection = [tr];
            sections.push(currentSection);
        } else if (section.tagName === 'TBODY') {
            const rows = [...section.querySelectorAll('tr')];
            rows.forEach(r => r.className = 'tbody');
            if (currentSection) currentSection.push(...rows);
        }
    });

    sections.forEach(sec => {
        if (sec.length > 1) sec[sec.length - 1].classList.add('last');
    });

    // Zachowaj wcięcia z oryginalnego HTML
    const originalLines = input.split('\n');
    const indentMap = new Map();
    originalLines.forEach(line => {
        const trimmed = line.trimStart();
        if (trimmed.startsWith('<tr')) {
            const indent = line.match(/^\s*/)[0];
            const key = trimmed.replace(/\s+/g, '');
            indentMap.set(key, indent);
        }
    });

    table.innerHTML = '';
    sections.forEach(sec => {
        sec.forEach(tr => {
            const key = tr.outerHTML.replace(/\s+/g, '');
            const indent = indentMap.get(key) || '';
            table.appendChild(document.createTextNode(indent));
            table.appendChild(tr);
            table.appendChild(document.createTextNode('\n'));
        });
    });

    const resultHTML = wrapper ? wrapper.outerHTML : table.outerHTML;
    document.getElementById('output').value = resultHTML;
});

document.getElementById('copySpec').addEventListener('click', function () {
    const output = document.getElementById('output');
    if (!output.value.trim()) {
        alert('Nie ma nic do skopiowania 🙂');
        return;
    }
    output.select();
    document.execCommand('copy');
    alert('Skopiowano do schowka!');
});