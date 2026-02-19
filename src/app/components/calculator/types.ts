export interface Furniture {
  id: string;
  type: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  price: number;
  category: string;
}

export interface Room {
  width: number;
  height: number;
  points: { x: number; y: number }[];
}

export const FURNITURE_CATEGORIES = {
  "Szafki dolne": [
    { name: "Szafka D60", width: 60, height: 60, defaultPrice: 0 },
    { name: "Szafka D80", width: 80, height: 60, defaultPrice: 0 },
    { name: "Szafka D40", width: 40, height: 60, defaultPrice: 0 },
    { name: "Szafka narożna D", width: 60, height: 60, defaultPrice: 0 },
  ],
  "Szafki górne": [
    { name: "Szafka G60", width: 60, height: 70, defaultPrice: 0 },
    { name: "Szafka G80", width: 80, height: 70, defaultPrice: 0 },
    { name: "Szafka narożna G", width: 60, height: 70, defaultPrice: 0 },
  ],
  Blaty: [
    { name: "Blat 120cm", width: 120, height: 60, defaultPrice: 0 },
    { name: "Blat 180cm", width: 180, height: 60, defaultPrice: 0 },
    { name: "Blat 240cm", width: 240, height: 60, defaultPrice: 0 },
  ],
  AGD: [
    { name: "Piekarnik", width: 60, height: 60, defaultPrice: 0 },
    { name: "Zmywarka", width: 60, height: 60, defaultPrice: 0 },
    { name: "Lodówka", width: 60, height: 180, defaultPrice: 0 },
    { name: "Płyta indukcyjna", width: 60, height: 60, defaultPrice: 0 },
    { name: "Okap", width: 60, height: 60, defaultPrice: 0 },

  ],
  Półki: [
    { name: "Półka 60cm", width: 60, height: 20, defaultPrice: 0 },
    { name: "Półka 80cm", width: 80, height: 20, defaultPrice: 0 },
    { name: "Półka 120cm", width: 120, height: 20, defaultPrice: 0 },
    { name: "Półka narożna", width: 60, height: 20, defaultPrice: 0 },
  ],
};
