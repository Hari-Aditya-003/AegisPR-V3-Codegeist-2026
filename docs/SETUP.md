# Setup and demo data

Run the commands in the root [README](../README.md) for the local builds and tests. To connect either app to Atlassian, use [Forge deployment](FORGE_DEPLOYMENT.md).

## Add verification to a test repository

Place `.aegispr.json` in the destination branch root **before** creating a PR. The contract supports version 1, one to twelve assertions, at most six repository-relative JSON files, and primitive equality. A pointer is an RFC 6901 path to the value. An empty pointer targets the root value.

```json
{
  "version": 1,
  "checks": [
    {
      "name": "10% coupon reduces 100 to 90",
      "file": "store/quotes.json",
      "pointer": "/coupon10/total",
      "equals": 90
    }
  ]
}
```

Run the seed script with a new directory path.

```sh
bash scripts/seed-demo.sh /tmp/aegispr-coupon-demo
```

To try it in Bitbucket, create an empty test repository and use your own authorized SSH remote. If using Jira, create a test issue and put its real key in each PR title or description before the first review.

```sh
cd /tmp/aegispr-coupon-demo
git remote add origin git@bitbucket.org:WORKSPACE/REPOSITORY.git
git push origin main regression clean inconclusive
```

Open separate PRs into `main` from these branches. Keep `main` at the seeded revision while testing.

| Branch | Change | Expected scoped result |
| --- | --- | --- |
| `regression` | Incorrect 10% coupon output | Base passes and head fails the total assertion. Currency passes on both. |
| `clean` | Adds a second quote | Both configured assertions pass at both revisions. |
| `inconclusive` | Moves the checked file | Base assertions pass. The head checks cannot read the original path. |

The automated tests run the production resolver-adjacent review pipeline against temporary Git commits and the same seed script. Requests to Atlassian are simulated locally. Fixture IDs and evidence logs are in the [test report](TEST_REPORT.md).
