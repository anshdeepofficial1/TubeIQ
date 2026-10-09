// Gemini is called from the server: API credentials never reach the browser.
function fail(res,status,message){ return res.status(status).json({error:{message}}); }
export default async function handler(req,res) {
  if (req.method!=='POST') {res.setHeader('Allow','POST');return fail(res,405,'Method not allowed');}
  res.setHeader('Cache-Control','no-store');
  if (!process.env.GEMINI_API_KEY) return fail(res,503,'AI is not configured. Set GEMINI_API_KEY in Vercel.');
  const origin=req.headers.origin;
  if (origin) {
    try { if(new URL(origin).host!==req.headers.host) return fail(res,403,'Cross-origin request not permitted'); }
    catch { return fail(res,403,'Invalid origin'); }
  }
  const body=req.body;
  if (!body || typeof body!=='object' || !Array.isArray(body.contents) || body.contents.length<1 || body.contents.length>16)
    return fail(res,400,'Invalid AI conversation');
  if (JSON.stringify(body).length>24000) return fail(res,413,'AI request is too large');
  const contents=body.contents.map(m=>({
    role:m.role==='model'?'model':'user',
    parts:Array.isArray(m.parts)?m.parts.filter(p=>typeof p?.text==='string' && p.text.length<=10000).map(p=>({text:p.text})).slice(0,1):[]
  }));
  if(contents.some(m=>m.parts.length!==1)) return fail(res,400,'Invalid AI message');
  const instruction=body.system_instruction?.parts?.[0]?.text;
  if (instruction!==undefined && (typeof instruction!=='string' || instruction.length>12000))
    return fail(res,400,'Invalid AI instructions');
  const tokens=Math.min(3000,Math.max(100,Number(body.generationConfig?.maxOutputTokens)||800));
  const payload={contents,generationConfig:{maxOutputTokens:tokens}};
  if(instruction)payload.systemInstruction={parts:[{text:instruction}]};
  const model=process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  if(!/^gemini-[A-Za-z0-9.-]+$/.test(model))return fail(res,500,'Invalid GEMINI_MODEL configuration');
  try{
    const upstream=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+model+':generateContent',{
      method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':process.env.GEMINI_API_KEY},
      body:JSON.stringify(payload),signal:AbortSignal.timeout(25000)
    });
    const result=await upstream.json();
    if(!upstream.ok)return fail(res,upstream.status===429?429:502,result?.error?.message||'AI provider unavailable');
    const answer=(result.candidates?.[0]?.content?.parts||[]).filter(p=>typeof p.text==='string').map(p=>p.text).join('\n');
    if(!answer)return fail(res,502,'AI did not return text. Please retry.');
    return res.status(200).json({text:answer});
  }catch{return fail(res,502,'AI provider did not respond');}
}
