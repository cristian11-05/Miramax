export const ubigeoData: Record<string, Record<string, Record<string, string[]>>> = {};

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
