import { advancedPractices } from '../../../../data/advanced-practices';
import type { APIRoute } from 'astro';
export function getStaticPaths() {
  return advancedPractices.flatMap((course) =>
    course.downloads.map((asset) => ({
      params: { id: course.id, asset: asset.name },
      props: { asset },
    })),
  );
}
export const GET: APIRoute = ({ props }) =>
  new Response(props.asset.text, {
    headers: {
      'Content-Type': props.asset.name.endsWith('.json')
        ? 'application/json; charset=utf-8'
        : 'text/plain; charset=utf-8',
    },
  });
