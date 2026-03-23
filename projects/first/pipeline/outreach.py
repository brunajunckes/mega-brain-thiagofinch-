"""
HubMe AI - Outreach Engine
Sends personalized emails to businesses with their site preview.
Manages follow-ups automatically.
"""
import subprocess
import json
import os
from datetime import datetime, timedelta

LEADS_DIR = '/srv/aiox/projects/first/pipeline/leads'
OUTREACH_LOG = '/srv/aiox/projects/first/pipeline/outreach-log.json'
PREVIEW_BASE_URL = 'https://go.hubme.tech/preview'


def load_outreach_log():
    if os.path.exists(OUTREACH_LOG):
        with open(OUTREACH_LOG) as f:
            return json.load(f)
    return {'sent': [], 'followups': [], 'replies': [], 'converted': []}


def save_outreach_log(log):
    with open(OUTREACH_LOG, 'w') as f:
        json.dump(log, f, indent=2, default=str)


def send_email(to_email, subject, body, from_email='mary@hubme.tech'):
    """Send email via the mail server"""
    cmd = f'''docker exec hubme-mail bash -c 'echo "{body}" | mail -s "{subject}" -r {from_email} {to_email}' '''
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
        return result.returncode == 0
    except Exception as e:
        print(f'Send error: {e}')
        return False


# Email templates by niche
TEMPLATES = {
    'restaurant': {
        'subject': 'I created a free website preview for {name}',
        'body': '''Hi {name} team,

I came across your restaurant on Google Maps and noticed you don't have a website yet. Your food looks amazing on Instagram!

I took the liberty of creating a free website preview specifically for {name}. You can see it live here:

{preview_url}

It includes:
- Your menu with photos
- WhatsApp ordering button
- Google Maps integration
- Mobile-friendly design

If you like it, I can have the full site live on your own domain within 24 hours.

No obligation - the preview is yours to keep either way.

Best,
Mary
HubMe AI
https://go.hubme.tech''',
    },
    'dental': {
        'subject': 'Free website preview for {name}',
        'body': '''Dear {name} team,

I noticed your practice doesn't have a website yet. In 2026, 77% of patients search online before booking a dentist.

I created a professional website preview for {name} - completely free, no strings attached:

{preview_url}

It includes:
- Online appointment booking
- Service descriptions
- Team profiles
- Patient contact form

If you'd like the full site live on your domain, I can deliver within 24 hours.

Best regards,
Mary
HubMe AI
https://go.hubme.tech''',
    },
    'salon': {
        'subject': 'I made a free website for {name}',
        'body': '''Hi {name}!

Love your work on Instagram! I noticed you don't have a website yet, so I created one for you as a free sample:

{preview_url}

Features included:
- Online booking system
- Service menu with prices
- Photo gallery from your Instagram
- WhatsApp contact button

Want it live on your own domain? I can do it in 24 hours.

No pressure - the preview is free either way!

Mary
HubMe AI
https://go.hubme.tech''',
    },
    'hvac': {
        'subject': 'I built a free website for {name}',
        'body': '''Hi {name} team,

Here's the problem: homeowners in your area are searching for HVAC right now — and calls are going to your competitors because they can't find you online.

I built a free website preview specifically for {name}. No charge, no obligation:

{preview_url}

It includes:
- Emergency call CTA (click-to-call, above the fold)
- Financing info page (sell bigger jobs, fewer objections)
- Service area map (rank locally, stop losing to the guy 30 miles away)

If you want it live on your domain, I can have it done in 24 hours. Starting at $297.

Best,
Mary
HubMe AI
https://go.hubme.tech''',
    },
    'construction': {
        'subject': 'Free website preview for {name}',
        'body': '''Hi {name} team,

Commercial contractors lose bids every week because the client Googled them first — and found nothing.

A professional online presence isn't marketing. It's table stakes. I built a free preview for {name} to show you exactly what that looks like:

{preview_url}

It includes:
- Project portfolio (photos, scope, results — build instant credibility)
- Quote request form (capture leads 24/7, not just when you answer the phone)
- License & insurance credentials front and center (close faster, no trust gap)

Ready to go live in 24 hours. Starting at $297.

Best,
Mary
HubMe AI
https://go.hubme.tech''',
    },
    'roofing': {
        'subject': 'I built a website for {name} — storm season is here',
        'body': '''Hi {name} team,

Storm season is here. Homeowners are searching for roofers RIGHT NOW — and every day without a website is a job going to someone else.

I built a free website preview for {name} so you can see exactly what you're missing:

{preview_url}

It includes:
- Insurance claim specialist page (position yourself as the expert, not just another roofer)
- Emergency contact (be the first call when the storm hits at 2am)
- Before/after photo gallery (let your work close the deal for you)

I can have it live on your domain in 24 hours. Starting at $297.

Best,
Mary
HubMe AI
https://go.hubme.tech''',
    },
    'law firm': {
        'subject': 'Free website for {name} — 77% of people search before choosing a lawyer',
        'body': '''Dear {name},

77% of people search online before choosing a lawyer. If potential clients can't find your firm, they're hiring someone else — often a BigLaw competitor who spends $10,000/month on Google Ads.

I built a professional website preview for {name} at no cost:

{preview_url}

It includes:
- Free consultation form (lower the barrier to contact, increase qualified leads)
- Case types listed clearly (so the right clients self-select before they call you)
- "No fee unless we win" prominently displayed (the #1 conversion factor for personal injury and contingency work)

If you'd like to move forward, I can have it live on your domain within 24 hours. Starting at $297.

Regards,
Mary
HubMe AI
https://go.hubme.tech''',
    },
    'default': {
        'subject': 'Free website preview for {name}',
        'body': '''Hi {name},

I noticed your business doesn't have a website yet. I create professional websites for local businesses, and I'd love to show you what yours could look like.

I made a free preview specifically for {name}:

{preview_url}

Features:
- Professional design
- Mobile responsive
- Contact form
- Google Maps integration

If you like it, I can have it live within 24 hours. If not, no worries - the preview is free.

Best,
Mary
HubMe AI
https://go.hubme.tech''',
    },
}

