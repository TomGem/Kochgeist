export function getShareUrl(recipeId: string, baseUrl: string): string {
  return `${baseUrl}/recipe/${recipeId}`;
}
