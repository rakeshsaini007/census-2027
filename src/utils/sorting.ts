import { CensusRecord } from "../types";

/**
 * Natural compare function for robust alphanumeric sorting.
 * E.g., "B2" comes before "B10" and "460" comes before "461"
 */
export const naturalCompare = (a: string | number, b: string | number): number => {
  return String(a).localeCompare(String(b), undefined, {
    numeric: true,
    sensitivity: "base",
  });
};

/**
 * Hierarchical sorting priority:
 * 1. Plot Number (प्लॉट क्रमांक)
 * 2. Building Number (भवन नंबर)
 * 3. House Number (जनगणना मकान नंबर)
 * 4. Family Number (परिवार क्रमांक)
 */
export const sortCensusRecords = (records: CensusRecord[]): CensusRecord[] => {
  return [...records].sort((a, b) => {
    const hA = String(a["जनगणना मकान नंबर"] || "").trim().toUpperCase();
    const hB = String(b["जनगणना मकान नंबर"] || "").trim().toUpperCase();

    // If house number is empty, push to bottom
    if (hA !== "" && hB === "") return -1;
    if (hA === "" && hB !== "") return 1;
    if (hA !== hB) {
      return naturalCompare(hA, hB);
    }

    const fA = String(a["परिवार क्रमांक"] || "").trim().toUpperCase();
    const fB = String(b["परिवार क्रमांक"] || "").trim().toUpperCase();

    // If family is empty, push to bottom
    if (fA !== "" && fB === "") return -1;
    if (fA === "" && fB !== "") return 1;
    if (fA === "" && fB === "") {
      // Sort by line sequence if both are empty
      return Number(a["लाइन क्रमांक"] || 0) - Number(b["लाइन क्रमांक"] || 0);
    }

    return naturalCompare(fA, fB);
  });
};

/**
 * Global Sequential Building Number formatting (B001, B002, B003...)
 * This scans ALL records in the system and finds the maximum 'B' number sequence, then increments it by 1.
 * Never resets.
 */
export const getGlobalNextBuildingNo = (records: CensusRecord[]): string => {
  let maxNum = 0;
  records.forEach((r) => {
    const b = String(r["भवन नंबर"] || "").trim().toUpperCase();
    const match = b.match(/^B(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  });
  return `B${String(maxNum + 1).padStart(3, "0")}`;
};

/**
 * Global Sequential House Number formatting (H001, H002, H003...)
 * Scans ALL records in the system and finds the maximum 'H' number sequence, then increments.
 * Continuous across all buildings, never reset per building.
 */
export const getGlobalNextHouseNo = (records: CensusRecord[]): string => {
  let maxNum = 0;
  records.forEach((r) => {
    const h = String(r["जनगणना मकान नंबर"] || "").trim().toUpperCase();
    const match = h.match(/^H(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  });
  return `H${String(maxNum + 1).padStart(3, "0")}`;
};

/**
 * Global Sequential Family Number formatting (F001, F002, F003...)
 * Scans ALL records in the system and finds the maximum 'F' number sequence, then increments.
 * Continuous across all houses, never reset per house.
 */
export const getGlobalNextFamilyNo = (records: CensusRecord[]): string => {
  let maxNum = 0;
  records.forEach((r) => {
    const f = String(r["परिवार क्रमांक"] || "").trim().toUpperCase();
    const match = f.match(/^F(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  });
  return `F${String(maxNum + 1).padStart(3, "0")}`;
};

/**
 * Checks if a house/mecan usage type is residential
 */
export const checkIsResidential = (usageType: string): boolean => {
  return usageType === "आवास" || usageType === "आवास-सह-अन्य उपयोग";
};

