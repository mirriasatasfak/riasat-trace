import { sanitizeEmail, sanitizePlainText, sanitizeUsername } from '../utils/security';

export interface GitHubUserResult {
  found: boolean;
  username?: string;
  name?: string;
  bio?: string;
  avatarUrl?: string;
  profileUrl?: string;
  publicRepos?: number;
  company?: string;
  location?: string;
  blog?: string;
  twitterUsername?: string;
  followers?: number;
}

export async function lookupGitHubProfile(rawEmail: string, rawUsername: string): Promise<GitHubUserResult> {
  const { email: cleanEmail } = sanitizeEmail(rawEmail);
  const cleanUsername = sanitizeUsername(rawUsername);

  try {
    // 1. Try search by email if a valid address exists
    if (cleanEmail && cleanEmail.includes('@')) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const searchRes = await fetch(
        `https://api.github.com/search/users?q=${encodeURIComponent(cleanEmail)}+in:email`,
        {
          headers: { Accept: 'application/vnd.github.v3+json' },
          signal: controller.signal,
        }
      ).catch(() => null);

      clearTimeout(timeoutId);

      if (searchRes && searchRes.ok) {
        const data = await searchRes.json().catch(() => null);
        if (data && Array.isArray(data.items) && data.items.length > 0) {
          const user = data.items[0];
          if (user && user.login) {
            return await fetchGitHubUserDetails(user.login);
          }
        }
      }
    }

    // 2. Try direct lookup by sanitized username prefix
    if (cleanUsername && cleanUsername.length >= 2) {
      const userRes = await fetchGitHubUserDetails(cleanUsername);
      if (userRes.found) {
        return userRes;
      }
    }
  } catch (err) {
    console.warn('GitHub public API lookup skipped or rate limited');
  }

  return { found: false };
}

async function fetchGitHubUserDetails(login: string): Promise<GitHubUserResult> {
  const safeLogin = sanitizeUsername(login);
  if (!safeLogin) return { found: false };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(safeLogin)}`, {
      headers: { Accept: 'application/vnd.github.v3+json' },
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(timeoutId);

    if (res && res.ok) {
      const u = await res.json().catch(() => null);
      if (u && typeof u === 'object') {
        return {
          found: true,
          username: sanitizeUsername(u.login || safeLogin),
          name: sanitizePlainText(u.name || u.login || safeLogin, 100),
          bio: u.bio ? sanitizePlainText(u.bio, 300) : undefined,
          avatarUrl: u.avatar_url && typeof u.avatar_url === 'string' && u.avatar_url.startsWith('https://') ? u.avatar_url : undefined,
          profileUrl: `https://github.com/${encodeURIComponent(safeLogin)}`,
          publicRepos: typeof u.public_repos === 'number' ? u.public_repos : 0,
          company: u.company ? sanitizePlainText(u.company, 100) : undefined,
          location: u.location ? sanitizePlainText(u.location, 100) : undefined,
          blog: u.blog ? sanitizePlainText(u.blog, 150) : undefined,
          twitterUsername: u.twitter_username ? sanitizeUsername(u.twitter_username) : undefined,
          followers: typeof u.followers === 'number' ? u.followers : 0,
        };
      }
    }
  } catch {
    // Graceful fallback
  }

  return { found: false };
}
