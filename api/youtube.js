// Server-side YouTube Data API gateway. Only fixed read-only operations are exposed.
const METHODS = {
  channels: { parts: ['id', 'snippet,statistics,contentDetails'], filters: ['id', 'forHandle', 'forUsername'] },
  playlistItems: { parts: ['contentDetails'], filters: ['playlistId'] },
  videos: { parts: ['snippet,statistics,contentDetails'], filters: ['id'] }
};
function bad(res, status, message) { return res.status(status).json({error:{message}}); }
export default async function handler(req, res) {
  if (req.method !== 'GET') { res.setHeader('Allow','GET'); return bad(res,405,'Method not allowed'); }
  if (!process.env.YOUTUBE_API_KEY) return bad(res,503,'YouTube API is not configured. Set YOUTUBE_API_KEY in Vercel.');
  const origin = req.headers.origin;
  if (origin) {
    try { if (new URL(origin).host !== req.headers.host) return bad(res,403,'Cross-origin request not permitted'); }
    catch { return bad(res,403,'Invalid origin'); }
  }
  const {resource, part, ...query} = req.query || {};
  const rule = METHODS[resource];
  if (!rule || typeof part !== 'string' || !rule.parts.includes(part)) return bad(res,400,'Unsupported YouTube request');
  const provided = Object.keys(query);
  if (provided.some(k => !rule.filters.includes(k) && !(resource==='playlistItems' && k==='maxResults')))
    return bad(res,400,'Unsupported YouTube parameter');
  const filterCount = rule.filters.filter(k => query[k] != null).length;
  if (filterCount !== 1 || provided.length > (resource==='playlistItems' ? 2 : 1))
    return bad(res,400,'Specify exactly one lookup parameter');
  const val = query[rule.filters.find(k => query[k] != null)];
  if (typeof val !== 'string' || val.length > 250 || !val.length) return bad(res,400,'Invalid lookup value');
  if (resource==='channels' && query.id && !/^UC[A-Za-z0-9_-]{22}$/.test(query.id))
    return bad(res,400,'Invalid channel ID');
  if (resource==='channels' && query.forHandle && !/^@[A-Za-z0-9_.-]{1,30}$/.test(query.forHandle))
    return bad(res,400,'Invalid channel handle');
  if (resource==='videos' && (!/^[A-Za-z0-9_-]{11}(,[A-Za-z0-9_-]{11}){0,49}$/.test(query.id)))
    return bad(res,400,'Invalid video IDs');
  if (resource==='playlistItems' && (typeof query.playlistId!=='string' || !/^[A-Za-z0-9_-]{10,100}$/.test(query.playlistId)))
    return bad(res,400,'Invalid uploads playlist');
  if (query.maxResults !== undefined && query.maxResults !== '50') return bad(res,400,'Invalid page size');
  const url = new URL('https://www.googleapis.com/youtube/v3/'+resource);
  url.searchParams.set('part',part);
  for (const [k,v] of Object.entries(query)) url.searchParams.set(k,v);
  url.searchParams.set('key',process.env.YOUTUBE_API_KEY);
  try {
    const upstream = await fetch(url.toString(), {signal:AbortSignal.timeout(12000)});
    const payload = await upstream.json();
    if (!upstream.ok) return bad(res,upstream.status>=500?502:upstream.status,payload?.error?.message || 'YouTube API request failed');
    res.setHeader('Cache-Control','public, s-maxage=120, stale-while-revalidate=300');
    return res.status(200).json(payload);
  } catch {
    return bad(res,502,'Could not reach YouTube Data API');
  }
}
