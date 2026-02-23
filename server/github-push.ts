import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

async function getGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

const IGNORE_PATTERNS = [
  'node_modules', '.git', 'dist', '.cache', '.replit',
  'replit.nix', '.config', '.local', '.upm', 'attached_assets',
  '.breakpoints', '.gitattributes', 'references', 'snippets'
];

function shouldIgnore(filePath: string): boolean {
  const parts = filePath.split('/');
  return parts.some(part => IGNORE_PATTERNS.includes(part));
}

function getAllFiles(dirPath: string, basePath: string = ''): { path: string; content: string }[] {
  const files: { path: string; content: string }[] = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;
    
    if (shouldIgnore(relativePath)) continue;
    
    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath, relativePath));
    } else if (entry.isFile()) {
      try {
        const content = fs.readFileSync(fullPath);
        files.push({
          path: relativePath,
          content: content.toString('base64')
        });
      } catch (e) {}
    }
  }
  return files;
}

async function pushToGitHub() {
  const owner = 'SujayPalande';
  const repo = 'HRMS-16Feb-10-00';
  const branch = 'main';
  const commitMessage = 'Update: Fix attendance PDF period label and restore leave PDF format';

  console.log('Connecting to GitHub...');
  const octokit = await getGitHubClient();

  console.log('Getting authenticated user...');
  const { data: user } = await octokit.users.getAuthenticated();
  console.log(`Authenticated as: ${user.login}`);

  let currentCommitSha: string;
  let treeSha: string;

  try {
    const { data: ref } = await octokit.git.getRef({ owner, repo, ref: `heads/${branch}` });
    currentCommitSha = ref.object.sha;
    const { data: commit } = await octokit.git.getCommit({ owner, repo, commit_sha: currentCommitSha });
    treeSha = commit.tree.sha;
    console.log(`Existing branch found. Current commit: ${currentCommitSha}`);
  } catch (e: any) {
    if (e.status === 404) {
      console.log('Repository or branch not found. Creating initial commit...');
      const { data: commit } = await octokit.git.createCommit({
        owner, repo,
        message: 'Initial commit',
        tree: (await octokit.git.createTree({ owner, repo, tree: [] })).data.sha,
        parents: []
      });
      currentCommitSha = commit.sha;
      treeSha = commit.tree.sha;
      await octokit.git.createRef({ owner, repo, ref: `refs/heads/${branch}`, sha: currentCommitSha });
    } else {
      throw e;
    }
  }

  console.log('Reading project files...');
  const projectDir = '/home/runner/workspace';
  const files = getAllFiles(projectDir);
  console.log(`Found ${files.length} files to push`);

  const BATCH_SIZE = 50;
  const treeItems: any[] = [];

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    console.log(`Creating blobs: ${i + 1}-${Math.min(i + BATCH_SIZE, files.length)} of ${files.length}...`);
    
    const blobs = await Promise.all(
      batch.map(file =>
        octokit.git.createBlob({
          owner, repo,
          content: file.content,
          encoding: 'base64'
        })
      )
    );

    blobs.forEach((blob, idx) => {
      treeItems.push({
        path: batch[idx].path,
        mode: '100644' as const,
        type: 'blob' as const,
        sha: blob.data.sha
      });
    });
  }

  console.log('Creating tree...');
  const { data: newTree } = await octokit.git.createTree({
    owner, repo,
    tree: treeItems,
    base_tree: treeSha
  });

  console.log('Creating commit...');
  const { data: newCommit } = await octokit.git.createCommit({
    owner, repo,
    message: commitMessage,
    tree: newTree.sha,
    parents: [currentCommitSha]
  });

  console.log('Updating branch reference...');
  await octokit.git.updateRef({
    owner, repo,
    ref: `heads/${branch}`,
    sha: newCommit.sha,
    force: true
  });

  console.log(`\nSuccessfully pushed to https://github.com/${owner}/${repo}`);
  console.log(`Commit: ${newCommit.sha}`);
}

pushToGitHub().catch(err => {
  console.error('Push failed:', err.message || err);
  process.exit(1);
});
