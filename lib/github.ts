const GITHUB_API = 'https://api.github.com'
const OWNER = process.env.GITHUB_REPO_OWNER!
const REPO = process.env.GITHUB_REPO_NAME!
const TOKEN = process.env.GITHUB_TOKEN!

function headers() {
  return {
    Authorization: `Bearer ${TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

export async function getFileContent(path: string): Promise<{ content: string; sha: string }> {
  const res = await fetch(`${GITHUB_API}/repos/${OWNER}/${REPO}/contents/${path}`, {
    headers: headers(),
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`GitHub API error ${res.status}: ${await res.text()}`)
  }

  const data = await res.json()
  const content = Buffer.from(data.content, 'base64').toString('utf-8')
  return { content, sha: data.sha }
}

export async function updateFileContent(
  path: string,
  content: string,
  sha: string,
  message: string
): Promise<void> {
  const encoded = Buffer.from(content, 'utf-8').toString('base64')

  const res = await fetch(`${GITHUB_API}/repos/${OWNER}/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, content: encoded, sha }),
  })

  if (!res.ok) {
    throw new Error(`GitHub API error ${res.status}: ${await res.text()}`)
  }
}
