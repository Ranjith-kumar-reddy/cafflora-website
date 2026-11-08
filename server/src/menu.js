import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// The Cafflora menu. Prices are in rupees.
// Item ids double as photo file names: client/public/images/menu/<id>.jpg (800x800 square)

export const CATEGORIES = [
  { id: 'espresso-bar', name: 'Espresso bar', description: 'Pulled from our house Chikmagalur blend' },
  { id: 'filter-brew', name: 'Filter and brew', description: 'Slow coffee, brewed by hand' },
  { id: 'cold', name: 'Cold coffee', description: 'For long Bengaluru afternoons' },
  { id: 'signature', name: 'Cafflora signatures', description: 'Recipes you will only find here' },
  { id: 'snacks', name: 'Chai and snacks', description: 'Evening favourites, fried fresh to order' },
  { id: 'bites', name: 'Bites and brunch', description: 'Baked and grilled fresh through the day' },
  { id: 'sweets', name: 'Shakes and sweets', description: 'For when your coffee wants company' },
];

export const MENU = [
  // Espresso bar
  { id: 'espresso', category: 'espresso-bar', name: 'Espresso', notes: 'A double shot of our house blend', price: 140 },
  { id: 'americano', category: 'espresso-bar', name: 'Americano', notes: 'Espresso lengthened with hot water', price: 170 },
  { id: 'cappuccino', category: 'espresso-bar', name: 'Cappuccino', notes: 'Espresso, steamed milk and a deep layer of foam', price: 200 },
  { id: 'cafe-latte', category: 'espresso-bar', name: 'Café latte', notes: 'Espresso with silky steamed milk', price: 210 },
  { id: 'flat-white', category: 'espresso-bar', name: 'Flat white', notes: 'A stronger, velvety latte with thin microfoam', price: 220 },
  { id: 'mocha', category: 'espresso-bar', name: 'Mocha', notes: 'Espresso, dark chocolate and steamed milk', price: 240 },

  // Filter and brew
  { id: 'pour-over', category: 'filter-brew', name: 'Single-estate pour-over', notes: "Hand-poured V60 from this week's estate", price: 260 },
  { id: 'french-press', category: 'filter-brew', name: 'French press', notes: 'Full-bodied, steeped for four minutes', price: 240 },
  { id: 'aeropress', category: 'filter-brew', name: 'AeroPress', notes: 'Clean and bright, pressed to order', price: 250 },
  { id: 'chemex', category: 'filter-brew', name: 'Chemex for two', notes: 'A slow, clear brew to share', price: 420 },

  // Cold coffee
  { id: 'cold-brew', category: 'cold', name: 'Cold brew', notes: 'Steeped for 18 hours, served over ice with a caramel drizzle', price: 220 },
  { id: 'nitro-cold-brew', category: 'cold', name: 'Nitro cold brew', notes: 'Cold brew on nitrogen, finished with sweet cream', price: 280 },
  { id: 'iced-latte', category: 'cold', name: 'Iced latte', notes: 'Espresso and cold milk over ice', price: 220 },
  { id: 'iced-caramel-latte', category: 'cold', name: 'Iced caramel latte', notes: 'Espresso poured over cold milk, ice and caramel', price: 240 },
  { id: 'cold-coffee', category: 'cold', name: 'Classic cold coffee', notes: 'Blended with milk and ice, topped with cream and chocolate', price: 190 },
  { id: 'iced-mocha', category: 'cold', name: 'Iced mocha', notes: 'Cold mocha with chocolate drizzle and toasted marshmallows', price: 250 },

  // Cafflora signatures
  { id: 'blossom-honey-latte', category: 'signature', name: 'Coffee blossom honey latte', notes: 'Sweetened with honey from Coorg coffee blossoms', price: 280 },
  { id: 'rose-cardamom-latte', category: 'signature', name: 'Rose cardamom latte', notes: 'Rose petal syrup and green cardamom', price: 270 },
  { id: 'saffron-cortado', category: 'signature', name: 'Saffron cortado', notes: 'Kashmiri saffron with espresso and warm milk', price: 290 },
  { id: 'dark-chocolate-mocha', category: 'signature', name: 'Dark chocolate mocha', notes: 'Layers of espresso, steamed milk and melted dark chocolate', price: 290 },
  { id: 'mocha-mousse', category: 'signature', name: 'Mocha mousse', notes: 'Espresso topped with whipped chocolate mousse and cocoa', price: 300 },
  { id: 'coorg-pepper-black', category: 'signature', name: 'Coorg pepper black', notes: 'Black coffee from our Coorg beans with a hint of black pepper', price: 200 },
  { id: 'caramel-biscuit-latte', category: 'signature', name: 'Caramel biscuit latte', notes: 'Latte with a caramelised biscuit-crumb rim and a biscuit on top', price: 280 },

  // Chai and snacks
  { id: 'masala-chai', category: 'snacks', name: 'Masala chai', notes: 'Strong tea simmered with milk, ginger and cardamom', price: 60 },
  { id: 'samosa', category: 'snacks', name: 'Samosa', notes: 'Two crisp samosas with spiced potato and peas, with mint chutney', price: 60 },
  { id: 'mirchi-bajji', category: 'snacks', name: 'Mirchi bajji', notes: 'Long green chillies in gram flour batter, fried golden', price: 90 },
  { id: 'bread-pakoda', category: 'snacks', name: 'Bread pakoda', notes: 'Spiced potato between bread, dipped in batter and fried', price: 110 },
  { id: 'palak-pakoda', category: 'snacks', name: 'Palak pakoda', notes: 'Crisp spinach and gram flour fritters with mint chutney', price: 120 },
  { id: 'masala-vada', category: 'snacks', name: 'Masala vada', notes: 'Crunchy chana dal vadas with onion and curry leaves', price: 100 },
  { id: 'chai-time-platter', category: 'snacks', name: 'Chai-time platter', notes: 'Aloo tikki, paneer tikka, chole pockets and gulab jamun, for two', price: 380 },

  // Bites and brunch
  { id: 'herb-cheese-puff', category: 'bites', name: 'Herb cheese puff', notes: 'Flaky puff pastry filled with herbed cream cheese', price: 160 },
  { id: 'ham-cheese-puff', category: 'bites', name: 'Ham and cheese puff', notes: 'Buttery pastry with smoked ham and melted cheese', price: 190 },
  { id: 'veg-grilled-sandwich', category: 'bites', name: 'Veg cheese grilled sandwich', notes: 'Tomato, cucumber, onion and cheese with green chutney', price: 180 },
  { id: 'paneer-tikka-sandwich', category: 'bites', name: 'Paneer tikka sandwich', notes: 'Spiced paneer, peppers and cheese, grilled, with masala fries', price: 240 },
  { id: 'classic-burger', category: 'bites', name: 'Classic burger', notes: 'Grilled patty, cheddar, crispy bacon and pickles, with salad and chips', price: 320 },
  { id: 'french-toast', category: 'bites', name: 'Brioche French toast', notes: 'With vanilla ice cream, berries, banana and chocolate', price: 260 },

  // Shakes and sweets
  { id: 'cookies-cream-shake', category: 'sweets', name: 'Cookies and cream shake', notes: 'Vanilla ice cream blended with chocolate sandwich cookies', price: 220 },
  { id: 'fudge-cookie-shake', category: 'sweets', name: 'Fudge cookie shake', notes: 'Cookies and cream with hot fudge and a cookie-crumb rim', price: 240 },
  { id: 'chocolate-donut-shake', category: 'sweets', name: 'Chocolate donut shake', notes: 'Thick chocolate shake crowned with cream and a glazed donut', price: 280 },
  { id: 'peanut-butter-shake', category: 'sweets', name: 'Peanut butter shake', notes: 'Chocolate, peanut butter and caramel, topped with roasted peanuts', price: 250 },
  { id: 'chocolate-chunk-cookie', category: 'sweets', name: 'Chocolate chunk cookie', notes: 'Soft-baked with dark chocolate chunks and a pinch of sea salt', price: 110 },
  { id: 'espresso-bean-cookie', category: 'sweets', name: 'Espresso bean cookie', notes: 'Brown butter cookie baked with chocolate-coated espresso beans', price: 120 },
  { id: 'chocolate-nut-sundae', category: 'sweets', name: 'Chocolate nut sundae', notes: 'Chocolate ice cream with fudge and roasted nuts', price: 240 },
  { id: 'brownie-fudge-sundae', category: 'sweets', name: 'Brownie fudge sundae', notes: 'Chocolate ice cream, warm brownie and hot fudge', price: 260 },
  { id: 'vanilla-pecan-sundae', category: 'sweets', name: 'Vanilla pecan sundae', notes: 'Vanilla ice cream with pecans, almonds, coconut and chocolate', price: 250 },
];

// Photos can sit in the source folder (development) or the built site (production).
const PHOTO_DIRS = ['../../client/public/images/menu', '../../client/dist/images/menu']
  .map((dir) => fileURLToPath(new URL(`${dir}/`, import.meta.url)));

function photoFor(id) {
  const file = `${id}.jpg`;
  return PHOTO_DIRS.some((dir) => existsSync(path.join(dir, file))) ? `/images/menu/${file}` : null;
}

// The menu as sent to the website, with each drink's photo address (or null if none yet).
export function menuWithPhotos() {
  return MENU.map((item) => ({ ...item, photo: photoFor(item.id) }));
}
