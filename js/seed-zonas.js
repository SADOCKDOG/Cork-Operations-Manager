/**
 * Datos semilla enriquecidos basados en el backup histórico de El Chamorro.
 */
const SEED_ZONAS = [
  {
    "nombre": "Cercado de la Virgen",
    "refCatastral": "21009A001000300000WB",
    "localizacion": "EM DISEMINADO Polígono 1 Parcela 30",
    "paraje": "UMBRIA PRADO",
    "municipio": "Arroyomolinos De Leon",
    "provincia": "Huelva",
    "poligono": 1,
    "parcela": 30,
    "clase": "Rústico",
    "usoPrincipal": "Agrario",
    "superficieGrafica": 43172,
    "superficieConstruida": 73,
    "anoConstruccion": 1986,
    "construcciones": [{ "uso": "ALMACEN", "escalera": "1", "planta": "00", "puerta": "01", "superficie": 73 }],
    "cultivos": [
      { "letra": "a", "cultivo": "F- Frutales secano", "intensidad": "02", "superficie": 36387 },
      { "letra": "b", "cultivo": "E- Pastos", "intensidad": "02", "superficie": 6583 },
      { "letra": "c", "cultivo": "I- Improductivo", "intensidad": "00", "superficie": 129 }
    ]
  },
  {
    "nombre": "El Olivar",
    "refCatastral": "21009A019001360000WR",
    "localizacion": "Polígono 19 Parcela 136",
    "paraje": "SOLANA OLIVOS",
    "municipio": "Arroyomolinos De Leon",
    "provincia": "Huelva",
    "poligono": 19,
    "parcela": 136,
    "clase": "Rústico",
    "usoPrincipal": "Agrario",
    "superficieGrafica": 10176,
    "cultivos": [{ "letra": "0", "cultivo": "O- Olivos secano", "intensidad": "02", "superficie": 10176 }]
  },
  {
    "nombre": "El Llano, Chamorro",
    "refCatastral": "21009A809002750000TI",
    "localizacion": "Polígono 809 Parcela 275",
    "paraje": "LA MANCHA",
    "municipio": "Arroyomolinos De Leon",
    "provincia": "Huelva",
    "poligono": 809,
    "parcela": 275,
    "clase": "Rústico",
    "usoPrincipal": "Agrario",
    "superficieGrafica": 45214,
    "cultivos": [
      { "letra": "a", "cultivo": "E- PASTIZAL", "intensidad": "01", "superficie": 7163 },
      { "letra": "b", "cultivo": "FE ENCINA", "intensidad": "06", "superficie": 16625 },
      { "letra": "b", "cultivo": "FS ALCORNOQUE", "intensidad": "04", "superficie": 3116 },
      { "letra": "c", "cultivo": "E- PASTIZAL", "intensidad": "01", "superficie": 18309 }
    ]
  },
  {
    "nombre": "Barranco de la Herrumbre (Baja)",
    "refCatastral": "21009A809005810000TQ",
    "localizacion": "EM DISEMINADO Polígono 809 Parcela 581",
    "paraje": "LA MANCHA",
    "municipio": "Arroyomolinos De Leon",
    "provincia": "Huelva",
    "poligono": 809,
    "parcela": 581,
    "clase": "Rústico",
    "usoPrincipal": "Agrario",
    "superficieGrafica": 50692,
    "superficieConstruida": 52,
    "anoConstruccion": 1989,
    "construcciones": [{ "uso": "ALMACEN", "escalera": "1", "planta": "00", "puerta": "01", "superficie": 52 }],
    "cultivos": [
      { "letra": "a", "cultivo": "FE Encinar", "intensidad": "03", "superficie": 37010 },
      { "letra": "b", "cultivo": "FE Encinar", "intensidad": "02", "superficie": 10756 },
      { "letra": "b", "cultivo": "FS Alcornocal", "intensidad": "02", "superficie": 2692 },
      { "letra": "c", "cultivo": "I- Improductivo", "intensidad": "00", "superficie": 182 }
    ]
  },
  {
    "nombre": "Cerro Grande, El Chamorro",
    "refCatastral": "21009A809005830000TL",
    "localizacion": "Polígono 809 Parcela 583",
    "paraje": "LA MANCHA",
    "municipio": "Arroyomolinos De Leon",
    "provincia": "Huelva",
    "poligono": 809,
    "parcela": 583,
    "clase": "Rústico",
    "usoPrincipal": "Agrario",
    "superficieGrafica": 122366,
    "cultivos": [
      { "letra": "a", "cultivo": "E- Pastos", "intensidad": "01", "superficie": 15741 },
      { "letra": "b", "cultivo": "FE Encinar", "intensidad": "02", "superficie": 20623 },
      { "letra": "d", "cultivo": "FS Alcornocal", "intensidad": "02", "superficie": 34307 }
    ]
  }
];
