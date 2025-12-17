export const ubigeoData: Record<string, Record<string, Record<string, string[]>>> = {
    "La Libertad": {
        "Otuzco": {
            "Mache": [
                "Centro Poblado Lluin",
                "Caserío Campo Bello",
                "Caserío Cruz de Mayo",
                "Caserío Lanchipampa",
                "Caserío La Victoria"
            ],
            "Agallpampa": [
                "Agallpampa",
                "Caserío Chota",
                "Caserío Carata",
                "Caserío California"
            ],
            "Otuzco": [
                "Otuzco",
                "Caserío Allacday",
                "Caserío Pollo",
                "Caserío Sanchique"
            ],
            "Salpo": [
                "Salpo",
                "Caserío Bellavista",
                "Caserío El Milagro"
            ],
            "Usquil": [
                "Usquil",
                "Caserío Canibamba",
                "Caserío Coina"
            ]
        },
        "Trujillo": {
            "Trujillo": ["Trujillo", "Alto Trujillo"],
            "El Porvenir": ["El Porvenir", "Alto Trujillo"],
            "Florencia de Mora": ["Florencia de Mora"],
            "La Esperanza": ["La Esperanza"],
            "Laredo": ["Laredo", "Santo Domingo"],
            "Moche": ["Moche", "Las Delicias"],
            "Salaverry": ["Salaverry"],
            "Simbal": ["Simbal"],
            "Victor Larco Herrera": ["Buenos Aires"]
        },
        "Sanchez Carrion": {
            "Huamachuco": ["Huamachuco", "Caserío 1"],
            "Chugay": ["Chugay"]
        },
        "Santiago de Chuco": {
            "Santiago de Chuco": ["Santiago de Chuco"],
            "Quiruvilca": ["Quiruvilca"]
        }
    },
    // Se pueden agregar más departamentos aquí
    "Cajamarca": {
        "Jaén": {
            "Jaén": ["Jaén", "Fila Alta"],
            "Bellavista": ["Bellavista"]
        }
    }
};

export const regions = Object.keys(ubigeoData);

export const getProvinces = (region: string) => {
    return region && ubigeoData[region] ? Object.keys(ubigeoData[region]) : [];
};

export const getDistricts = (region: string, province: string) => {
    return region && province && ubigeoData[region]?.[province]
        ? Object.keys(ubigeoData[region][province])
        : [];
};

export const getCaserios = (region: string, province: string, district: string) => {
    return region && province && district && ubigeoData[region]?.[province]?.[district]
        ? ubigeoData[region][province][district]
        : [];
};
