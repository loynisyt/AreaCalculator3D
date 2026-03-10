import { Furniture3D, PanelCut, ProductionOutput, Hardware } from "./types";

export class ProductionCalculator {
  // Oblicz powierzchnię płyt dla pojedynczego mebla (m²)
  static calculatePanelArea(furniture: Furniture3D): number {
    const { width, height, depth } = furniture.dimensions;
    const t = furniture.material.thickness; // Grubość w mm
    const liczbaPolek = furniture.shelfCount || 0;

    // Konwersja mm na metry
    const w = width / 1000;
    const h = height / 1000;
    const d = depth / 1000;
    const tM = t / 1000;

    const dProd = d - tM;
    
    if (furniture.isAppliance) {
      return 0; // AGD nie wymaga rozkroju płyt
    }

    // Uproszczone obliczenia: 2 boki + wieniec górny/dolny + 1 plecy + półki
    const boki = 2 * (h - tM * 2) * d;          // Lewy i Prawy panel
    const wiency = 2 * (w * d);        // Góra i Dół
    const przod = w * h;               // Płyta hdf/plecy
    
    // Szacunkowo 2 półki na szafkę
    const powierzchniaPolek = liczbaPolek * ((w - 2 * tM) * dProd);
    const powierzchniaCalkowita = boki + wiency + przod + powierzchniaPolek;

    return powierzchniaCalkowita;
  }

  // Generuj listę formatek (rozkrój) dla wszystkich mebli
  static generateCuttingList(furniture: Furniture3D[]): PanelCut[] {
    const formatki: PanelCut[] = [];

    furniture.forEach((item) => {
      if (item.isAppliance) return;

      const { width, height, depth } = item.dimensions;
      const t = item.material.thickness;

      // Boki (2x)
      formatki.push({
        furnitureId: item.id,
        furnitureName: item.name,
        panelType: "Bok",
        width: depth - t,
        height: height,
        quantity: 2,
        material: item.material.type,
      });

      // Wieniec Górny i Dolny (2x)
      formatki.push({
        furnitureId: item.id,
        furnitureName: item.name,
        panelType: "Wieniec",
        width: width - 2 * t,
        height: depth - t,
        quantity: 2,
        material: item.material.type,
      });

      // Plecy (1x) - zazwyczaj HDF 3mm
      formatki.push({
        furnitureId: item.id,
        furnitureName: item.name,
        panelType: "Plecy (HDF)",
        width: width - 2 * t,
        height: height - 2 * t,
        quantity: 1,
        material: item.material.type,
      });

      // Półki wewnętrzne (zakładamy 2 sztuki)
      formatki.push({
        furnitureId: item.id,
        furnitureName: item.name,
        panelType: "Półka wewnętrzna",
        width: width - 2 * t,
        height: depth - t,
        quantity: 2,
        material: item.material.type,
      });

      // Front
      if (item.category !== "Blat") {
        formatki.push({
          furnitureId: item.id,
          furnitureName: item.name,
          panelType: "Front",
          width: width,
          height: height,
          quantity: 1,
          material: item.material.type,
        });
      }
    });

    return formatki;
  }

  // Oblicz całkowite dane produkcyjne zamówienia
  static calculateProduction(furniture: Furniture3D[]): ProductionOutput {
    let calkowitaPowierzchniaPlyt = 0;
    let cenaCalkowita = 0;
    const zbiorczeOkucia: Map<string, Hardware> = new Map();
    let calkowitaWaga = 0;

    furniture.forEach((item) => {
      // Powierzchnia płyt
      const powierzchnia = this.calculatePanelArea(item);
      calkowitaPowierzchniaPlyt += powierzchnia;

      // Kalkulacja ceny
      const kosztMaterialu = powierzchnia * item.material.pricePerM2;
      const kosztOkuc = item.hardware.reduce(
        (suma, okucie) => {
          let qty = okucie.quantity;
          if (item.guides && (okucie.name === "Uchwyt" || okucie.name === "Prowadnice")) {
            qty = item.guides;
          }
          return suma + qty * okucie.pricePerUnit;
        },
        0
      );
      
      const cenaElementu = item.basePrice + kosztMaterialu + kosztOkuc;
      cenaCalkowita += cenaElementu;

      // Agregacja okuć
      item.hardware.forEach((okucie) => {
        const klucz = okucie.name;
        let qty = okucie.quantity;
        if (item.guides && (okucie.name === "Uchwyt" || okucie.name === "Prowadnice")) {
          qty = item.guides;
        }

        if (zbiorczeOkucia.has(klucz)) {
          const istniejace = zbiorczeOkucia.get(klucz)!;
          istniejace.quantity += qty;
        } else {
          zbiorczeOkucia.set(klucz, { ...okucie, quantity: qty });
        }
      });

      // Estymacja wagi (zakładamy 15 kg/m² dla płyty meblowej)
      calkowitaWaga += powierzchnia * 15;
    });

    const listaFormatek = this.generateCuttingList(furniture);
    const listaOkuc = Array.from(zbiorczeOkucia.values());

    return {
      panelCuttingList: listaFormatek,
      totalPanelArea: calkowitaPowierzchniaPlyt,
      totalPrice: cenaCalkowita,
      hardwareList: listaOkuc,
      totalWeight: calkowitaWaga,
    };
  }

  // Oblicz zmianę ceny przy zmianie wymiarów
  static calculateDimensionChangePrice(
    furniture: Furniture3D,
    noweWymiary: { width: number; height: number; depth: number }
  ): number {
    const oryginalnaPowierzchnia = this.calculatePanelArea(furniture);

    const tempMebelek = {
      ...furniture,
      dimensions: noweWymiary,
    };

    const nowaPowierzchnia = this.calculatePanelArea(tempMebelek);
    const roznicaPowierzchni = nowaPowierzchnia - oryginalnaPowierzchnia;
    const roznicaCeny = roznicaPowierzchni * furniture.material.pricePerM2;

    return furniture.basePrice + roznicaCeny;
  }
}