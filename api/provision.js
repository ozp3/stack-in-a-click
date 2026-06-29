// API: POST /api/provision
// Returns per-service env vars for individual copy buttons

const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const DEMO_MODE = !fs.existsSync(path.join(process.cwd(), 'bin/stripe'));

function randHex(n) { return Array.from({length:n},()=>Math.floor(Math.random()*16).toString(16)).join(''); }
function randNum(n) { return Array.from({length:n},()=>Math.floor(Math.random()*10)).join(''); }
function randB64(n) { const c='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'; return Array.from({length:n},()=>c[Math.floor(Math.random()*c.length)]).join(''); }

function generateDemoEnv(providerId) {
  const [provider, service] = providerId.split('/');
  const hex = randHex(24);
  const key = `${provider}_${service}`.replace(/[-.]/g,'_');

  const templates = {
    neon_postgres: `DATABASE_URL=postgresql://db_${randHex(8)}:${randHex(24)}@ep-${randHex(8)}.us-east-2.aws.neon.tech/neondb?sslmode=require`,
    supabase_project: `SUPABASE_URL=https://${randHex(10)}.supabase.co\nSUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiJ9.${randB64(24)}.${randB64(32)}\nSUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiJ9.${randB64(32)}`,
    turso_database: `TURSO_DATABASE_URL=libsql://${randHex(8)}-${randHex(4)}.turso.io\nTURSO_AUTH_TOKEN=${randB64(32)}`,
    planetscale_mysql: `DATABASE_URL=mysql://${randHex(8)}:${randHex(24)}@aws.connect.psdb.cloud/${randHex(8)}?sslmode=require`,
    planetscale_postgresql: `DATABASE_URL=postgresql://${randHex(8)}:${randHex(24)}@aws.connect.psdb.cloud/${randHex(8)}`,
    prisma_database: `DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/${randHex(8)}?api_key=${randHex(24)}`,
    clickhouse_postgres: `CLICKHOUSE_URL=https://${randHex(8)}.us-east-1.aws.clickhouse.cloud:8443\nCLICKHOUSE_PASSWORD=${randHex(24)}`,
    railway_postgres: `DATABASE_URL=postgresql://postgres:${randHex(24)}@${randHex(8)}.railway.app:5432/railway`,
    railway_mongo: `MONGODB_URL=mongodb://mongo:${randHex(24)}@${randHex(8)}.railway.app:27017/${randHex(6)}`,
    railway_redis: `REDIS_URL=redis://default:${randHex(24)}@${randHex(8)}.railway.app:6379`,
    railway_hosting: `RAILWAY_SERVICE_ID=${randHex(12)}\nRAILWAY_TOKEN=${randHex(24)}`,
    railway_bucket: `S3_ENDPOINT=https://${randHex(8)}.s3.railway.app\nS3_ACCESS_KEY=${randHex(16)}\nS3_SECRET_KEY=${randHex(32)}\nS3_BUCKET=${randHex(8)}`,
    render_postgres: `DATABASE_URL=postgresql://${randHex(8)}:${randHex(24)}@dpg-${randHex(10)}.oregon-postgres.render.com/${randHex(8)}`,
    render_static_site: `RENDER_SERVICE_ID=srv-${randHex(12)}\nRENDER_API_KEY=rnd_${randHex(24)}`,
    render_web_service: `RENDER_SERVICE_ID=srv-${randHex(12)}\nRENDER_API_KEY=rnd_${randHex(24)}`,
    flyio_mpg: `DATABASE_URL=postgresql://postgres:${randHex(24)}@${randHex(8)}.fly.dev:5432/${randHex(8)}`,
    upstash_redis: `UPSTASH_REDIS_URL=redis://default:${randHex(24)}@${randHex(8)}.upstash.io:6379\nUPSTASH_REDIS_TOKEN=${randHex(32)}`,
    upstash_vector: `UPSTASH_VECTOR_URL=https://${randHex(8)}-us1.upstash.io\nUPSTASH_VECTOR_TOKEN=${randHex(32)}`,
    upstash_qstash: `QSTASH_URL=https://qstash.upstash.io/v2\nQSTASH_TOKEN=${randHex(32)}`,
    upstash_search: `UPSTASH_SEARCH_URL=https://${randHex(8)}.upstash.io\nUPSTASH_SEARCH_TOKEN=${randHex(32)}`,
    cloudflare_workers: `CLOUDFLARE_API_TOKEN=${randHex(40)}\nCLOUDFLARE_ACCOUNT_ID=${randHex(32)}`,
    cloudflare_d1: `CLOUDFLARE_D1_DATABASE_ID=${randHex(32)}\nCLOUDFLARE_D1_NAME=${randHex(8)}-db\nCLOUDFLARE_API_TOKEN=${randHex(40)}`,
    cloudflare_kv: `CLOUDFLARE_KV_NAMESPACE_ID=${randHex(32)}`,
    cloudflare_queues: `CLOUDFLARE_QUEUE_ID=${randHex(32)}`,
    cloudflare_workers_ai: `CLOUDFLARE_AI_GATEWAY=https://gateway.ai.cloudflare.com/v1/${randHex(32)}`,
    cloudflare_browser_run: `BROWSER_RENDERING_URL=https://browser-rendering.${randHex(8)}.workers.dev`,
    cloudflare_hyperdrive: `CLOUDFLARE_HYPERDRIVE_ID=${randHex(32)}`,
    clerk_auth: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_${hex}\nCLERK_SECRET_KEY=sk_test_${randHex(24)}`,
    auth0_client: `AUTH0_CLIENT_ID=${randHex(24)}\nAUTH0_CLIENT_SECRET=${randHex(32)}\nAUTH0_DOMAIN=${provider}.auth0.com`,
    privy_app: `PRIVY_APP_ID=cm${randHex(10)}\nPRIVY_APP_SECRET=${randHex(32)}`,
    workos_auth: `WORKOS_API_KEY=sk_test_${randHex(24)}\nWORKOS_CLIENT_ID=client_${randHex(12)}`,
    openrouter_api: `OPENROUTER_API_KEY=sk-or-v1-${randHex(40)}\nOPENROUTER_BASE_URL=https://openrouter.ai/api/v1`,
    elevenlabs_tts: `ELEVENLABS_API_KEY=${randHex(32)}`,
    exa_api: `EXA_API_KEY=${randHex(24)}`,
    firecrawl_api: `FIRECRAWL_API_KEY=fc-${randHex(24)}`,
    algolia_application: `ALGOLIA_APP_ID=${randHex(10)}\nALGOLIA_API_KEY=${randHex(32)}\nALGOLIA_INDEX_NAME=${randHex(8)}`,
    supermemory_memory: `SUPERMEMORY_API_KEY=sm_${randHex(24)}\nSUPERMEMORY_PROJECT_ID=proj_${randHex(12)}`,
    huggingface_platform: `HF_TOKEN=hf_${randHex(32)}`,
    huggingface_bucket: `HF_BUCKET_URL=https://huggingface.co/datasets/${randHex(8)}/data\nHF_TOKEN=hf_${randHex(32)}`,
    kernel_project: `KERNEL_API_KEY=kp_${randHex(24)}\nKERNEL_PROJECT_ID=proj_${randHex(12)}`,
    blaxel_sandbox: `BLAXEL_SANDBOX_ID=sb_${randHex(12)}\nBLAXEL_API_KEY=bx_${randHex(24)}`,
    blaxel_agent_drive: `BLAXEL_DRIVE_ID=drive_${randHex(12)}\nBLAXEL_API_KEY=bx_${randHex(24)}`,
    base44_projects_app: `BASE44_APP_ID=app_${randHex(12)}\nBASE44_API_KEY=b44_${randHex(24)}`,
    posthog_analytics: `NEXT_PUBLIC_POSTHOG_KEY=phc_${randHex(24)}\nPOSTHOG_HOST=https://us.i.posthog.com`,
    amplitude_analytics: `AMPLITUDE_API_KEY=${randHex(24)}\nAMPLITUDE_SECRET_KEY=${randHex(32)}`,
    mixpanel_analytics: `MIXPANEL_TOKEN=${randHex(24)}\nMIXPANEL_API_SECRET=${randHex(32)}`,
    vercel_project: `VERCEL_TOKEN=vc_${randHex(20)}\nVERCEL_PROJECT_ID=prj_${randHex(12)}\nVERCEL_TEAM_ID=team_${randHex(12)}`,
    netlify_project: `NETLIFY_AUTH_TOKEN=nfp_${randHex(20)}\nNETLIFY_SITE_ID=${randHex(12)}`,
    gitlab_project: `GITLAB_TOKEN=glpat-${randHex(20)}\nGITLAB_PROJECT_ID=${randNum(8)}`,
    wordpress_com_site: `WORDPRESS_SITE_URL=https://${randHex(8)}.wordpress.com\nWORDPRESS_API_KEY=${randHex(24)}`,
    sentry_project: `SENTRY_DSN=https://${randHex(32)}@o${randNum(7)}.ingest.us.sentry.io/${randNum(7)}`,
    browserbase_project: `BROWSERBASE_API_KEY=bb_${randHex(24)}\nBROWSERBASE_PROJECT_ID=${randHex(12)}`,
    inngest_app: `INNGEST_EVENT_KEY=key_${randHex(24)}\nINNGEST_SIGNING_KEY=sig_${randHex(24)}`,
    agentmail_api: `AGENTMAIL_API_KEY=am_${randHex(24)}`,
    postalform_mail: `POSTALFORM_API_KEY=pf_${randHex(24)}`,
    metronome_sandbox: `METRONOME_API_KEY=mt_${randHex(24)}\nMETRONOME_SANDBOX_ID=sb_${randHex(12)}`,
    wix_headless: `WIX_API_KEY=${randHex(24)}\nWIX_SITE_ID=${randHex(12)}\nWIX_ACCOUNT_ID=${randHex(12)}`,
  };

  return templates[key] || `${provider.toUpperCase()}_API_KEY=${randHex(24)}\n${provider.toUpperCase()}_PROJECT_ID=proj_${randHex(12)}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { providers } = req.body;
  if (!Array.isArray(providers) || providers.length === 0) {
    return res.status(400).json({ error: 'Select at least one service.' });
  }

  const results = [], errors = [], service_envs = {};
  let envContent = '';

  for (const provider of providers) {
    try {
      if (!DEMO_MODE) {
        await new Promise((resolve, reject) => {
          execFile(path.join(process.cwd(), 'bin/stripe'), ['projects', 'add', provider, '--yes'], {
            cwd: process.cwd(), timeout: 30000,
          }, (err, stdout, stderr) => {
            if (err && !stdout) return reject(new Error(stderr || err.message));
            resolve(stdout);
          });
        });
      } else {
        await new Promise(r => setTimeout(r, 200 + Math.random() * 300));
        const env = generateDemoEnv(provider);
        service_envs[provider] = env;
        envContent += (envContent ? '\n' : '') + `# ${provider}\n${env}`;
      }
      results.push({ provider, name: provider.split('/')[1], success: true, demo: DEMO_MODE });
    } catch (err) {
      errors.push({ provider, error: err.message.slice(0, 200) });
    }
  }

  return res.status(200).json({
    success: errors.length === 0,
    provisioned: results, errors,
    service_envs, env: envContent,
    mode: DEMO_MODE ? 'demo' : 'live',
    message: DEMO_MODE
      ? `🎭 Demo: ${results.length} service(s) simulated.`
      : `${results.length} service(s) provisioned!`,
  });
}
