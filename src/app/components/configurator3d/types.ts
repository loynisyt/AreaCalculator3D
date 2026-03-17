// Production-grade types for B2B furniture configurator

export type MaterialType = "MDF" | "Laminat" | "Fornir" | "Płyta melamina";
export type FrontType = "Gładki" | "Frezowany" | "Szkło" | "Lustro";
export type FurnitureCategory =
  | "Szafki dolne"
  | "Szafki górne"
  | "Blaty"
  | "AGD"
  | "Słupki"
  | "Wyspy";

  export interface TextureMaps {
  baseColor: string;
  frontColor?: string;
  normal?: string;
  roughness?: string;
  ambientOcclusion?: string;
  repeat?: [number, number];
}

export interface Material {
  type: MaterialType;
  pricePerM2: number;
  thickness: number;
  color: string;
  textures?: TextureMaps;
}

export interface Hardware {
  name: string;
  quantity: number;
  pricePerUnit: number;
}

export interface Furniture3D {
  id: string;
  name: string;
  category: FurnitureCategory;


  // 3D Transform (in meters for Three.js)
  position: [number, number, number];
  rotation: [number, number, number]; // Euler angles in radians
  scale: [number, number, number];
  shelfCount: number;
  guides?: number;

  // Dimensions (in mm - production standard)
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };

  // Material specifications
  material: Material;
  frontType: FrontType;

  // Production data
  basePrice: number;
  hardware: Hardware[];

  // Snapping points (relative to object center)
  snapPoints: {
    left: boolean;
    right: boolean;
    top: boolean;
    bottom: boolean;
    back: boolean;
  };

  // Metadata
  isAppliance: boolean; // AGD flag
  requiresSupport: boolean; // Needs legs or mounting
}

export interface Room3D {
  width: number; // in meters
  height: number;
  depth: number;
}

export interface Wall {
  id: string;
  position: [number, number, number];
  rotation: number; // Y-axis rotation
  length: number;
  height: number;
  thickness: number;
}

export interface ProductionOutput {
  panelCuttingList: PanelCut[];
  totalPanelArea: number; // m²
  totalPrice: number;
  hardwareList: Hardware[];
  totalWeight: number; // kg
}

export interface PanelCut {
  furnitureId: string;
  furnitureName: string;
  panelType: string; // "Bok", "Tył", "Front", "Półka"
  width: number;
  height: number;
  quantity: number;
  material: MaterialType;
}

const woodTextureMap: TextureMaps = {
  frontColor: "/textures/Wood094_1K-JPG_Color.jpg",
  baseColor: "/textures/Wood094_1K-JPG_Color.jpg",
  normal: "/textures/Wood094_1K-JPG_NormalDX.jpg",
  roughness: "/textures/Wood094_1K-JPG_Roughness.jpg",
};

