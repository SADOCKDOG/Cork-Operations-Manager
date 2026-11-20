const CDP = require('chrome-remote-interface');

async function main() {
    let client;
    try {
        client = await CDP({port: 9301, host: '127.0.0.1'});
    } catch (e) {
        console.error('❌ No se pudo conectar a CDP en puerto 9301:', e.message);
        process.exit(1);
    }

    const {Runtime, DOM, Page, Emulation} = client;
    await Promise.all([Runtime.enable(), DOM.enable(), Page.enable()]);

    // Asegurar que estamos en /lista
    await Runtime.evaluate({expression: "location.hash = '#/lista';"});
    await new Promise(r => setTimeout(r, 500));

    // Medir ancho
    const w = await Runtime.evaluate({expression: "document.documentElement.clientWidth + ' x ' + document.documentElement.scrollWidth"});
    console.log('📐 Viewport:', w.result.value);

    // Contar fichas .pesada
    const pesadas = await Runtime.evaluate({expression: "document.querySelectorAll('article.pesada').length"});
    console.log('📦 Fichas article.pesada:', pesadas.result.value);

    // Verificar que NO hay table.pesada-table-bordered
    const tables = await Runtime.evaluate({expression: "document.querySelectorAll('table.pesada-table-bordered').length"});
    console.log('❌ Tablas pesada-table-bordered (deben ser 0):', tables.result.value);

    // Medir fuentes de la primera ficha
    const fontCheck = await Runtime.evaluate({
        expression: `
            const p = document.querySelector('article.pesada');
            if (!p) return 'no ficha';
            const q = p.querySelector('.q-val');
            const kg = p.querySelector('.kg-val');
            const time = p.querySelector('time');
            return {
                qValFont: q ? getComputedStyle(q).fontSize + ' / ' + getComputedStyle(q).fontWeight : 'none',
                kgValFont: kg ? getComputedStyle(kg).fontSize + ' / ' + getComputedStyle(kg).fontWeight : 'none',
                timeFont: time ? getComputedStyle(time).fontSize : 'none',
                timeText: time ? time.textContent : 'none',
                timeDatetime: time ? time.dateTime : 'none',
            };
        `
    });
    console.log('🔤 Fuentes jerarquía (q-val > kg-val > time):', JSON.stringify(fontCheck.result.value, null, 2));

    // Verificar botón alternativo ≥44px
    const btnCheck = await Runtime.evaluate({
        expression: `
            const btn = document.querySelector('.pesada-edit-btn');
            if (!btn) return 'none';
            const r = btn.getBoundingClientRect();
            return {w: r.width, h: r.height, ok: r.width >= 44 && r.height >= 44};
        `
    });
    console.log('🎯 Botón editar target (≥44px):', JSON.stringify(btnCheck.result.value, null, 2));

    // Verificar swipe funciona (contar listeners)
    const listenerCheck = await Runtime.evaluate({
        expression: `
            // Verificar que el click en ficha navega
            const p = document.querySelector('article.pesada');
            if (!p) return 'no ficha';
            // Solo comprobamos que existe el botón y el swipe wrapper
            const wrap = p.closest('.pesada-swipe-wrapper');
            return {hasWrapper: !!wrap, hasEditBtn: !!document.querySelector('.pesada-edit-btn')};
        `
    });
    console.log('🖐️  Swipe/Click setup:', JSON.stringify(listenerCheck.result.value, null, 2));

    // 320 dp test
    await Emulation.setDeviceMetricsOverride({
        width: 320,
        height: 640,
        deviceScaleFactor: 1,
        mobile: true
    });
    await new Promise(r => setTimeout(r, 300));

    const w320 = await Runtime.evaluate({expression: "document.documentElement.clientWidth + ' x ' + document.documentElement.scrollWidth"});
    console.log('📐 @320dp Viewport:', w320.result.value);

    const horiz = await Runtime.evaluate({expression: "document.documentElement.scrollWidth > document.documentElement.clientWidth ? 'HORIZONTAL SCROLL!' : 'OK - no scroll horizontal'"});
    console.log('↔️  Scroll horizontal @320dp:', horiz.result.value);

    // Verificar 20 fichas (o todas si hay menos)
    const totalPesadas = await Runtime.evaluate({expression: "document.querySelectorAll('article.pesada').length"});
    console.log('📦 Total fichas @320dp:', totalPesadas.result.value);

    // Test duplicados: click en ficha → una sola navegación
    // (simulamos 2 clicks y vemos si hay navegación única)
    // Esto requiere medir hashchange - para este test solo verificamos estructura
    const dupCheck = await Runtime.evaluate({
        expression: `
            const wrappers = document.querySelectorAll('.pesada-swipe-wrapper');
            let boundCount = 0;
            wrappers.forEach(w => { if (w.dataset.swipeBound === '1') boundCount++; });
            return {totalWrappers: wrappers.length, swipeBound: boundCount};
        `
    });
    console.log('🔒 Swipe bound guard (dataset.swipeBound):', JSON.stringify(dupCheck.result.value, null, 2));

    await client.close();
    console.log('✅ Medición Fase 3 completada');
}

main().catch(console.error);