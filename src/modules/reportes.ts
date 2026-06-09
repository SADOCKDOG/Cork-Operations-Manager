import { Pesadas } from './pesadas';
import { Zonas } from './zonas';
import { Fincas } from './fincas';
import { Gastos } from './gastos';

class ReportManager {
    async generarReporteGlobalCampaña() {
        const pesadas = await Pesadas.list();
        const zonas = await Zonas.list();
        const reportePorZona: any = {};

        zonas.forEach(zona => {
            reportePorZona[zona.id] = {
                nombre: zona.nombre,
                totales: {
                    primera: { kg: 0, quintales: 0 },
                    bornizo: { kg: 0, quintales: 0 },
                    refugo: { kg: 0, quintales: 0 }
                }
            };
        });

        const totalesGlobales: any = {
            primera: { kg: 0, quintales: 0, sacas: 0 },
            bornizo: { kg: 0, quintales: 0, sacas: 0 },
            refugo: { kg: 0, quintales: 0, sacas: 0 }
        };

        pesadas.forEach(p => {
            ['primera', 'bornizo', 'refugo'].forEach(cal => {
                const kg = p.pesadasPorCalidad[cal]?.kg || 0;
                const q = p.pesadasPorCalidad[cal]?.quintales || 0;
                if (kg > 0) {
                    totalesGlobales[cal].kg += kg;
                    totalesGlobales[cal].quintales += q;
                    totalesGlobales[cal].sacas++;

                    if (reportePorZona[p.zonaId]) {
                        reportePorZona[p.zonaId].totales[cal].kg += kg;
                        reportePorZona[p.zonaId].totales[cal].quintales += q;
                    }
                }
            });
        });

        return { tipo: 'global', fechaGeneracion: new Date().toISOString(), totalesGlobales, reportePorZona };
    }

    async generarReportePorZona(zonaId: string) {
        const pesadas = await Pesadas.list();
        const zona = await Zonas.get(zonaId);
        if (!zona) return null;

        let pesadasZona = pesadas.filter(p => String(p.zonaId) === String(zonaId));

        const totales: any = {
            primera: { kg: 0, quintales: 0, sacas: 0 },
            bornizo: { kg: 0, quintales: 0, sacas: 0 },
            refugo: { kg: 0, quintales: 0, sacas: 0 }
        };

        pesadasZona.forEach(p => {
            ['primera', 'bornizo', 'refugo'].forEach(calidad => {
                const kg = p.pesadasPorCalidad[calidad]?.kg || 0;
                const q = p.pesadasPorCalidad[calidad]?.quintales || 0;
                if (kg > 0) {
                    totales[calidad].kg += kg;
                    totales[calidad].quintales += q;
                    totales[calidad].sacas++;
                }
            });
        });

        return { tipo: 'porZona', zona, pesadas: pesadasZona, totales, fechaGeneracion: new Date().toISOString() };
    }

    async generarReporteEconomicoGlobal() {
        const pesadas = await Pesadas.list();
        const finca = await Fincas.getActive();
        if (!finca) return null;

        const precios = finca.precios;
        const oreoPorc = finca.porcentajeOreo || 0;
        const oreoFactor = oreoPorc / 100;

        const totales: any = {
            primera: { bruto: 0, merma: 0, neto: 0, valor: 0 },
            bornizo: { bruto: 0, merma: 0, neto: 0, valor: 0 },
            refugo: { bruto: 0, merma: 0, neto: 0, valor: 0 }
        };

        pesadas.forEach(p => {
            ['primera', 'bornizo', 'refugo'].forEach(cal => {
                const qOriginal = p.pesadasPorCalidad[cal]?.quintales || 0;
                if (qOriginal > 0) {
                    totales[cal].bruto += qOriginal;
                    const merma = qOriginal * oreoFactor;
                    const neto = qOriginal - merma;
                    totales[cal].merma += merma;
                    totales[cal].neto += neto;
                    totales[cal].valor += neto * (precios[cal]?.precioQuintal || 0);
                }
            });
        });

        const valorTotal = totales.primera.valor + totales.bornizo.valor + totales.refugo.valor;
        const brutoTotal = totales.primera.bruto + totales.bornizo.bruto + totales.refugo.bruto;
        const netoTotal = totales.primera.neto + totales.bornizo.neto + totales.refugo.neto;

        const totalGastos = await Gastos.getTotal();

        return {
            tipo: 'economicoGlobal',
            precios,
            oreo: oreoPorc,
            totales,
            valorTotal,
            brutoTotal,
            netoTotal,
            totalGastos,
            beneficioNeto: valorTotal - totalGastos,
            fechaGeneracion: new Date().toISOString()
        };
    }

    async generarReporteEconomicoPorCalidad(calidad: string) {
        const pesadas = await Pesadas.list();
        const zonas = await Zonas.list();
        const finca = await Fincas.getActive();
        if (!finca) return null;

        const precios = finca.precios;
        const oreoPorc = finca.porcentajeOreo || 0;
        const oreoFactor = oreoPorc / 100;
        if (!['primera', 'bornizo', 'refugo'].includes(calidad)) return null;

        const reportePorZona: any = {};
        zonas.forEach(zona => {
            reportePorZona[zona.id] = { nombre: zona.nombre, bruto: 0, merma: 0, neto: 0, valor: 0, sacas: 0 };
        });

        pesadas.forEach(p => {
            if (reportePorZona[p.zonaId]) {
                const qOriginal = p.pesadasPorCalidad[calidad]?.quintales || 0;
                if (qOriginal > 0) {
                    const merma = qOriginal * oreoFactor;
                    const neto = qOriginal - merma;

                    reportePorZona[p.zonaId].bruto += qOriginal;
                    reportePorZona[p.zonaId].merma += merma;
                    reportePorZona[p.zonaId].neto += neto;
                    reportePorZona[p.zonaId].valor += neto * (precios[calidad]?.precioQuintal || 0);
                    reportePorZona[p.zonaId].sacas++;
                }
            }
        });

        let tBruto = 0, tNeto = 0, tValor = 0, tSacas = 0;
        Object.values(reportePorZona).forEach((z: any) => {
            tBruto += z.bruto;
            tNeto += z.neto;
            tValor += z.valor;
            tSacas += z.sacas;
        });

        return {
            tipo: 'economicoPorCalidad',
            calidad,
            nombreCalidad: calidad === 'primera' ? '1ª Calidad' : calidad === 'bornizo' ? 'Bornizo' : 'Refugo',
            precioQuintal: precios[calidad]?.precioQuintal || 0,
            oreo: oreoPorc,
            reportePorZona,
            totales: { bruto: tBruto, neto: tNeto, valor: tValor, sacas: tSacas },
            fechaGeneracion: new Date().toISOString()
        };
    }
}

export const Reportes = new ReportManager();
export default Reportes;
