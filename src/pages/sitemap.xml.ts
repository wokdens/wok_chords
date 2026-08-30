export const prerender = true;

import { GET as getIndex } from './sitemap-index.xml';

export async function GET() {
  return getIndex();
}