// Predefined furniture catalog
export const FURNITURE_CATALOG: Record<FurnitureCategory, Partial<Furniture3D>[]> = {
  "Szafki dolne": [
    {
      name: "Szafka Podstawowa",
      dimensions: { width: 600, height: 850, depth: 600 },
      basePrice: 200,
      material: {
        type: "Płyta melamina",
        pricePerM2: 85,
        thickness: 18,
        color: "#8B6F47",
        textures: woodTextureMap,
      },
      frontType: "Gładki",
      hardware: [
        { name: "Zawiasy", quantity: 4, pricePerUnit: 15 },
        { name: "Nóżki", quantity: 4, pricePerUnit: 6 },
        { name: "Uchwyt", quantity: 1, pricePerUnit: 25 },
      ],
      snapPoints: {
        left: true, right: true, top: true, bottom: false, back: true,
      },
      isAppliance: false,
      requiresSupport: true,
    },
    {
      name: "Szafka z szufladami",
      dimensions: { width: 800, height: 850, depth: 600 },
      basePrice: 150,
      material: {
        type: "Płyta melamina",
        pricePerM2: 85,
        thickness: 18,
        color: "#A0826D",
        textures: woodTextureMap,
      },
      frontType: "Gładki",
      hardware: [
        { name: "Zawiasy", quantity: 4, pricePerUnit: 15 },
        { name: "Nóżki", quantity: 4, pricePerUnit: 6 },
        { name: "Uchwyt", quantity: 3, pricePerUnit: 25 },
      ],
      snapPoints: {
        left: true, right: true, top: true, bottom: false, back: true,
      },
      isAppliance: false,
      guides: 3,
      requiresSupport: true,
    },
    {
      name: "Szafka narożna D",
      dimensions: { width: 900, height: 850, depth: 900 },
      basePrice: 400,
      material: {
        type: "Płyta melamina",
        pricePerM2: 85,
        thickness: 18,
        color: "#8B6F47",
        textures: woodTextureMap,
      },
      frontType: "Gładki",
      hardware: [
        { name: "Zawiasy", quantity: 3, pricePerUnit: 15 },
        { name: "Nóżki", quantity: 6, pricePerUnit: 6 },
        { name: "Karuzela narożna", quantity: 2, pricePerUnit: 1200 },
      ],
      snapPoints: {
        left: true, right: true, top: true, bottom: false, back: true,
      },
      isAppliance: false,
      shelfCount: 1,
      requiresSupport: true,
    }
  ],
  "Szafki górne": [
    {
      name: "Szafka Podstawowa",
      dimensions: { width: 600, height: 700, depth: 350 },
      basePrice: 150,
      material: {
        type: "Płyta melamina",
        pricePerM2: 85,
        thickness: 18,
        color: "#B8956A",
        textures: woodTextureMap,
      },
      frontType: "Gładki",
      hardware: [
        { name: "Zawiasy", quantity: 4, pricePerUnit: 15 },
        { name: "Uchwyt", quantity: 1, pricePerUnit: 15 },
      ],
      snapPoints: {
        left: true, right: true, top: false, bottom: true, back: true,
      },
      isAppliance: false,
      shelfCount: 2,
      requiresSupport: false,
    },
    {
      name: "Nadstawka",
      dimensions: { width: 600, height: 600, depth: 350 },
      basePrice: 100,
      material: {
        type: "Płyta melamina",
        pricePerM2: 85,
        thickness: 18,
        color: "#F8956A",
        textures: woodTextureMap,
      },
      frontType: "Gładki",
      hardware: [
        { name: "Siłowniki", quantity: 2, pricePerUnit: 40 },
        { name: "Zawiasy", quantity: 2, pricePerUnit: 15 },
      ],
      snapPoints: {
        left: true, right: true, top: false, bottom: true, back: true,
      },
      isAppliance: false,
      shelfCount: 1,
      requiresSupport: false,
    }
  ],
  "Słupki": [
    {
      name: "Słupek spiżarniany",
      dimensions: { width: 600, height: 2100, depth: 600 },
      basePrice: 450,
      material: {
        type: "Płyta melamina",
        pricePerM2: 85,
        thickness: 18,
        color: "#8B6F47",
        textures: woodTextureMap,
      },
      frontType: "Gładki",
      hardware: [
        { name: "Zawiasy", quantity: 8, pricePerUnit: 15 },
        { name: "Nóżki", quantity: 4, pricePerUnit: 6 },
        { name: "Uchwyt", quantity: 2, pricePerUnit: 25 },
      ],
      snapPoints: {
        left: true, right: true, top: true, bottom: false, back: true,
      },
      isAppliance: false,
      shelfCount: 5,
      requiresSupport: true,
    },
    {
      name: "Słupek do zabudowy",
      dimensions: { width: 600, height: 2100, depth: 600 },
      basePrice: 400,
      material: {
        type: "Płyta melamina",
        pricePerM2: 85,
        thickness: 18,
        color: "#A0826D",
        textures: woodTextureMap,
      },
      frontType: "Gładki",
      hardware: [
        { name: "Zawiasy", quantity: 6, pricePerUnit: 15 },
        { name: "Nóżki", quantity: 4, pricePerUnit: 6 },
        { name: "Uchwyt", quantity: 2, pricePerUnit: 25 },
      ],
      snapPoints: {
        left: true, right: true, top: true, bottom: false, back: true,
      },
      isAppliance: false,
      shelfCount: 2,
      requiresSupport: true,
    }
  ],
  "Wyspy": [
    {
      name: "Wyspa z szufladami",
      dimensions: { width: 1200, height: 850, depth: 900 },
      basePrice: 600,
      material: {
        type: "Płyta melamina",
        pricePerM2: 85,
        thickness: 18,
        color: "#8B6F47",
        textures: woodTextureMap,
      },
      frontType: "Gładki",
      hardware: [
        { name: "Zawiasy", quantity: 8, pricePerUnit: 15 },
        { name: "Nóżki", quantity: 8, pricePerUnit: 6 },
        { name: "Uchwyt", quantity: 6, pricePerUnit: 25 },
      ],
      snapPoints: {
        left: true, right: true, top: true, bottom: false, back: false,
      },
      isAppliance: false,
      guides: 6,
      requiresSupport: true,
    }
  ],
  "Blaty": [
    {
      name: "Blat 60cm",
      dimensions: { width: 600, height: 40, depth: 600 },
      basePrice: 150,
      material: {
        type: "Laminat",
        pricePerM2: 120,
        thickness: 36,
        color: "#2C3E50",
        textures: woodTextureMap, // Replaced Marble with Wood to fix 404
      },
      frontType: "Gładki",
      hardware: [
        { name: "Klej montażowy", quantity: 1, pricePerUnit: 45 },
      ],
      snapPoints: {
        left: true, right: true, top: false, bottom: true, back: false,
      },
      isAppliance: false,
      requiresSupport: false,
    },
    {
      name: "Blat 120cm",
      dimensions: { width: 1200, height: 40, depth: 600 },
      basePrice: 300,
      material: {
        type: "Laminat",
        pricePerM2: 120,
        thickness: 36,
        color: "#2C3E50",
        textures: woodTextureMap,
      },
      frontType: "Gładki",
      hardware: [
        { name: "Klej montażowy", quantity: 1, pricePerUnit: 45 },
      ],
      snapPoints: {
        left: true, right: true, top: false, bottom: true, back: false,
      },
      isAppliance: false,
      requiresSupport: false,
    },
  ],
  "AGD": [
    {
      name: "Zmywarka",
      dimensions: { width: 600, height: 820, depth: 550 },
      basePrice: 1200,
      material: {
        type: "MDF",
        pricePerM2: 0,
        thickness: 0,
        color: "#95A5A6", // Silver metallic
      },
      frontType: "Gładki",
      hardware: [],
      snapPoints: {
        left: false, right: false, top: false, bottom: false, back: true,
      },
      isAppliance: true,
      requiresSupport: true,
    },
    {
      name: "Piekarnik",
      dimensions: { width: 600, height: 600, depth: 550 },
      basePrice: 1500,
      material: {
        type: "MDF",
        pricePerM2: 0,
        thickness: 0,
        color: "#111111", // Black glass
      },
      frontType: "Szkło",
      hardware: [
        { name: "Prowadnice montażowe", quantity: 2, pricePerUnit: 40 },
      ],
      snapPoints: {
        left: false, right: false, top: false, bottom: false, back: true,
      },
      isAppliance: true,
      requiresSupport: true,
    },
    {
      name: "Okap",
      dimensions: { width: 600, height: 150, depth: 500 },
      basePrice: 800,
      material: {
        type: "MDF",
        pricePerM2: 0,
        thickness: 0,
        color: "#34495E", // Dark metal
      },
      frontType: "Gładki",
      hardware: [{ name: "Uchwyty montażowe", quantity: 2, pricePerUnit: 25 }],
      snapPoints: {
        left: false, right: false, top: false, bottom: true, back: true,
      },
      isAppliance: true,
      shelfCount: 0,
      requiresSupport: false,
    },
    {
      name: "Mikrofala",
      dimensions: { width: 600, height: 300, depth: 500 },
      basePrice: 600,
      material: {
        type: "MDF",
        pricePerM2: 0,
        thickness: 0,
        color: "#111111", // Black glass
      },
      frontType: "Szkło",
      hardware: [],
      snapPoints: {
        left: false, right: false, top: false, bottom: true, back: true,
      },
      isAppliance: true,
      shelfCount: 0,
      requiresSupport: false,
    },
  ],
};
