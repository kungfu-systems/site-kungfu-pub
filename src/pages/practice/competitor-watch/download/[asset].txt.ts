import type { APIRoute } from 'astro';
import { downloads } from '../../../../data/competitor-watch';
export function getStaticPaths() {
  return Object.keys(downloads).map((asset) => ({ params: { asset } }));
}
export const GET: APIRoute = ({ params }) =>
  new Response('\uFEFF' + downloads[params.asset!], {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
