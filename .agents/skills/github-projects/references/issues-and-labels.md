# Issues and labels

Create and refine GitHub issues for a project on the `github` tracker. Read the owner, repo and `releases_dir` from `.agents/project.yaml` first; example values below are illustrative.

## Create an issue

1. Ask which milestone it goes into. Offer the open releases (`gh api repos/<repo>/milestones --jq '.[] | "\(.number) \(.title)"'`), "new release" (see `releases.md`: write the release file, sync it, then continue) and "unplanned". An issue never lands without that answer. The same question opens every `/sprint-development` Stage 1 idea.
2. Write the body in English with this shape:

   ```markdown
   ## Context
   <why this exists, one short paragraph>

   ## Acceptance criteria
   - [ ] <observable behavior 1>
   - [ ] <observable behavior 2>

   ## Out of scope
   - <what this does not do>
   ```

3. Create it with the type and milestone, then add it to the Project and place it in Backlog:

   ```bash
   URL=$(gh issue create -R <repo> --title "<title>" --body-file <file> --type Feature --milestone "<release title>")
   gh project item-add <N> --owner <owner> --url "$URL"
   gh project item-edit <N> --owner <owner> --url "$URL" --field Status --value "<backlog option>"
   gh project item-list <N> --owner <owner> -L 1000 --format json --jq '.items[] | select(.content.url=="'"$URL"'") | .status'
   ```

   The last command is the read-back. `item-add` and `item-edit` are two calls: a card cannot be added and edited in one.

## Types and labels

- Issue types are native: `Bug`, `Feature`, `Task` (`--type`). Use them instead of type labels. Custom types on a personal account are unverified; the defaults are enough.
- The only label this skill maintains is `blocked` (created by the bootstrap). Add it when a dependency stops the work and remove it when it clears; it is not a Status.
- Dependencies and parents use the native fields: `--blocked-by`, `--blocking`, `--parent` on `gh issue create`, and `--add-blocked-by`, `--add-blocking`, `--parent` on `gh issue edit`. A sub-issue must live under the same repository owner as its parent.
- No priority or area label taxonomy in this wave. Do not invent one.

## Refine an issue

- Edit the body with `gh issue edit <n> --body-file <file>`; keep the AC checklist items observable and testable. Tick a box (`- [x]`) only when the behavior is verified, never on intent.
- Change the type with `gh issue edit <n> --type <T>`, the milestone with `--milestone`, and clear one with `--remove-milestone`.
- A bug issue: type `Bug`, steps to reproduce, expected and actual behavior, and an AC line that states the fix criterion.

## Closing

Do not close an issue by hand during delivery. The final commit of the change carries `Closes #<n>` as its footer, and the issue closes when that commit reaches the default branch (with an integration branch, that is the release merge). The release close-out reads back that each issue is closed and in the Released column (`releases.md`).
