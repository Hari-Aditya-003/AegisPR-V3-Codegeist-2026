const { resolve } = require('node:path')
const { validate } = require('@forge/manifest')

async function main() {
  for (const [dir, name, suffix] of [
    ['forge', 'AEGISPR_BITBUCKET_APP_ID', '1'],
    ['jira', 'AEGISPR_JIRA_APP_ID', '2'],
  ]) {
    // The schema check uses a synthetic app ID when run without Atlassian registration.
    process.env[name] ??= 'ari:cloud:ecosystem::app/00000000-0000-4000-8000-00000000000' + suffix
    const path = resolve(__dirname, '..', 'apps', dir, 'manifest.yml')
    const { success, errors } = await validate(false, path)
    for (const error of errors ?? []) console.error(dir, error.message)
    if (!success) process.exitCode = 1
    else console.log(dir + ' manifest passed Atlassian SDK validation.')
  }
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
