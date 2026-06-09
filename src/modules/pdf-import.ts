// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';

// Configurar worker de pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/pdf.worker.min.js';

export class PdfImportManager {
    /**
     * Reconstruye las líneas del PDF agrupando items por coordenada Y.
     */
    private async extractLines(pdf: any) {
        const allLines = [];
        for (let p = 1; p <= pdf.numPages; p++) {
            const page = await pdf.getPage(p);
            const content = await page.getTextContent();
            const lineGroups: Record<number, any[]> = {};
            for (const item of content.items) {
                if (!item.str || !item.str.trim()) continue;
                const y = Math.round(item.transform[5] / 2) * 2;
                const x = item.transform[4];
                if (!lineGroups[y]) lineGroups[y] = [];
                lineGroups[y].push({ x, str: item.str });
            }
            const sortedYs = Object.keys(lineGroups).map(Number).sort((a, b) => b - a);
            for (const y of sortedYs) {
                const items = lineGroups[y].sort((a, b) => a.x - b.x);
                const line = items.map(i => i.str).join(' ').replace(/\s+/g, ' ').trim();
                if (line) allLines.push(line);
            }
        }
        return allLines;
    }

    /**
     * Parsea el texto reconstruido línea a línea buscando patrones específicos del Catastro.
     */
    private parseCatastro(lines: string[]) {
        const data: any = {
            refCatastral: null,
            poligono: null, parcela: null,
            paraje: null, municipio: null, provincia: null,
            localizacion: null,
            clase: null, usoPrincipal: null,
            superficieGrafica: null, superficieConstruida: null,
            anoConstruccion: null,
            construcciones: [],
            cultivos: []
        };

        const fullText = lines.join('\n');

        const refMatch = fullText.match(/[0-9]{5}[A-Z][0-9]{12}[A-Z]{2}/i) ||
                        fullText.match(/[0-9]{7}[A-Z]{2}[0-9]{4}[A-Z][0-9]{4}[A-Z]{2}/i);
        if (refMatch) data.refCatastral = refMatch[0].toUpperCase();

        const polMatch = fullText.match(/Pol[íi]gono\s+(\d+)\s+Parcela\s+(\d+)/i);
        if (polMatch) {
            data.poligono = parseInt(polMatch[1], 10);
            data.parcela = parseInt(polMatch[2], 10);
        }

        for (let i = 0; i < lines.length; i++) {
            if (/Pol[íi]gono\s+\d+\s+Parcela\s+\d+/i.test(lines[i])) {
                if (i > 0 && /Localizaci[óo]n/i.test(lines[i-1])) {
                    data.localizacion = lines[i-1].replace(/Localizaci[óo]n:?\s*/i, '').trim() + " " + lines[i];
                } else {
                    data.localizacion = lines[i];
                }

                for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
                    const next = lines[j];
                    const locMatch = next.match(/^([A-ZÁÉÍÓÚÑa-zñ\s\-\,]+?)\.\s*([A-ZÁÉÍÓÚÑa-zñ\s\-\,]+?)\s*\(([A-ZÁÉÍÓÚÑa-zñ\s]+)\)/);
                    if (locMatch) {
                        data.paraje = locMatch[1].trim();
                        data.municipio = locMatch[2].trim();
                        data.provincia = locMatch[3].trim();
                        data.localizacion += " " + next;
                        break;
                    }
                }
                if (data.paraje) break;
            }
        }

        const claseMatch = fullText.match(/Clase\s+(R[úu]stico|Urbano|BICE|Agrario|Industrial)/i);
        if (claseMatch) data.clase = claseMatch[1];

        const usoMatch = fullText.match(/Uso\s+principal\s+([A-ZÁÉÍÓÚÑa-zñ\s]{3,20})/i);
        if (usoMatch) data.usoPrincipal = usoMatch[1].trim();

        const supMatch = fullText.match(/Superficie\s+gr[áa]fica\s+([\d.,]+)/i);
        if (supMatch) data.superficieGrafica = this.parseSuperficie(supMatch[1]);

        const supCMatch = fullText.match(/Superficie\s+construida\s+([\d.,]+)/i);
        if (supCMatch) data.superficieConstruida = this.parseSuperficie(supCMatch[1]);

        const anoMatch = fullText.match(/A[ñn]o\s+construcci[óo]n\s+(\d{4})/i);
        if (anoMatch) data.anoConstruccion = parseInt(anoMatch[1], 10);

        const cultivoStart = lines.findIndex(l => /^CULTIVO/i.test(l.trim()));
        if (cultivoStart >= 0) {
            for (let i = cultivoStart + 1; i < lines.length; i++) {
                const l = lines[i].trim();
                if (!l || /^(Subparcela|CONSTRUCCI|PARCELA)/i.test(l)) {
                    if (l && /^(CONSTRUCCI|PARCELA)/i.test(l)) break;
                    continue;
                }
                const m = l.match(/^([a-z0-9])\s+(.+?)\s+(\d{2})\s+([\d.,]+)\s*$/i);
                if (m) {
                    data.cultivos.push({
                        letra: m[1].toLowerCase(),
                        cultivo: m[2].trim(),
                        intensidad: m[3],
                        superficie: this.parseSuperficie(m[4])
                    });
                }
            }
        }

        return data;
    }

    private parseSuperficie(str: string) {
        if (!str) return null;
        const cleaned = str.replace(/\./g, '').replace(',', '.');
        return parseFloat(cleaned);
    }

    private async renderPageToBlob(pdf: any, pageNum = 1) {
        try {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d');
            await page.render({ canvasContext: ctx, viewport }).promise;
            return await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/png'));
        } catch (e) {
            console.warn('[PDF-Import] Error renderizando croquis:', e);
            return null;
        }
    }

    async parsePdfCatastro(file: File) {
        const buf = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
        const lines = await this.extractLines(pdf);
        const data = this.parseCatastro(lines);
        data.croquisBlob = await this.renderPageToBlob(pdf, 1);

        return {
            nombre: "",
            refCatastral: data.refCatastral,
            localizacion: data.localizacion,
            paraje: data.paraje,
            municipio: data.municipio,
            provincia: data.provincia,
            poligono: data.poligono,
            parcela: data.parcela,
            clase: data.clase,
            usoPrincipal: data.usoPrincipal,
            superficieGrafica: data.superficieGrafica,
            superficieConstruida: data.superficieConstruida || 0,
            anoConstruccion: data.anoConstruccion,
            construcciones: data.construcciones,
            cultivos: data.cultivos,
            alcornoquesEstimados: null,
            ultimoDescorche: null,
            proximoDescorche: null,
            notas: "",
            croquisBlob: data.croquisBlob
        };
    }
}

export const PdfImport = new PdfImportManager();
export default PdfImport;
