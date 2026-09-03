document.addEventListener('click', function (event) {
    const trigger = event.target.closest('[data-kopiuj-trigger]');
    if (!trigger) return;

    const container = trigger.closest('.kopia-kontener');
    if (!container) {
        console.error('Nie znaleziono elementu nadrzędnego .kopia-kontener');
        return;
    }

    const targetSelector = trigger.getAttribute('data-kopiuj-cel');
    const copyType = trigger.getAttribute('data-kopiuj-typ') || 'outer';

    let targetElement = container;

    if (targetSelector) {
        targetElement = container.querySelector(targetSelector);
    }

    if (!targetElement) return;

    // 1. KLONOWANIE: Tworzenie kopii elementu w pamięci (bez naruszania widoku strony)
    const clone = targetElement.cloneNode(true);

    // 2. CZYSZCZENIE KLONU GŁÓWNEGO: 
    // Usunięcie atrybutów technicznych z samego głównego elementu
    clone.removeAttribute('data-kopiuj-trigger');
    clone.removeAttribute('data-kopiuj-cel');
    clone.removeAttribute('data-kopiuj-typ');
    clone.classList.remove('kopia-kontener');

    // Jeśli po usunięciu klasy atrybut class został pusty, usuwamy go całkowicie
    if (clone.getAttribute('class') === '') {
        clone.removeAttribute('class');
    }

    // 3. CZYSZCZENIE DZIECI KLONU:
    // Całkowite usuwanie elementów, które nie powinny trafić do docelowego kodu 
    // (np. przycisk kopiowania, jeśli znajdował się wewnątrz kopiowanego obszaru)
    const elementsToRemove = clone.querySelectorAll('.usun-przy-kopiowaniu, .btn-kopiuj');
    elementsToRemove.forEach(el => el.remove());

    // Usunięcie atrybutów technicznych z elementów zagnieżdżonych (jeśli jakieś je posiadają)
    const innerTriggers = clone.querySelectorAll('[data-kopiuj-trigger]');
    innerTriggers.forEach(el => {
        el.removeAttribute('data-kopiuj-trigger');
        el.removeAttribute('data-kopiuj-cel');
        el.removeAttribute('data-kopiuj-typ');
    });

    // 4. POBRANIE CZYSTEGO HTML
    let textToCopy = copyType === 'inner' ? clone.innerHTML : clone.outerHTML;
    textToCopy = textToCopy.trim();

    // 5. ZAPIS DO SCHOWKA
    navigator.clipboard.writeText(textToCopy).then(() => {
        trigger.classList.add('skopiowano');
        setTimeout(() => trigger.classList.remove('skopiowano'), 1000);
        console.log('Skopiowano czysty kod do schowka!');
    }).catch(err => {
        console.error('Błąd podczas kopiowania do schowka: ', err);
    });
});

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


///////////////////// GENERATOR CIĄGÓW ////////////////////
const state = new Set();
const resultView = document.querySelector('#result');
const allCheckboxes = document.querySelectorAll('.lista-ciagow input[type="checkbox"]');
const defaultPlaceholder = '<span class="text-gray">Tu pojawią się zaznaczone elementy</span>';

allCheckboxes.forEach(box => {
    box.addEventListener('change', (e) => {
        const itemValue = e.target.value;
        
        if (e.target.checked) {
            state.add(itemValue);
        } else {
            state.delete(itemValue);
        }

        if (state.size === 0) {
            resultView.innerHTML = defaultPlaceholder;
        } else {
            // Zmiana separatora na przecinek i spację
            resultView.textContent = Array.from(state).join(', ');
        }
    });
});

document.querySelector('#copyBtn').addEventListener('click', () => {
    if (state.size > 0) {
        // Zmiana separatora dla tekstu trafiającego do schowka
        const textForClipboard = Array.from(state).join(', ');
        
        const copyBtn = document.querySelector('#copyBtn');
        const originalBtnHTML = copyBtn.innerHTML;
        
        navigator.clipboard.writeText(textForClipboard).then(() => {
            // Czyszczenie stanu i widoku
            state.clear();
            allCheckboxes.forEach(box => box.checked = false);
            resultView.innerHTML = defaultPlaceholder;
            
            // Wizualne potwierdzenie kopiowania (Bootstrap)
            copyBtn.innerHTML = '<i class="fas fa-check"></i>&nbsp; Skopiowano!';
            copyBtn.classList.replace('bg-primary', 'bg-success');
            
            // Powrót przycisku do domyślnego stanu po 2 sekundach
            setTimeout(() => {
                copyBtn.innerHTML = originalBtnHTML;
                copyBtn.classList.replace('bg-success', 'bg-primary');
            }, 2000);
        });
    }
});