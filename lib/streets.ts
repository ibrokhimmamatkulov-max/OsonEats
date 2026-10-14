import type { City } from "./data";

// Mock street index used for suggestions and for naming the point under the map pin.
// Replace with a real geocoder (2GIS / Yandex / Mahal) in lib/api.ts.
export const STREETS: Record<City, [name: string, lat: number, lng: number][]> = {
  Худжанд: [
    ["ул. Ленина", 40.2805, 69.63], ["пр. Исмоили Сомони", 40.2875, 69.629], ["ул. Камоли Худжанди", 40.2858, 69.638],
    ["ул. Гагарина", 40.283, 69.64], ["ул. Рахмона Набиева", 40.278, 69.642], ["ул. Мавлонбекова", 40.29, 69.636],
    ["ул. Сырдарьинская", 40.2925, 69.625], ["ул. Айни", 40.281, 69.62], ["ул. Ибн Сины", 40.276, 69.633],
    ["12-й микрорайон", 40.272, 69.625], ["18-й микрорайон", 40.27, 69.64], ["ул. Бободжона Гафурова", 40.285, 69.615],
  ],
  Душанбе: [
    ["пр. Рудаки", 38.57, 68.786], ["ул. Айни", 38.56, 68.8], ["ул. Шотемура", 38.577, 68.78],
    ["ул. Бохтар", 38.564, 68.77], ["пр. Исмоили Сомони", 38.58, 68.77], ["ул. Мирзо Турсунзаде", 38.573, 68.79],
  ],
};

/** delivery zone radius around the city centre, km (real zones should be polygons from the dispatcher) */
export const ZONE_KM = 6;
