// Mock catalogue. Shapes mirror what the API should return; swap the exports
// for fetch calls (see lib/api.ts) once the backend endpoints exist.
// Панда's menu names and prices are real (osoneats.com); photos are TheMealDB placeholders.

export const CU = "https://osoneats.com/assets/cuisines/";
export const M = "https://www.themealdb.com/images/media/meals/";
const YORON_LOGO =
  "https://console.osoneats.com/media/venues/1bc5d36f-12f8-47a4-9f1f-498301b64369/logo-a87ee226-e28d-47a3-a3f1-d3e6b5967efc.webp";

export type Cuisine = { id: string; name: string };
export const CUISINES: Cuisine[] = [
  ["tajik", "Таджикская"], ["chinese", "Китайская"], ["european", "Европейская"], ["plov", "Плов"],
  ["shashlik", "Шашлыки"], ["pizza", "Пицца"], ["burgers", "Бургеры"], ["sushi", "Суши"],
  ["shawarma", "Шаурма"], ["oriental", "Восточная"], ["turkish", "Турецкая"], ["uzbek", "Узбекская"],
  ["korean", "Корейская"], ["bakery", "Выпечка"], ["desserts", "Десерты"], ["coffee", "Кофе"],
].map(([id, name]) => ({ id, name }));

export type VenueMode = "pickup" | "delivery" | "menu";
export type Venue = {
  id: string;
  name: string;
  meta: string;
  cuisines: string[];
  mode: VenueMode;
  hours: [open: string, close: string];
  isNew?: boolean;
  cover: string;
  logo?: string;
  pickupAddress: string;
  ll: [number, number];
};

export const VENUES: Venue[] = [
  {
    id: "panda", name: "Панда", meta: "Китайская · чек ~120 с.", cuisines: ["chinese"], mode: "pickup",
    hours: ["10:00", "23:00"], isNew: true, cover: M + "pbzcrx1763765096.jpg",
    pickupAddress: "ул. Камоли Худжанди, 12", ll: [40.2862, 69.6398],
  },
  {
    id: "yoron", name: "Ёрон", meta: "Национальная, Европейская · чек ~150 с.",
    cuisines: ["tajik", "european", "plov", "shashlik"], mode: "menu", hours: ["09:00", "22:00"], isNew: true,
    cover: M + "1nalo51765188375.jpg", logo: YORON_LOGO, pickupAddress: "пр. Исмоили Сомони, 8", ll: [40.2836, 69.6352],
  },
];

export type Dish = {
  id: string;
  name: string;
  price: number;
  img: string;
  venueId: string;
  weight: string;
  category: string;
  desc?: string;
  nutrition?: [kcal: number, protein: number, fat: number, carbs: number];
};

type Row = [id: string, name: string, price: number, img: string, weight: string];
const MENU_ROWS: Record<string, [category: string, rows: Row[]][]> = {
  panda: [
    ["Лагман", [
      ["p-lag1", "Фирменный лагман Панда", 39, "zry07j1763779321", "400 г"],
      ["p-lag2", "Лагман с китайской капустой", 35, "118oj61763423896", "400 г"],
      ["p-lag3", "Лагман, мясо с баклажаном", 38, "rvypwy1503069308", "400 г"],
      ["lagman", "Жареный лагман", 39, "1529444830", "400 г"],
      ["p-lag5", "Жареный динг-динг лагман", 39, "st9shl1763755808", "380 г"],
      ["p-lag6", "Суп-лапша с говядиной", 49, "pbzcrx1763765096", "450 мл"],
    ]],
    ["Рис", [
      ["p-r1", "Рис с говядиной", 49, "bc8v651619789840", "350 г"],
      ["p-r2", "Рис с бараниной", 55, "cgl60b1683206581", "350 г"],
      ["rice", "Жареный рис с курицей", 35, "wuyd2h1765655837", "350 г"],
      ["p-r4", "Жареный рис с яйцом", 33, "kw92t41604181871", "300 г"],
    ]],
    ["Горячее", [
      ["sticky", "Курица в кисло-сладком", 49, "cj56fs1762340001", "320 г"],
      ["p-h1", "Курица со свежим перцом", 79, "tyywsw1505930373", "на 2–4 персоны"],
      ["p-h2", "Баранина со свежим перцом", 98, "pn59o51628769837", "на 2–4 персоны"],
      ["p-h3", "Острая говяжья вырезка", 92, "vvstvq1487342592", "на 2–4 персоны"],
      ["p-h4", "Говядина с грибами", 60, "1529446352", "на 2–4 персоны"],
      ["p-h5", "Доуфу с перцем", 69, "yx8j1i1763484612", "300 г"],
    ]],
    ["Супы", [
      ["p-s1", "Синьцзянский суп", 39, "x2fw9e1560460636", "на 2–4 персоны"],
      ["eggsoup", "Суп с яйцом", 29, "1529446137", "350 мл"],
    ]],
    ["Закуски", [
      ["p-z1", "Огурец с чесноком", 18, "7ytdtz1784833420", "200 г"],
      ["p-z2", "Фунчоза с капустой", 36, "6g3rso1763486069", "250 г"],
      ["p-z3", "Баклажан с перцем", 32, "paejva1765321314", "250 г"],
      ["p-z4", "Рисовые пельмени", 28, "sfahy01763752319", "8 шт"],
    ]],
  ],
  yoron: [
    ["Плов и горячее", [
      ["plov", "Плов по-худжандски", 45, "kos9av1699014767", "450 г"],
      ["y-1", "Казан-кабоб", 65, "1nalo51765188375", "400 г"],
      ["y-2", "Жаркое из баранины", 58, "yuwtuu1511295751", "380 г"],
      ["y-3", "Бирьяни с бараниной", 52, "xrttsx1487339558", "400 г"],
    ]],
    ["Манты и выпечка", [
      ["mantu", "Манты с бараниной", 38, "oemdp11779556068", "4 шт · 360 г"],
      ["y-4", "Лепёшка тандырная", 4, "54xzk31760524666", "1 шт"],
    ]],
    ["Шашлык", [
      ["kebab", "Шашлык из баранины", 55, "04axct1763793018", "3 шампура"],
      ["y-5", "Шашлык из курицы", 38, "prjve31763486864", "3 шампура"],
    ]],
    ["Супы", [
      ["shurpa", "Шурпа", 30, "t8mn9g1560460231", "400 мл"],
      ["y-6", "Мастава", 28, "sqpqtp1515365614", "400 мл"],
    ]],
    ["Салаты", [
      ["salad", "Салат «Шопский»", 22, "bqx8mc1782684286", "250 г"],
      ["y-7", "Салат с гранатом", 26, "fqpqml1764359125", "220 г"],
    ]],
    ["Шаурма и бургеры", [
      ["shawarma", "Шаурма куриная", 25, "kcv6hj1598733479", "1 шт"],
      ["y-8", "Кофта-бургер", 34, "lgmnff1763789847", "1 шт"],
    ]],
    ["Десерты", [["y-9", "Шоколадный торт", 24, "tqtywx1468317395", "1 кусок"]]],
  ],
};

