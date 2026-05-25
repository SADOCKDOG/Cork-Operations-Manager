const Informes = {
    async getDailyData(rango = 30) {
        const pesadas = await Pesadas.list();
        const hoy = new Date();
        const dias = [], valores = [];
        for (let i = rango; i >= 0; i--) {
            const d = new Date(); d.setDate(hoy.getDate() - i);
            const fechaStr = d.toISOString().split('T')[0];
            const totalDia = pesadas.filter(p => p.fecha.startsWith(fechaStr)).reduce((acc, p) => acc + (p.kg || 0), 0);
            dias.push(fechaStr.split('-').slice(1).reverse().join('/'));
            valores.push(totalDia);
        }
        return { labels: dias, values: valores };
    },
    async getQualityData() {
        const pesadas = await Pesadas.list();
        const calidades = ["primera", "bornizo", "refugo"];
        const valores = calidades.map(c => pesadas.reduce((acc, p) => acc + (p.pesadasPorCalidad?.[c]?.kg || 0), 0));
        return { labels: ["1ª", "Bornizo", "Refugo"], values: valores };
    },
    renderChart(canvasId, type, data, title) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        return new Chart(ctx, {
            type: type,
            data: {
                labels: data.labels,
                datasets: [{ label: title, data: data.values, backgroundColor: ['#4CAF50', '#FF9800', '#F44336'], borderWidth: 1 }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
};
window.Informes = Informes;
