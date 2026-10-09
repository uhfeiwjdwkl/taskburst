# Architecture rules
- Centralize event duration, timing labels, and timeline scale in eventTiming so all event presentations use consistent timing.
- Use shared resultParts derivation and ResultPartFields for result breakdowns so nested scores, zero values and notes remain consistent across tasks and assessments.
- Handle partial date entry in the shared Input without committing incomplete dates, so date forms can seed the current year safely.