const DETAILS: Record<string, [desc: string, nutrition: [number, number, number, number]]> = {
  plov: ["Девзира, молодая баранина, жёлтая морковь и нут. Готовим в казане.", [245, 9, 12, 25]],
  mantu: ["Тонкое тесто, рубленая баранина с луком. На пару, со сметаной.", [220, 11, 10, 21]],
  lagman: ["Тянутая вручную лапша, говядина, перец и стручковая фасоль.", [180, 9, 7, 20]],
  kebab: ["Мякоть баранины в маринаде с зирой, лук и зелень.", [290, 19, 23, 2]],
  sticky: ["Куриные голени в кисло-сладком соусе с кунжутом.", [230, 17, 12, 14]],
  shurpa: ["Наваристый бульон из баранины, картофель, морковь, нут.", [85, 6, 5, 4]],
  rice: ["Жасминовый рис, курица, яйцо, кукуруза и горошек.", [175, 8, 6, 22]],
  shawarma: ["Курица на гриле, свежие овощи и чесночный соус в лаваше.", [210, 12, 9, 20]],
  salad: ["Томаты, огурцы, сладкий перец, лук и брынза.", [95, 4, 7, 4]],
  eggsoup: ["Куриный бульон, яичные хлопья, зелёный лук.", [45, 3, 2, 3]],
};

export const MENUS: Record<string, { category: string; dishes: Dish[] }[]> = Object.fromEntries(
  Object.entries(MENU_ROWS).map(([venueId, cats]) => [
    venueId,
    cats.map(([category, rows]) => ({
      category,
      dishes: rows.map(([id, name, price, img, weight]) => ({
        id, name, price, img: M + img + ".jpg", venueId, weight, category,
        desc: DETAILS[id]?.[0], nutrition: DETAILS[id]?.[1],
      })),
    })),
  ]),
);

export const ALL_DISHES: Dish[] = Object.values(MENUS).flatMap((cats) => cats.flatMap((c) => c.dishes));

// "Популярные блюда" on the home screen
export const POPULAR_IDS = ["plov", "mantu", "lagman", "kebab", "sticky", "shurpa", "rice", "shawarma", "salad", "eggsoup"];

export type OptionGroup = { type: "radio" | "check"; title: string; options: [label: string, price: number][] };
export const OPTIONS: Record<string, OptionGroup[]> = {
  yoron: [
    { type: "radio", title: "Порция", options: [["Обычная", 0], ["Большая · ×1,5", 15]] },
    { type: "check", title: "Добавки", options: [["Лепёшка", 4], ["Салат ачичук", 10], ["Перепелиные яйца", 6], ["Казы", 18]] },
  ],
  panda: [
    { type: "radio", title: "Острота", options: [["Не острое", 0], ["Чуть острое", 0], ["Острое", 0]] },
    { type: "check", title: "Добавки", options: [["Ещё порция лапши или риса", 8], ["Яйцо", 5], ["Кунжут", 2]] },
  ],
};