FOLLOWUP_TEMPLATES = [
    {
        'days_after': 1,
        'subject': 'Re: Free website preview for {name}',
        'body': '''Hi {name},

Just checking if you had a chance to see the website preview I sent yesterday:

{preview_url}

Let me know what you think! Happy to answer any questions.

Mary''',
    },
    {
        'days_after': 3,
        'subject': 'Re: Free website preview for {name}',
        'body': '''Hi {name},

I wanted to let you know that the preview I created for {name} is available for the next 7 days:

{preview_url}

After that, I'll be creating previews for other businesses in your area.

If you'd like to move forward, just reply to this email. I can have your site live in 24 hours.

Mary''',
    },
    {
        'days_after': 7,
        'subject': 'Last chance: Website preview for {name}',
        'body': '''Hi {name},

This is my last follow-up. The website preview I created for {name} will be removed this week:

{preview_url}

If you change your mind in the future, feel free to reach out anytime at mary@hubme.tech.

Wishing you all the best!

Mary
HubMe AI''',
    },
]

# Aggressive follow-up sequence for high-value niches (law firm, construction)
FOLLOWUP_TEMPLATES_HIGH_VALUE = [
    {
        'days_after': 1,
        'subject': 'Re: Your free website preview — {name}',
        'body': '''Hi {name},

Sent you a preview yesterday — just making sure it didn't get buried:

{preview_url}

Takes 30 seconds to look at. Let me know what you think.

Mary''',
    },
    {
        'days_after': 2,
        'subject': 'Quick question for {name}',
        'body': '''Hi {name},

Is there a reason the website preview didn't work for you?

Too expensive? Wrong design? Wrong features? Just let me know — I'll fix it.

{preview_url}

If it's just timing, that's fine too. I'll check back next week.

Mary''',
    },
    {
        'days_after': 4,
        'subject': 'Re: {name} — competitor update',
        'body': '''Hi {name},

I checked Google this morning for your service area. Three of your competitors have updated their websites in the last 30 days.

Your preview is still live and ready:

{preview_url}

I can launch it in 24 hours for $297. After this week I'll move on to other businesses in your market.

Mary
HubMe AI''',
    },
    {
        'days_after': 7,
        'subject': 'Final notice: preview for {name}',
        'body': '''Hi {name},

This is my last message. The preview I built for {name} goes offline this Friday:

{preview_url}

If you ever want to revisit, you can reach me at mary@hubme.tech.

Good luck out there.

Mary
HubMe AI''',
    },
]

