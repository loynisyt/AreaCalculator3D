import { PresetWall } from "./preset-manager";

export interface RoomPreset {
  id: string;
  name: string;
  walls: PresetWall[];
  thumbnail: string;
}

export const ROOM_PRESETS: RoomPreset[] = [
  {
    id: "rectangle",
    name: "Prostokąt",
    thumbnail: "/photos/room1.png",
    walls: [
      { length: 4000, angle: 0 },
      { length: 3000, angle: 90 },
      { length: 4000, angle: 180 },
      { length: 3000, angle: 270 }
    ]
  },
  {
    id: "square",
    name: "Kwadrat",
    thumbnail: "/photos/room2.png",
    walls: [
      { length: 3000, angle: 0 },
      { length: 3000, angle: 90 },
      { length: 3000, angle: 180 },
      { length: 3000, angle: 270 }
    ]
  },
  {
    id: "l-shape",
    name: "L-Shape",
    thumbnail: "/photos/room3.png",
    walls: [
      { length: 4000, angle: 0 },
      { length: 4000, angle: 90 },
      { length: 2000, angle: 180 },
      { length: 2000, angle: 270 },
      { length: 2000, angle: 180 },
      { length: 2000, angle: 270 }
    ]
  },
  {
    id: "open-space",
    name: "2 Ściany (Open Space)",
    thumbnail: "/photos/room4.png",
    walls: [
      { length: 4000, angle: 0 },
      { length: 3000, angle: 90 }
    ]
  },
  {
    id: "three-walls",
    name: "3 Ściany",
    thumbnail: "/photos/room5.png",
    walls: [
      { length: 3000, angle: 0 },
      { length: 4000, angle: 90 },
      { length: 3000, angle: 180 }
    ]
  },
  {
    id: "corridor",
    name: "Wąski Korytarz",
    thumbnail: "/photos/room6.png",
    walls: [
      { length: 5000, angle: 0 },
      { length: 1500, angle: 90 },
      { length: 5000, angle: 180 },
      { length: 1500, angle: 270 }
    ]
  },
  {
    id: "alcove",
    name: "Pokój z wnęką",
    thumbnail: "/photos/room7.png",
    walls: [
      { length: 5000, angle: 0 },
      { length: 4000, angle: 90 },
      { length: 2000, angle: 180 },
      { length: 1000, angle: 90 },
      { length: 3000, angle: 180 },
      { length: 5000, angle: 270 }
    ]
  }
];
