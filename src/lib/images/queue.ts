import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { db } from '../../db/index';
import { recipes, imageCache } from '../../db/schema';
import { eq } from 'drizzle-orm';
import type { ImageProvider } from './provider';

const IMAGE_DIR = './data/images';

function ensureImageDir() {
  if (!existsSync(IMAGE_DIR)) {
    mkdirSync(IMAGE_DIR, { recursive: true });
  }
}

async function getImageProvider(): Promise<ImageProvider> {
  const provider = import.meta.env.IMAGE_PROVIDER || 'azure';

  switch (provider) {
    case 'azure': {
      const { AzureImageProvider } = await import('./providers/azure-image');
      return new AzureImageProvider();
    }
    case 'placeholder':
    default: {
      const { PlaceholderImageProvider } = await import('./providers/placeholder');
      return new PlaceholderImageProvider();
    }
  }
}

export async function generateImageForRecipe(recipeId: string): Promise<void> {
  const recipe = db.select().from(recipes).where(eq(recipes.id, recipeId)).get();
  if (!recipe) return;

  // Check if already generating or ready
  const existing = db.select().from(imageCache).where(eq(imageCache.recipeId, recipeId)).get();
  if (existing && (existing.status === 'ready' || existing.status === 'generating')) return;

  // Parse instructions to extract image prompt if stored, otherwise generate from title
  let imagePrompt = `Editorial food photography of ${recipe.title}. ${recipe.description}. Soft natural light, rustic ceramic plate, shallow depth of field, high-end culinary magazine style.`;

  // Mark as generating
  if (existing) {
    db.update(imageCache)
      .set({ status: 'generating', prompt: imagePrompt })
      .where(eq(imageCache.recipeId, recipeId))
      .run();
  } else {
    db.insert(imageCache).values({
      recipeId,
      prompt: imagePrompt,
      provider: import.meta.env.IMAGE_PROVIDER || 'azure',
      status: 'generating',
    }).run();
  }

  try {
    const provider = await getImageProvider();
    const result = await provider.generateImage(imagePrompt);

    ensureImageDir();
    const ext = result.contentType === 'image/png' ? 'png' : 'webp';
    const fileName = `${recipeId}.${ext}`;
    const filePath = join(IMAGE_DIR, fileName);

    writeFileSync(filePath, result.imageData);

    const imageUrl = `/api/images/${recipeId}`;

    // Update image cache
    db.update(imageCache)
      .set({ status: 'ready', filePath })
      .where(eq(imageCache.recipeId, recipeId))
      .run();

    // Update recipe
    db.update(recipes)
      .set({ imageUrl, imageStatus: 'ready' })
      .where(eq(recipes.id, recipeId))
      .run();
  } catch (error) {
    console.error(`Image generation failed for recipe ${recipeId}:`, error);
    db.update(imageCache)
      .set({ status: 'failed' })
      .where(eq(imageCache.recipeId, recipeId))
      .run();
    db.update(recipes)
      .set({ imageStatus: 'failed' })
      .where(eq(recipes.id, recipeId))
      .run();
  }
}
