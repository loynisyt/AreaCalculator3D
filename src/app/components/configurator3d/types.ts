// Production-grade types for B2B furniture configurator

export type MaterialType = "MDF" | "Laminat" | "Fornir" | "Płyta melamina";
export type FrontType = "Gładki" | "Frezowany" | "Szkło" | "Lustro";
export type FurnitureCategory =
  | "Szafka dolna"
  | "Szafka górna"
  | "Blat"
  | "AGD"
  | "Słupek"
  | "Wyspa";

  export interface TextureMaps {
  baseColor: string;   // Główny plik mapy (albedo)
  frontColor?: string;       // <--- DODAJ TĘ LINIJKĘ
  normal?: string;    // Mapa nierówności (daje efekt głębi słoja drewna)
  roughness?: string; // Mapa chropowatości (mat vs połysk)
  ambientOcclusion?: string; // Cienie w zakamarkach
  repeat?: [number, number]; // Skalowanie tekstury (np. [2, 2])
}

export interface Material {
  type: MaterialType;
  pricePerM2: number; // Price per square meter
  thickness: number; // in mm
  color: string; // Hex color for 3D visualization
  textures?: TextureMaps; // Optional texture maps for 3D rendering
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

// Predefined furniture catalog
export const FURNITURE_CATALOG = {
  "Szafki dolne": [
    {
      name: "Szafka Podstawowa",
      dimensions: { width: 600, height: 850, depth: 600 },
      basePrice: 450,
      material: {
        type: "Płyta melamina" as MaterialType,
        pricePerM2: 85,
        thickness: 18,
        color: "#8B6F47",
        textures: {
          frontColor: "/textures/Wood094_1K-JPG_Color.jpg",
          baseColor: "/textures/Wood094_1K-JPG_Color.jpg",
          normal: "/textures/Wood094_1K-JPG_NormalDX.jpg",
          roughness: "/textures/Wood094_1K-JPG_Roughness.jpg",
        },
      },
      frontType: "Gładki" as FrontType,
      hardware: [
        { name: "Zawiasy", quantity: 4, pricePerUnit: 8 },
        { name: "Nóżki", quantity: 4, pricePerUnit: 12 },
        { name: "Uchwyt", quantity: 1, pricePerUnit: 25 },
      ],
      snapPoints: {
        left: true,
        right: true,
        top: true,
        bottom: false,
        back: true,
      },
      isAppliance: false,
      requiresSupport: true,
    },
    {
      name: "Szafka z szufladami",
      dimensions: { width: 800, height: 850, depth: 600 },
      basePrice: 520,
      material: {
        type: "Płyta melamina" as MaterialType,
        pricePerM2: 85,
        thickness: 18,
        color: "#A0826D",
        textures: {
          frontColor: "/textures/Wood094_1K-JPG_Color.jpg",
          baseColor: "/textures/Wood094_1K-JPG_Color.jpg",
          normal: "/textures/Wood094_1K-JPG_NormalDX.jpg",
          roughness: "/textures/Wood094_1K-JPG_Roughness.jpg",
        },
      },
      frontType: "Gładki" as FrontType,
      hardware: [
        { name: "Zawiasy", quantity: 4, pricePerUnit: 8 },
        { name: "Nóżki", quantity: 4, pricePerUnit: 12 },
        { name: "Uchwyt", quantity: 3, pricePerUnit: 25 }, // Zależne od guides, domyślnie tak jak guides
      ],
      snapPoints: {
        left: true,
        right: true,
        top: true,
        bottom: false,
        back: true,
      },
      isAppliance: false,
      guides: 3, // custom property
      requiresSupport: true,
    },
    {
      name: "Szafka narożna D",
      dimensions: { width: 900, height: 850, depth: 900 },
      basePrice: 680,
      material: {
        type: "Płyta melamina" as MaterialType,
        pricePerM2: 85,
        thickness: 18,
        color: "#8B6F47",
        textures: {
          frontColor: "/textures/Wood094_1K-JPG_Color.jpg",
          baseColor: "/textures/Wood094_1K-JPG_Color.jpg",
          normal: "/textures/Wood094_1K-JPG_NormalDX.jpg",
          roughness: "/textures/Wood094_1K-JPG_Roughness.jpg",
        },
      },
      frontType: "Gładki" as FrontType,
      hardware: [
        { name: "Zawiasy", quantity: 3, pricePerUnit: 8 },
        { name: "Nóżki", quantity: 6, pricePerUnit: 12 },
        { name: "Karuzela narożna", quantity: 2, pricePerUnit: 180 },
      ],
      snapPoints: {
        left: true,
        right: true,
        top: true,
        bottom: false,
        back: true,
      },
      isAppliance: false,
      shelfCount: 1,

      requiresSupport: true,
    },
    {
      name: "Zmywarka",
      dimensions: { width: 600, height: 820, depth: 550 },
      basePrice: 2100,
      material: {
        type: "MDF" as MaterialType,
        pricePerM2: 0,
        thickness: 0,
        color: "#2C3E50",
      },
      frontType: "Gładki" as FrontType,
      hardware: [],
      snapPoints: {
        left: false,
        right: false,
        top: false,
        bottom: false,
        back: true,
      },
      isAppliance: true,

      requiresSupport: true,
    },
  ],
  "Szafki górne": [
    {
      name: "Szafka Podstawowa",
      dimensions: { width: 600, height: 700, depth: 350 },
      basePrice: 380,
      material: {
        type: "Płyta melamina" as MaterialType,
        pricePerM2: 85,
        thickness: 18,
        color: "#B8956A",
        textures: {
          frontColor: "/textures/Wood094_1K-JPG_Color.jpg",
          baseColor: "/textures/Wood094_1K-JPG_Color.jpg",
          normal: "/textures/Wood094_1K-JPG_NormalDX.jpg",
          roughness: "/textures/Wood094_1K-JPG_Roughness.jpg",
        },
      },
      frontType: "Gładki" as FrontType,
      hardware: [
        { name: "Zawiasy", quantity: 4, pricePerUnit: 8 },
        { name: "Uchwyt", quantity: 1, pricePerUnit: 25 },
      ],
      snapPoints: {
        left: true,
        right: true,
        top: false,
        bottom: true,
        back: true,
      },
      isAppliance: false,
      shelfCount: 2,

      requiresSupport: false,
    }
  ],
  Nadstawki: [
    {
      name: "Nadstawka Podstawowa",
      dimensions: { width: 600, height: 600, depth: 200 },
      basePrice: 300,
      material: {
        type: "Płyta melamina" as MaterialType,
        pricePerM2: 85,
        thickness: 18,
        color: "#F8956A",
        textures: {
          frontColor: "/textures/Wood094_1K-JPG_Color.jpg",
          baseColor: "/textures/Wood094_1K-JPG_Color.jpg",
          normal: "/textures/Wood094_1K-JPG_NormalDX.jpg",
          roughness: "/textures/Wood094_1K-JPG_Roughness.jpg",
        },
      },
      frontType: "Gładki" as FrontType,
      hardware: [
        { name: "Siłowniki", quantity: 2, pricePerUnit: 40 },
        { name: "Zawiasy", quantity: 2, pricePerUnit: 8 }, // dodano zawiasy
      ],
      snapPoints: {
        left: true,
        right: true,
        top: false,
        bottom: true,
        back: true,
      },
      isAppliance: false,
      shelfCount: 1,

      requiresSupport: false,
    }
  ],
  Blaty: [
    {
      name: "Blat 60cm",
      dimensions: { width: 600, height: 40, depth: 600 },
      basePrice: 150,
      material: {
        type: "Laminat" as MaterialType,
        pricePerM2: 120,
        thickness: 40,
        color: "#2C3E50",
        textures: {
          baseColor: "/textures/Marble01_1K-JPG_Color.jpg",
          normal: "/textures/Marble01_1K-JPG_NormalDX.jpg",
          roughness: "/textures/Marble01_1K-JPG_Roughness.jpg",
          repeat: [1, 1] as [number, number],
        },
      },
      frontType: "Gładki" as FrontType,
      hardware: [
        { name: "Klej montażowy", quantity: 1, pricePerUnit: 45 },
      ],
      snapPoints: {
        left: true,
        right: true,
        top: false,
        bottom: true,
        back: false,
      },
      isAppliance: false,

      requiresSupport: false,
    },
    {
      name: "Blat 120cm",
      dimensions: { width: 1200, height: 40, depth: 600 },
      basePrice: 290,
      material: {
        type: "Laminat" as MaterialType,
        pricePerM2: 120,
        thickness: 40,
        color: "#2C3E50",
        textures: {
          baseColor: "/textures/Marble01_1K-JPG_Color.jpg",
          normal: "/textures/Marble01_1K-JPG_NormalDX.jpg",
          roughness: "/textures/Marble01_1K-JPG_Roughness.jpg",
          repeat: [2, 1] as [number, number], // Powtarzanie dłuższego blatu
        },
      },
      frontType: "Gładki" as FrontType,
      hardware: [
        { name: "Klej montażowy", quantity: 1, pricePerUnit: 45 },
      ],
      snapPoints: {
        left: true,
        right: true,
        top: false,
        bottom: true,
        back: false,
      },
      isAppliance: false,

      requiresSupport: false,
    },
  ],
  AGD: [
    {
      name: "Piekarnik",
      dimensions: { width: 600, height: 600, depth: 550 },
      basePrice: 1800,
      material: {
        type: "MDF" as MaterialType,
        pricePerM2: 0,
        thickness: 0,
        color: "#34495E",
      },
      frontType: "Gładki" as FrontType,
      hardware: [
        { name: "Prowadnice montażowe", quantity: 2, pricePerUnit: 40 },
      ],
      snapPoints: {
        left: false,
        right: false,
        top: false,
        bottom: false,
        back: true,
      },
      isAppliance: true,
      requiresSupport: true,
    },
    {
      name: "Okap",
      dimensions: { width: 600, height: 150, depth: 500 },
      basePrice: 850,
      material: {
        type: "MDF" as MaterialType,
        pricePerM2: 0,
        thickness: 0,
        color: "#95A5A6",
      },
      frontType: "Gładki" as FrontType,
      hardware: [{ name: "Uchwyty montażowe", quantity: 2, pricePerUnit: 25 }],
      snapPoints: {
        left: false,
        right: false,
        top: false,
        bottom: true,
        back: true,
      },
      isAppliance: true,
      shelfCount: 0,
      requiresSupport: false,
    },
    {
      name: "Mikrofala",
      dimensions: { width: 600, height: 300, depth: 500 },
      basePrice: 850,
      material: {
        type: "MDF" as MaterialType,
        pricePerM2: 0,
        thickness: 0,
        color: "#95A5A6",
      },
      frontType: "Szkło" as FrontType,
      hardware: [],
      snapPoints: {
        left: false,
        right: false,
        top: false,
        bottom: true,
        back: true,
      },
      isAppliance: true,
      shelfCount: 0,
      requiresSupport: false,
    },
  ],
};
