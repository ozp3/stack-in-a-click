// API: POST /api/provision
// Demo mode generates realistic env vars — tokens masked, URLs visible

const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const DEMO_MODE = !fs.existsSync(path.join(process.cwd(), 'bin/stripe'));

function r(n) { return Array.from({length:n},()=>Math.floor(Math.random()*16).toString(16)).join(''); }
function rb(n) { const c='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'; return Array.from({length:n},()=>c[Math.floor(Math.random()*c.length)]).join(''); }

function mask(envStr) {
  // Mask token values with ***, keep URLs/base hostnames visible
  return envStr.split('\n').map(line => {
    const eq = line.indexOf('=');
    if (eq === -1) return line;
    const key = line.slice(0, eq);
    const val = line.slice(eq + 1);
    // Keep URLs visible
    if (val.includes('://') || val.includes('.com') || val.includes('.io') ||
        val.includes('.app') || val.includes('.dev') || val.includes('.co') ||
        val.includes('.tech') || val.includes('.ai')) {
      return line; // URL/hostname — show as-is
    }
    // Mask tokens, keys, secrets
    return key + '=***';
  }).join('\n');
}

function generateDemoEnv(providerId) {
  const [provider, service] = providerId.split('/');
  const key = `${provider}_${service}`.replace(/[-.]/g,'_');

  const T = {
    neon_postgres:          `DATABASE_URL=postgresql://db_${r(8)}:${r(24)}@ep-${r(8)}.us-east-2.aws.neon.tech/neondb?sslmode=require`,
    supabase_project:       `SUPABASE_URL=https://${r(10)}.supabase.co\nSUPABASE_ANON_KEY=${rb(40)}\nSUPABASE_SERVICE_KEY=${rb(40)}`,
    turso_database:         `TURSO_DATABASE_URL=libsql://${r(8)}-${r(4)}.turso.io\nTURSO_AUTH_TOKEN=${rb(32)}`,
    planetscale_mysql:      `DATABASE_URL=mysql://${r(8)}:${r(24)}@aws.connect.psdb.cloud/${r(8)}?sslmode=require`,
    planetscale_postgresql: `DATABASE_URL=postgresql://${r(8)}:${r(24)}@aws.connect.psdb.cloud/${r(8)}`,
    prisma_database:        `DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/${r(8)}?api_key=${r(24)}`,
    clickhouse_postgres:    `CLICKHOUSE_URL=https://${r(8)}.us-east-1.aws.clickhouse.cloud:8443\nCLICKHOUSE_PASSWORD=${r(24)}`,
    railway_postgres:       `DATABASE_URL=postgresql://postgres:${r(24)}@${r(8)}.railway.app:5432/railway`,
    railway_mongo:          `MONGODB_URL=mongodb://mongo:${r(24)}@${r(8)}.railway.app:27017/${r(6)}`,
    railway_redis:          `REDIS_URL=redis://default:${r(24)}@${r(8)}.railway.app:6379`,
    railway_hosting:        `RAILWAY_SERVICE_ID=${r(12)}\nRAILWAY_TOKEN=${r(24)}`,
    railway_bucket:         `S3_ENDPOINT=https://${r(8)}.s3.railway.app\nS3_ACCESS_KEY=${r(16)}\nS3_SECRET_KEY=${r(32)}\nS3_BUCKET=${r(8)}`,
    render_postgres:        `DATABASE_URL=postgresql://${r(8)}:${r(24)}@dpg-${r(10)}.oregon-postgres.render.com/${r(8)}`,
    render_static_site:     `RENDER_SERVICE_ID=srv-${r(12)}\nRENDER_API_KEY=${r(24)}`,
    render_web_service:     `RENDER_SERVICE_ID=srv-${r(12)}\nRENDER_API_KEY=${r(24)}`,
    flyio_mpg:              `DATABASE_URL=postgresql://postgres:${r(24)}@${r(8)}.fly.dev:5432/${r(8)}`,
    upstash_redis:          `UPSTASH_REDIS_URL=redis://default:${r(24)}@${r(8)}.upstash.io:6379\nUPSTASH_REDIS_TOKEN=${r(32)}`,
    upstash_vector:         `UPSTASH_VECTOR_URL=https://${r(8)}-us1.upstash.io\nUPSTASH_VECTOR_TOKEN=${r(32)}`,
    upstash_qstash:         `QSTASH_URL=https://qstash.upstash.io/v2\nQSTASH_TOKEN=${r(32)}`,
    upstash_search:         `UPSTASH_SEARCH_URL=https://${r(8)}.upstash.io\nUPSTASH_SEARCH_TOKEN=${r(32)}`,
    cloudflare_workers:     `CLOUDFLARE_API_TOKEN=${r(40)}\nCLOUDFLARE_ACCOUNT_ID=${r(32)}`,
    cloudflare_d1:          `CLOUDFLARE_D1_DATABASE_ID=${r(32)}\nCLOUDFLARE_API_TOKEN=${r(40)}`,
    cloudflare_kv:          `CLOUDFLARE_KV_NAMESPACE_ID=${r(32)}`,
    cloudflare_queues:      `CLOUDFLARE_QUEUE_ID=${r(32)}`,
    cloudflare_workers_ai:  `CLOUDFLARE_AI_GATEWAY=https://gateway.ai.cloudflare.com/v1/${r(32)}`,
    cloudflare_browser_run: `BROWSER_RENDERING_URL=https://browser-rendering.${r(8)}.workers.dev`,
    cloudflare_hyperdrive:  `CLOUDFLARE_HYPERDRIVE_ID=${r(32)}`,
    clerk_auth:             `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_${r(24)}\nCLERK_SECRET_KEY=sk_test_${r(24)}`,
    auth0_client:           `AUTH0_CLIENT_ID=${r(24)}\nAUTH0_CLIENT_SECRET=${r(32)}\nAUTH0_DOMAIN=example.auth0.com`,
    privy_app:              `PRIVY_APP_ID=${r(10)}\nPRIVY_APP_SECRET=${r(32)}`,
    workos_auth:            `WORKOS_API_KEY=${r(24)}\nWORKOS_CLIENT_ID=client_${r(12)}`,
    openrouter_api:         `OPENROUTER_API_KEY=sk-or-v1-${r(40)}\nOPENROUTER_BASE_URL=https://openrouter.ai/api/v1`,
    elevenlabs_tts:         `ELEVENLABS_API_KEY=${r(32)}`,
    exa_api:                `EXA_API_KEY=${r(24)}`,
    firecrawl_api:          `FIRECRAWL_API_KEY=${r(24)}`,
    algolia_application:    `ALGOLIA_APP_ID=${r(10)}\nALGOLIA_API_KEY=${r(32)}`,
    supermemory_memory:     `SUPERMEMORY_API_KEY=sm_${r(24)}\nSUPERMEMORY_PROJECT_ID=proj_${r(12)}`,
    huggingface_platform:   `HF_TOKEN=hf_${r(32)}`,
    huggingface_bucket:     `HF_BUCKET_URL=https://huggingface.co/datasets/${r(8)}/data\nHF_TOKEN=hf_${r(32)}`,
    kernel_project:         `KERNEL_API_KEY=kp_${r(24)}\nKERNEL_PROJECT_ID=proj_${r(12)}`,
    blaxel_sandbox:         `BLAXEL_SANDBOX_ID=sb_${r(12)}\nBLAXEL_API_KEY=bx_${r(24)}`,
    blaxel_agent_drive:     `BLAXEL_DRIVE_ID=drive_${r(12)}\nBLAXEL_API_KEY=bx_${r(24)}`,
    base44_projects_app:    `BASE44_APP_ID=app_${r(12)}\nBASE44_API_KEY=b44_${r(24)}`,
    posthog_analytics:      `NEXT_PUBLIC_POSTHOG_KEY=phc_${r(24)}\nPOSTHOG_HOST=https://us.i.posthog.com`,
    amplitude_analytics:    `AMPLITUDE_API_KEY=${r(24)}\nAMPLITUDE_SECRET_KEY=${r(32)}`,
    mixpanel_analytics:     `MIXPANEL_TOKEN=${r(24)}\nMIXPANEL_API_SECRET=${r(32)}`,
    vercel_project:         `VERCEL_TOKEN=${r(24)}\nVERCEL_PROJECT_ID=prj_${r(12)}\nVERCEL_TEAM_ID=team_${r(12)}`,
    netlify_project:        `NETLIFY_AUTH_TOKEN=nfp_${r(24)}\nNETLIFY_SITE_ID=${r(12)}`,
    gitlab_project:         `GITLAB_TOKEN=glpat-${r(24)}\nGITLAB_PROJECT_ID=${Math.floor(Math.random()*90000000)+10000000}`,
    wordpress_com_site:     `WORDPRESS_SITE_URL=https://${r(8)}.wordpress.com\nWORDPRESS_API_KEY=${r(24)}`,
    sentry_project:         `SENTRY_DSN=https://${r(32)}@o${Math.floor(Math.random()*9000000)+1000000}.ingest.us.sentry.io/${Math.floor(Math.random()*9000)+1000}`,
    browserbase_project:    `BROWSERBASE_API_KEY=bb_${r(24)}\nBROWSERBASE_PROJECT_ID=${r(12)}`,
    inngest_app:            `INNGEST_EVENT_KEY=${r(24)}\nINNGEST_SIGNING_KEY=${r(24)}`,
    agentmail_api:          `AGENTMAIL_API_KEY=am_${r(24)}`,
    postalform_mail:        `POSTALFORM_API_KEY=pf_${r(24)}`,
    metronome_sandbox:      `METRONOME_API_KEY=mt_${r(24)}\nMETRONOME_SANDBOX_ID=sb_${r(12)}`,
    wix_headless:           `WIX_API_KEY=${r(24)}\nWIX_SITE_ID=${r(12)}\nWIX_ACCOUNT_ID=${r(12)}`,
  };
  return T[key] || `${provider.toUpperCase()}_API_KEY=${r(24)}\n${provider.toUpperCase()}_PROJECT_ID=proj_${r(12)}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const { providers } = req.body;
  if (!Array.isArray(providers) || providers.length === 0) return res.status(400).json({ error: 'Select at least one service.' });

  const results=[], errors=[], service_envs={}; let env='';
  for (const p of providers) {
    try {
      if (!DEMO_MODE) {
        await new Promise((resolve, reject) => {
          execFile(path.join(process.cwd(),'bin/stripe'),['projects','add',p,'--yes'],{cwd:process.cwd(),timeout:30000},
            (err,out)=>{if(err&&!out)reject(err);resolve(out);});
        });
      } else {
        await new Promise(r=>setTimeout(r,200+Math.random()*300));
        const raw=generateDemoEnv(p);
        service_envs[p]=mask(raw);
        env+=(env?'\n':'')+`# ${p}\n${mask(raw)}`;
      }
      results.push({provider:p,name:p.split('/')[1],success:true,demo:DEMO_MODE});
    } catch(err){errors.push({provider:p,error:err.message?.slice(0,200)});}
  }
  return res.status(200).json({success:!errors.length,provisioned:results,errors,service_envs,env,mode:DEMO_MODE?'demo':'live',
    message:`🎭 Demo: ${results.length} service(s) simulated.`});
}
