const DEFAULTS = {
  owner: 'keppler999',
  repo: 'SpinApp-1',
  branch: 'main',
  filePath: 'data/apps.json',
  allowedOrigin: 'https://keppler999.github.io'
};

function json(data, status = 200, origin = '') {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: corsHeaders(origin, { 'Content-Type': 'application/json; charset=utf-8' })
  });
}

function corsHeaders(origin = '', extra = {}) {
  const headers = {
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Publish-Secret',
    'Access-Control-Max-Age': '86400',
    ...extra
  };
  if (origin) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

function allowedOrigin(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = String(env.ALLOWED_ORIGIN || DEFAULTS.allowedOrigin)
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
  if (!origin) return '';
  if (allowed.includes('*')) return origin;
  if (allowed.includes(origin)) return origin;
  return null;
}

function error(message, status = 400, origin = '') {
  return json({ ok: false, error: message }, status, origin);
}

function requiredEnv(env, name) {
  const value = env[name];
  if (!value) throw new Error(`Variable Cloudflare manquante : ${name}`);
  return value;
}

function getConfig(env) {
  return {
    owner: env.GITHUB_OWNER || DEFAULTS.owner,
    repo: env.GITHUB_REPO || DEFAULTS.repo,
    branch: env.GITHUB_BRANCH || DEFAULTS.branch,
    filePath: env.GITHUB_FILE_PATH || DEFAULTS.filePath,
    token: requiredEnv(env, 'GITHUB_TOKEN'),
    publishSecret: requiredEnv(env, 'PUBLISH_SECRET')
  };
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeDatabase(database) {
  if (!database || typeof database !== 'object' || !Array.isArray(database.apps)) {
    throw new Error('Payload invalide : database.apps doit être un tableau.');
  }
  const apps = database.apps.map((app, index) => {
    if (!app || typeof app !== 'object') throw new Error(`Application invalide à l’index ${index}.`);
    if (!app.id || !app.name) throw new Error(`Application invalide à l’index ${index} : id et name sont obligatoires.`);
    return app;
  });
  const totalDownloads = apps.reduce((sum, app) => sum + Number(app.downloads || 0), 0);
  return {
    apps,
    stats: {
      totalApps: apps.length,
      totalDownloads: Number.isFinite(totalDownloads) ? totalDownloads : 0,
      lastUpdate: today()
    }
  };
}

function toBase64Unicode(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(i, i + chunkSize));
  }
  return btoa(binary);
}

async function githubFetch(url, config, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${config.token}`,
      'User-Agent': 'SpinApp-Publisher-Worker',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.headers || {})
    }
  });
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch (_) { data = { raw: text }; }
  if (!response.ok) {
    const message = data.message || `GitHub API HTTP ${response.status}`;
    throw new Error(message);
  }
  return data;
}

async function getCurrentFileSha(config) {
  const path = encodeURIComponent(config.filePath).replace(/%2F/g, '/');
  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}?ref=${encodeURIComponent(config.branch)}`;
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${config.token}`,
      'User-Agent': 'SpinApp-Publisher-Worker',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });
  if (response.status === 404) return null;
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch (_) { data = { raw: text }; }
  if (!response.ok) throw new Error(data.message || `Impossible de lire ${config.filePath}`);
  return data.sha || null;
}

async function publishDatabase(database, message, config) {
  const normalized = normalizeDatabase(database);
  const content = JSON.stringify(normalized, null, 2) + '\n';
  const sha = await getCurrentFileSha(config);
  const path = encodeURIComponent(config.filePath).replace(/%2F/g, '/');
  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`;
  const body = {
    message: message || `chore(spinapp): publish apps catalog ${today()}`,
    content: toBase64Unicode(content),
    branch: config.branch,
    committer: {
      name: 'SpinApp Publisher',
      email: 'spinapp-publisher@spirale-agence.local'
    }
  };
  if (sha) body.sha = sha;
  const result = await githubFetch(url, config, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return { result, normalized };
}

export default {
  async fetch(request, env) {
    const origin = allowedOrigin(request, env);
    if (origin === null) {
      return error('Origine non autorisée par le Worker.', 403, '');
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin || '') });
    }

    const url = new URL(request.url);

    if (url.pathname === '/' || url.pathname === '/health') {
      return json({
        ok: true,
        service: 'spinapp-publisher',
        repository: `${env.GITHUB_OWNER || DEFAULTS.owner}/${env.GITHUB_REPO || DEFAULTS.repo}`,
        branch: env.GITHUB_BRANCH || DEFAULTS.branch,
        filePath: env.GITHUB_FILE_PATH || DEFAULTS.filePath,
        allowedOrigin: env.ALLOWED_ORIGIN || DEFAULTS.allowedOrigin
      }, 200, origin || '');
    }

    if (url.pathname !== '/publish') {
      return error('Route introuvable. Utilisez POST /publish.', 404, origin || '');
    }

    if (request.method !== 'POST') {
      return error('Méthode non autorisée. Utilisez POST /publish.', 405, origin || '');
    }

    try {
      const config = getConfig(env);
      const secret = request.headers.get('X-Publish-Secret') || '';
      if (!secret || secret !== config.publishSecret) {
        return error('Secret de publication incorrect.', 401, origin || '');
      }

      const payload = await request.json();
      const { result, normalized } = await publishDatabase(payload.database, payload.message, config);

      return json({
        ok: true,
        filePath: config.filePath,
        branch: config.branch,
        apps: normalized.stats.totalApps,
        downloads: normalized.stats.totalDownloads,
        commit: result.commit || null,
        content: result.content ? { path: result.content.path, sha: result.content.sha, html_url: result.content.html_url } : null
      }, 200, origin || '');
    } catch (err) {
      return error(err.message || 'Erreur inattendue pendant la publication.', 500, origin || '');
    }
  }
};