# Nichos que usam follow-up agressivo
HIGH_VALUE_NICHES = {'law firm', 'construction'}


def get_template(niche: str) -> dict:
    """Return the email template for the given niche, falling back to 'default'."""
    return TEMPLATES.get(niche, TEMPLATES['default'])


def get_followup_sequence(niche: str) -> list:
    """Return the appropriate follow-up sequence based on niche value tier."""
    if niche in HIGH_VALUE_NICHES:
        return FOLLOWUP_TEMPLATES_HIGH_VALUE
    return FOLLOWUP_TEMPLATES


def send_initial_outreach(business_name, email, niche, preview_url):
    """Send first contact email with preview link"""
    template = TEMPLATES.get(niche, TEMPLATES['default'])

    subject = template['subject'].format(name=business_name)
    body = template['body'].format(name=business_name, preview_url=preview_url)

    success = send_email(email, subject, body)

    log = load_outreach_log()
    log['sent'].append({
        'business': business_name,
        'email': email,
        'niche': niche,
        'preview_url': preview_url,
        'date': datetime.now().isoformat(),
        'status': 'sent' if success else 'failed',
        'followup_stage': 0,
    })
    save_outreach_log(log)

    return success


def process_followups():
    """Check and send scheduled follow-ups"""
    log = load_outreach_log()
    now = datetime.now()
    sent_count = 0

    for lead in log['sent']:
        if lead.get('status') in ('converted', 'replied', 'unsubscribed'):
            continue

        sent_date = datetime.fromisoformat(lead['date'])
        stage = lead.get('followup_stage', 0)

        sequence = get_followup_sequence(lead.get('niche', ''))
        if stage < len(sequence):
            followup = sequence[stage]
            if (now - sent_date).days >= followup['days_after']:
                subject = followup['subject'].format(name=lead['business'])
                body = followup['body'].format(
                    name=lead['business'],
                    preview_url=lead['preview_url']
                )

                success = send_email(lead['email'], subject, body)
                if success:
                    lead['followup_stage'] = stage + 1
                    lead['last_followup'] = now.isoformat()
                    sent_count += 1

    save_outreach_log(log)
    return sent_count


def get_stats():
    """Get outreach statistics"""
    log = load_outreach_log()
    total = len(log['sent'])
    replied = len([l for l in log['sent'] if l.get('status') == 'replied'])
    converted = len([l for l in log['sent'] if l.get('status') == 'converted'])

    return {
        'total_sent': total,
        'replied': replied,
        'converted': converted,
        'conversion_rate': f'{(converted/total*100):.1f}%' if total > 0 else '0%',
        'revenue': converted * 1500,  # Average ticket
    }


if __name__ == '__main__':
    print('=== HubMe AI Outreach Engine ===')
    print()

    # Demo: send to a test business
    print('Sending test outreach...')
    success = send_initial_outreach(
        business_name='Test Restaurant',
        email='mary@hubme.tech',
        niche='restaurant',
        preview_url='https://go.hubme.tech/preview/test-restaurant'
    )
    print(f'Result: {"Sent!" if success else "Failed"}')

    print()
    stats = get_stats()
    print(f'Stats: {json.dumps(stats, indent=2)}')
