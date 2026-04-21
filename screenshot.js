name: Bi-Hourly Dashboard Update
on:
  schedule:
    - cron: '0 */2 * * *'    # Main run
    - cron: '15 */2 * * *'   # Backup run (skips if main succeeded)
  workflow_dispatch:

env:
  FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true

jobs:
  take-and-send:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4

      - name: Check if this slot already ran
        id: check
        run: |
          # Build a slot ID like "2026-04-22-14" where hour is rounded down to even
          DATE=$(date -u +'%Y-%m-%d')
          HOUR=$(date -u +'%H')
          # Strip leading zero so bash doesn't treat "08"/"09" as octal
          HOUR=$((10#$HOUR))
          SLOT_HOUR=$(( HOUR / 2 * 2 ))
          SLOT=$(printf '%s-%02d' "$DATE" "$SLOT_HOUR")
          echo "Current slot: $SLOT"
          echo "slot=$SLOT" >> "$GITHUB_OUTPUT"

          mkdir -p .state
          if [ -f ".state/last_slot" ] && [ "$(cat .state/last_slot)" = "$SLOT" ]; then
            echo "already_ran=true" >> "$GITHUB_OUTPUT"
            echo "Slot $SLOT already completed — skipping."
          else
            echo "already_ran=false" >> "$GITHUB_OUTPUT"
            echo "Slot $SLOT not yet done — proceeding."
          fi

      - uses: actions/setup-node@v4
        if: steps.check.outputs.already_ran == 'false'
        with:
          node-version: '22'

      - name: Install dependencies
        if: steps.check.outputs.already_ran == 'false'
        run: |
          npm init -y
          npm install playwright
          npx playwright install chromium --with-deps

      - name: Take screenshot (with retry)
        if: steps.check.outputs.already_ran == 'false'
        uses: nick-fields/retry@v3
        with:
          timeout_minutes: 5
          max_attempts: 3
          retry_wait_seconds: 20
          command: node screenshot.js

      - name: Upload screenshot to Slack
        if: steps.check.outputs.already_ran == 'false'
        uses: slackapi/slack-github-action@v2.0.0
        with:
          method: files.uploadV2
          token: ${{ secrets.SLACK_BOT_TOKEN }}
          payload: |
            channel_id: C0ATMA8EZJ9
            initial_comment: "📊 VIN Tracker Dashboard update"
            file: "./dashboard.png"
            filename: "dashboard.png"

      - name: Mark slot as complete
        if: steps.check.outputs.already_ran == 'false'
        run: |
          echo "${{ steps.check.outputs.slot }}" > .state/last_slot
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add .state/last_slot
          git diff --staged --quiet || git commit -m "chore: mark slot ${{ steps.check.outputs.slot }} complete [skip ci]"
          git push
