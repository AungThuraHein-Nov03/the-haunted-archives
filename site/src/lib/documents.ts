import { getCollection, type CollectionEntry } from 'astro:content';

export async function getPublishedDocuments(): Promise<CollectionEntry<'documents'>[]> {
  const documents = await getCollection('documents');
  return documents.sort((left, right) => left.data.order - right.data.order);
}
