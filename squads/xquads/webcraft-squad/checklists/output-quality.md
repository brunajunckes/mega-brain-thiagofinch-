# WebCraft Squad — Output Quality Checklist

## Purpose

Quality gate checklist for all WebCraft Squad deliverables. Every output must pass
these checks before delivery to the user.

---

## Site Analysis Quality

- [ ] Tech stack verified (not assumed from visual appearance)
- [ ] Component inventory is exhaustive (not just major components)
- [ ] Responsive strategy tested at multiple breakpoints
- [ ] Inconsistencies documented with evidence
- [ ] Improvement areas are actionable, not vague

## Design Quality

- [ ] Design is original — does NOT look like generic AI template
- [ ] Color palette has WCAG AA contrast ratios verified
- [ ] Typography system has clear hierarchy with proper scale
- [ ] Spacing system is systematic (based on a unit, not arbitrary)
- [ ] Visual hierarchy guides the eye intentionally
- [ ] Responsive behavior is defined for all major breakpoints
- [ ] Anti-generic score >= 7/10

## Animation Quality

- [ ] Every animation has a stated purpose (not decorative only)
- [ ] prefers-reduced-motion alternatives defined
- [ ] Animation performance verified (compositor thread preferred)
- [ ] Timing and easing are consistent and intentional
- [ ] Animations don't exceed 300ms for micro-interactions
- [ ] No animations that could cause vestibular disorders

## Token Quality

- [ ] Naming convention is consistent and self-documenting
- [ ] Token hierarchy follows primitive → semantic → component
- [ ] Component tokens are used sparingly (< 20% of total)
- [ ] Dark mode tokens are complete
- [ ] High contrast mode considered
- [ ] Token documentation includes visual references

## Performance Quality

- [ ] Core Web Vitals measured (not estimated)
- [ ] LCP, INP, CLS scores documented
- [ ] Bottleneck root causes identified (not symptoms)
- [ ] Fix recommendations include expected impact
- [ ] Priority ranking considers effort/impact ratio
- [ ] Mobile performance included (not just desktop)

## Accessibility Quality

- [ ] WCAG 2.2 conformance level explicitly stated
- [ ] Both automated and manual testing performed
- [ ] Keyboard navigation tested end-to-end
- [ ] Screen reader compatibility verified
- [ ] Color contrast ratios measured (not eyeballed)
- [ ] Remediation plan includes WCAG criterion references
- [ ] Semantic HTML preferred over ARIA where possible

## SEO Quality

- [ ] Technical SEO foundation audited (crawl, index, mobile)
- [ ] Structured data validated against Google's requirements
- [ ] E-E-A-T assessment completed for YMYL content
- [ ] Content quality objectively assessed
- [ ] Recommendations follow Google's guidelines (no black hat)
- [ ] Action plan includes effort/impact/timeline

## GEO Quality

- [ ] AI search engines covered (Google AI, ChatGPT, Perplexity, Bing Chat)
- [ ] Entity optimization assessed at brand and topic level
- [ ] Citability scored with actionable improvements
- [ ] AI crawler access verified in robots.txt
- [ ] Competitive GEO position analyzed
- [ ] SEO-GEO alignment documented

## Cross-Dimensional Quality

- [ ] Conflicts between dimensions explicitly addressed
- [ ] Priority hierarchy respected (a11y > performance > SEO > design)
- [ ] Recommendations don't contradict across dimensions
- [ ] Phased roadmap considers dependencies between dimensions
- [ ] Executive summary accurately reflects specialist findings
