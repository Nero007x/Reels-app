export async function downloadImages(celebrityName: string): Promise<string[]> {
  const endpoint = 'https://api.bing.microsoft.com/v7.0/images/search';
  const params = new URLSearchParams({
    q: celebrityName,
    count: '5',
    safeSearch: 'Strict',
    imageType: 'Photo',
  });
  const response = await fetch(`${endpoint}?${params.toString()}`, {
    headers: {
      'Ocp-Apim-Subscription-Key': process.env.BING_SEARCH_KEY || '',
    },
  });
  if (!response.ok) throw new Error('Bing Image Search failed');
  const data = await response.json();
  return (data.value || []).map((img: any) => img.contentUrl).filter(Boolean);
} 