# Test report

**Local run on November 16, 2026** · Node.js 22.23.5 · macOS arm64.

| Command | Observed result |
| --- | --- |
| `npm ci` in the root, `apps/forge`, and `apps/jira` | All three lockfiles installed successfully |
| `npm --prefix apps/forge run typecheck` and `npm --prefix apps/jira run typecheck` | Both passed |
| `npm --prefix apps/forge run test` | 13 passed |
| `npm --prefix apps/jira run test` | 5 passed |
| `npm --prefix apps/forge run build` and `npm --prefix apps/jira run build` | Both built production Custom UI assets |
| `npm run validate:manifests` | Both passed Atlassian SDK validation with local synthetic IDs |
| `forge whoami` and `forge lint` | Forge CLI stopped before remote checks because there was no authenticated session |

The Forge test suite creates real Git commits and uses `git show` and `git diff` as the local source. Local responses exercise the Bitbucket API adapter, queue-consumer logic, event identity, retry exhaustion, authorization gating, report history, static rules, size limits, and missing or unsupported inputs. The Jira suite uses simulated responses to verify the three Rovo actions, denied access, snapshot validation and write operations. These checks do not exercise a deployed Atlassian tenant.

## Executed commit comparisons

Base in the recorded run was `846e129f7597cacd25e1a9e86033ba3af75f52f1`. This table is derived from the evidence records printed by the test command.

| Case | Head | Coupon total at base / head | Currency at base / head | Verdict |
| --- | --- | --- | --- | --- |
| Regression | `27921f82afeb8fe326c57d7aa7e4e7b9cab5d99b` | pass / fail | pass / pass | confirmed-regression |
| Clean | `6b954cdf5b3945474492705218f285f3451cbc2d` | pass / pass | pass / pass | no-regression-in-executed-checks |
| Inconclusive | `4238cdd4d5d949248eb9152b6dea88eceae80ce1` | pass / unavailable | pass / unavailable | inconclusive |

The local SDK validator does not contact an Atlassian installation. Platform testing still needs a registered ID for each app, Bitbucket workspace admin access, a Jira/Rovo site, and a test PR. Verify app deployment, REST redirect handling, queue delivery and runtime storage in Bitbucket. Verify Jira issue reads, snapshot publication, follow-up creation, and the three Rovo actions in a real site. Use the [deployment checklist](FORGE_DEPLOYMENT.md).
