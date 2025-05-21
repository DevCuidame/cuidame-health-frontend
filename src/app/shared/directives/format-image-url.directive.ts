import { environment } from 'src/environments/environment';

const apiUrl = environment.url;

export function formatImageUrl(url: string): string {
  if (!url) return '/assets/images/default_user.png';

  let formattedUrl = url.replace(/\\/g, '/');

  const finalApiUrl = apiUrl.endsWith('/')
    ? apiUrl.slice(0, -1)
    : apiUrl;

  if (formattedUrl.startsWith('/')) {
    formattedUrl = formattedUrl.substring(1);
  }

  return `${finalApiUrl}/${formattedUrl}`;
}
