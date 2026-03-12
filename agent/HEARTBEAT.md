# HEARTBEAT.md - 30 Minute Wake Cycle

## Prime directive

Every wake cycle must leave the dashboard MORE COMPLETE than it found it.
An event without a map feature, without actor responses, without sources, is an incomplete product.
A day without an updated brief, economic picture, and outlook is an incomplete product.
Bare-skeleton events are not acceptable output.

## The cycle

### Phase 1: Orient (fast)

1. Read `/instructions` and `/workspace`
2. Note conflict-local day/time and the timestamp of the latest event
3. Read the `/workspace` todos list — these are the system's own gap analysis

### Phase 2: Discover (thorough)

4. Web search for breaking developments since the last event timestamp. This is non-negotiable:
   - Search multiple angles: military strikes, diplomatic moves, political statements, economic impacts, shipping/Hormuz, Gulf attacks
   - Use specific queries: "Iran war latest", "Israel strikes Iran", "Hezbollah rockets", "Hormuz", "Trump Iran", "CENTCOM Iran"
   - Check ALL active actors: IRGC, IDF, Hezbollah, US/CENTCOM, Gulf states, diplomacy, Houthis, PMF
   - Fetch at least one live blog (Times of Israel, Guardian, Al Jazeera) for granular updates
   - Cross-reference timestamps: anything after the last system event is a candidate
   - Do NOT skip this even if system state looks complete
5. Search X/Twitter for real signals: official military accounts, journalist breaking tweets, actor statements
   - Find real tweet IDs — never fabricate them
   - Capture the best 2-4 signals per cycle when available

### Phase 3: Classify

6. For each candidate, classify:
   - NO_ACTION
   - UPDATE_EXISTING_EVENT
   - NEW_EVENT — immediately assess: does it need a map feature? Actor responses? A signal?
   - SNAPSHOT_UPDATE_ONLY (brief/economic/outlook change)

### Phase 4: Execute COMPLETE items (not skeletons)

7. For every new event created:
   - **Map feature**: If the event has grounded geography (strike location, target, route, zone), create the map feature IN THE SAME SCRIPT. Do not defer.
   - **Actor responses**: Identify which actors are involved and write their responses. Do not defer.
   - **Sources**: Add at least one source URL. Do not defer.
   - **X signals**: If a real tweet or official statement exists, create the signal. Do not defer.
   - **Story**: If a cluster of events forms a coherent spatial narrative, create the story in the same cycle.

8. For every cycle (even NOOP on new events):
   - **Actor responses**: Check all today's events for missing responses. Fill gaps for HIGH and CRITICAL events.
   - **Day snapshot brief**: Check if keyFacts, casualties, economicImpact, or scenarios need updating based on what happened. Update if material changes exist.
   - **Actor snapshots**: If any actor snapshots are missing for today, create them.
   - **Todos**: Work through the workspace todos list. These are real gaps, not suggestions.

### Phase 5: Verify

9. Check consumer/workspace state confirms all writes
10. Report what was done, what gaps remain

## What "nothing material" means

NOOP is valid when:
- No new real-world developments since last event
- AND the day snapshot is already complete (brief, economic, outlook filled)
- AND actor responses are caught up
- AND map features are caught up
- AND no P1 todos remain

If the dashboard has gaps, NOOP is not valid. Fill the gaps.

## Anti-patterns this checklist prevents

- Creating bare events without map features, sources, or responses
- Deferring enrichment to "later" (later never comes)
- Declaring NOOP when the day snapshot has empty fields
- Ignoring the todos list
- Skipping X signal capture cycle after cycle
- Treating map features and actor responses as optional nice-to-haves
