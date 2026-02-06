import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const seedProducts = [
  {
    slug: "chocolate-chip-cookies",
    name: "Chocolate Chip Cookies",
    description: "Soft-centered cookies with dark and milk chocolate chips.",
    priceCents: 450,
    category: "cookies",
    imageUrl: "https://picsum.photos/seed/chocolate-chip-cookies/1200/800",
    isAvailable: true
  },
  {
    slug: "fudgy-brownie-squares",
    name: "Fudgy Brownie Squares",
    description: "Dense cocoa brownies with a crackly top.",
    priceCents: 500,
    category: "brownies",
    imageUrl: "https://picsum.photos/seed/fudgy-brownie-squares/1200/800",
    isAvailable: true
  },
  {
    slug: "lemon-blueberry-loaf",
    name: "Lemon Blueberry Loaf",
    description: "Moist citrus loaf packed with blueberries.",
    priceCents: 900,
    category: "loaves",
    imageUrl: "https://picsum.photos/seed/lemon-blueberry-loaf/1200/800",
    isAvailable: true
  },
  {
    slug: "classic-cinnamon-roll",
    name: "Classic Cinnamon Roll",
    description: "Fluffy roll with brown sugar swirl and vanilla glaze.",
    priceCents: 550,
    category: "pastries",
    imageUrl: "https://picsum.photos/seed/classic-cinnamon-roll/1200/800",
    isAvailable: true
  },
  {
    slug: "red-velvet-cupcake",
    name: "Red Velvet Cupcake",
    description: "Buttermilk red velvet cupcake with cream cheese frosting.",
    priceCents: 425,
    category: "cupcakes",
    imageUrl: "https://picsum.photos/seed/red-velvet-cupcake/1200/800",
    isAvailable: true
  },
  {
    slug: "banana-walnut-muffin",
    name: "Banana Walnut Muffin",
    description: "Ripe banana muffin topped with toasted walnuts.",
    priceCents: 375,
    category: "muffins",
    imageUrl: "https://picsum.photos/seed/banana-walnut-muffin/1200/800",
    isAvailable: true
  },
  {
    slug: "strawberry-shortcake-jar",
    name: "Strawberry Shortcake Jar",
    description: "Layered vanilla sponge, whipped cream, and strawberries.",
    priceCents: 650,
    category: "dessert-cups",
    imageUrl: "https://picsum.photos/seed/strawberry-shortcake-jar/1200/800",
    isAvailable: true
  },
  {
    slug: "sourdough-country-loaf",
    name: "Sourdough Country Loaf",
    description: "Naturally leavened loaf with crisp crust and open crumb.",
    priceCents: 1100,
    category: "bread",
    imageUrl: "https://picsum.photos/seed/sourdough-country-loaf/1200/800",
    isAvailable: true
  }
] as const;

async function main() {
  for (const product of seedProducts) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        description: product.description,
        priceCents: product.priceCents,
        category: product.category,
        imageUrl: product.imageUrl,
        isAvailable: product.isAvailable
      },
      create: product
    });
  }

  console.log(`Seeded ${seedProducts.length} products`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
