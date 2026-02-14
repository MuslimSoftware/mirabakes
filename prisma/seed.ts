import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const seedProducts = [
  {
    slug: "chocolate-chip-cookies",
    name: "Chocolate Chip Cookies",
    description: "Soft-centered cookies with dark and milk chocolate chips.",
    priceCents: 450,
    category: "cookies",
    imageUrl: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=1200&h=800&fit=crop&q=80",
    isAvailable: true
  },
  {
    slug: "fudgy-brownie-squares",
    name: "Fudgy Brownie Squares",
    description: "Dense cocoa brownies with a crackly top.",
    priceCents: 500,
    category: "brownies",
    imageUrl: "https://images.unsplash.com/photo-1643769377897-33ba0d88b240?w=1200&h=800&fit=crop&q=80",
    isAvailable: true
  },
  {
    slug: "classic-cinnamon-roll",
    name: "Classic Cinnamon Roll",
    description: "Fluffy roll with brown sugar swirl and vanilla glaze.",
    priceCents: 550,
    category: "pastries",
    imageUrl: "https://plus.unsplash.com/premium_photo-1663928246542-ab54a1283646?w=1200&h=800&fit=crop&q=80",
    isAvailable: true
  },
  {
    slug: "red-velvet-cupcake",
    name: "Red Velvet Cupcake",
    description: "Buttermilk red velvet cupcake with cream cheese frosting.",
    priceCents: 425,
    category: "cupcakes",
    imageUrl: "https://images.unsplash.com/photo-1759524322472-3f146a43cf9a?w=1200&h=800&fit=crop&q=80",
    isAvailable: true
  }
] as const;

async function main() {
  await prisma.product.deleteMany();

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
