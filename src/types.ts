export interface CensusRecord {
  "लाइन क्रमांक": number | string;
  "प्लॉट क्रमांक": string;
  "भवन नंबर": string;
  "जनगणना मकान नंबर": string;
  "जनगणना मकान का उपयोग": string;
  "गैर आवासीय मकान का नाम"?: string;
  "परिवार क्रमांक": string;
  "परिवार के मुखिया का नाम": string;
  "मोबाइल नंबर": string;
  "लिंग": string;
  "SC/ST/अन्य": string;
  "मकान के स्वामित्व की स्थिति": string;
  "परिवार के पास रहने के लिए उपलब्ध कमरों की संख्या": number | string;
  "परिवार में रहने वालों की कुल संख्या": number | string;
  "विवाहित जोड़ों की संख्या": number | string;
  "पेयजल का मुख्य स्रोत": string;
  "पेयजल स्रोत की उपलब्धता": string;
  "LPG/PNG": string;
  "LAPTOP/ COMPUTER": string;
  "साइकिल/ स्कूटर": string;
  "कार/ जीप/ वैन": string;
}

export const HOUSE_USE_OPTIONS = [
  "आवास",
  "आवास-सह-अन्य उपयोग",
  "दुकान",
  "कार्यालय",
  "विद्यालय",
  "अस्पताल",
  "खाली",
  "अन्य"
];

export const OWNERSHIP_OPTIONS = [
  "अपना",
  "किराये पर, परंतु अन्यत्र अपना मकान",
  "किराये का एवं अपना कोई मकान नहीं",
  "अन्य"
];

export const WATER_SOURCE_OPTIONS = [
  "नल का पानी उपचारित स्रोत से",
  "नल का पानी अन-उपचारित स्रोत से",
  "कुआँ",
  "हैण्ड पम्प",
  "ट्यूबवेल/बोरहोल",
  "झरना",
  "नदी/नहर",
  "टैंक/तालाब/झील",
  "सीलबंद पैकेट/बोतल का पानी",
  "अन्य स्रोत"
];

export const WATER_AVAILABILITY_OPTIONS = [
  "परिसर के अन्दर",
  "परिसर के निकट",
  "दूर"
];

export const VEHICLE_OPTIONS = [
  "साइकिल",
  "स्कूटर/मोटर साइकिल/मोपेड",
  "दोनों",
  "नहीं"
];

export const GENDER_OPTIONS = [
  "पुरुष",
  "महिला",
  "अन्य"
];

export const CASTE_OPTIONS = [
  "SC",
  "ST",
  "अन्य"
];

export const YES_NO_OPTIONS = [
  "हाँ",
  "नहीं"
];