export type Place = {
  id: string;
  name: string;
  meta: string;
  kind: "cafe" | "rest" | "coffee";
  cuisines: string[];
  cover: string;
  logo?: string;
  tag: string;
  addr: string;
  ll: [number, number];
  hours: [weekdays: [string, string], weekend: [string, string]];
  features: string[];
  desc: string;
  photos: string[];
  menu?: [name: string, price: number, img: string][];
};

export const PLACES: Place[] = [
  {
    id: "yoron", name: "Ёрон", meta: "Кафе · чек ~150 с.", kind: "cafe", cuisines: ["tajik", "european"],
    cover: M + "kos9av1699014767.jpg", logo: YORON_LOGO, tag: "Терраса", addr: "пр. Исмоили Сомони, 8", ll: [40.2836, 69.6352],
    hours: [["09:00", "22:00"], ["10:00", "23:00"]], features: ["Терраса", "Фонтан во дворе", "Wi-Fi", "Парковка", "Детское меню"],
    desc: "Национальная и европейская кухня, большой двор с фонтаном. Хорошо для семейного ужина.",
    photos: ["https://console.osoneats.com/media/venues/1bc5d36f-12f8-47a4-9f1f-498301b64369/facade-45a47240-59e8-45d8-9474-a8aa17d57a4f.webp", M + "kos9av1699014767.jpg", M + "04axct1763793018.jpg"],
  },
  {
    id: "panda", name: "Панда", meta: "Ресторан · чек ~120 с.", kind: "rest", cuisines: ["chinese"],
    cover: M + "1529444830.jpg", tag: "Зал на 40 мест", addr: "ул. Камоли Худжанди, 12", ll: [40.2862, 69.6398],
    hours: [["10:00", "23:00"], ["10:00", "23:00"]], features: ["Зал на 40 мест", "Wi-Fi", "Блюда на компанию"],
    desc: "Китайская кухня: тянутый лагман, рис и горячее на 2–4 персоны.",
    photos: ["https://osoneats.com/assets/venues/panda/253586.jpg", M + "1529444830.jpg", M + "tyywsw1505930373.jpg"],
  },
  {
    id: "somon", name: "Чайхона Сомон", meta: "Чайхона · чек ~90 с.", kind: "cafe", cuisines: ["tajik", "plov"],
    cover: M + "yuwtuu1511295751.jpg", tag: "Топчаны", addr: "ул. Айни, 21", ll: [40.2812, 69.6205],
    hours: [["07:00", "23:00"], ["07:00", "23:00"]], features: ["Топчаны", "Плов по пятницам", "Чай бесплатно"],
    desc: "Классическая чайхона: плов из казана, шурпа и чай на топчанах в тени.",
    photos: [M + "yuwtuu1511295751.jpg", M + "kos9av1699014767.jpg", M + "54xzk31760524666.jpg"],
    menu: [["Плов", 40, "kos9av1699014767"], ["Шурпа", 28, "t8mn9g1560460231"], ["Жаркое", 52, "yuwtuu1511295751"], ["Лепёшка", 4, "54xzk31760524666"]],
  },
  {
    id: "nur", name: "Кофейня Нур", meta: "Кофейня · чек ~60 с.", kind: "coffee", cuisines: ["coffee", "desserts"],
    cover: M + "tqtywx1468317395.jpg", tag: "Десерты", addr: "ул. Гагарина, 7", ll: [40.283, 69.6385],
    hours: [["08:00", "21:00"], ["09:00", "22:00"]], features: ["Десерты", "Wi-Fi", "Розетки у столов"],
    desc: "Небольшая кофейня с десертами собственного приготовления.",
    photos: [M + "tqtywx1468317395.jpg", M + "hqaejl1695738653.jpg", M + "lmc6r51764365554.jpg"],
    menu: [["Шоколадный торт", 24, "tqtywx1468317395"], ["Омлет на завтрак", 22, "hqaejl1695738653"], ["Ржаной хлеб", 8, "lmc6r51764365554"], ["Сэндвич", 26, "i8l2fu1763742525"]],
  },
  {
    id: "syrdarya", name: "Шашлычная у Сырдарьи", meta: "Ресторан · чек ~140 с.", kind: "rest", cuisines: ["shashlik"],
    cover: M + "pkopc31683207947.jpg", tag: "Вид на реку", addr: "ул. Сырдарьинская, 3", ll: [40.2925, 69.625],
    hours: [["12:00", "00:00"], ["12:00", "00:00"]], features: ["Вид на реку", "Летняя веранда", "Мангал на углях"],
    desc: "Шашлык на углях и веранда у Сырдарьи. Вечером лучше бронировать.",
    photos: [M + "pkopc31683207947.jpg", M + "04axct1763793018.jpg", M + "prjve31763486864.jpg"],
    menu: [["Шашлык из баранины", 55, "04axct1763793018"], ["Шашлык из курицы", 38, "prjve31763486864"], ["Асадо", 72, "pkopc31683207947"], ["Баранина на углях", 68, "pn59o51628769837"]],
  },
];

export const CITIES = { Худжанд: [40.283, 69.633], Душанбе: [38.568, 68.786] } as const;
export type City = keyof typeof CITIES;

export const DELIVERY_FEE = 10;
export const FREE_DELIVERY_FROM = 150;
