"""
HubMe AI - Instagram Graph API Engine
Posts portfolio content and responds to DMs automatically.
"""
import os
import json
import requests
from datetime import datetime

# Load env
from dotenv import load_dotenv
load_dotenv()

FB_APP_ID = os.getenv('FB_APP_ID')
FB_APP_SECRET = os.getenv('FB_APP_SECRET')
IG_ACCESS_TOKEN = os.getenv('IG_ACCESS_TOKEN')
IG_BUSINESS_ACCOUNT_ID = os.getenv('IG_BUSINESS_ACCOUNT_ID')

GRAPH_API_URL = 'https://graph.facebook.com/v21.0'


class InstagramEngine:
    def __init__(self):
        self.token = IG_ACCESS_TOKEN
        self.account_id = IG_BUSINESS_ACCOUNT_ID

    def _request(self, method, endpoint, params=None, data=None):
        url = f'{GRAPH_API_URL}/{endpoint}'
        if params is None:
            params = {}
        params['access_token'] = self.token

        try:
            if method == 'GET':
                r = requests.get(url, params=params, timeout=30)
            elif method == 'POST':
                r = requests.post(url, params=params, json=data, timeout=30)
            r.raise_for_status()
            return r.json()
        except requests.exceptions.RequestException as e:
            print(f'Error: {e}')
            if hasattr(e, 'response') and e.response is not None:
                print(f'Response: {e.response.text}')
            return None

    def get_account_info(self):
        """Get Instagram business account info"""
        return self._request('GET', self.account_id, {
            'fields': 'id,username,name,biography,followers_count,media_count'
        })

    def get_recent_media(self, limit=10):
        """Get recent posts"""
        return self._request('GET', f'{self.account_id}/media', {
            'fields': 'id,caption,media_type,media_url,timestamp,like_count,comments_count',
            'limit': limit
        })

    def publish_photo(self, image_url, caption):
        """Publish a photo post (image must be publicly accessible URL)"""
        # Step 1: Create media container
        container = self._request('POST', f'{self.account_id}/media', {
            'image_url': image_url,
            'caption': caption
        })

        if not container or 'id' not in container:
            print(f'Failed to create container: {container}')
            return None

        # Step 2: Publish the container
        result = self._request('POST', f'{self.account_id}/media_publish', {
            'creation_id': container['id']
        })

        return result

    def get_conversations(self):
        """Get DM conversations"""
        return self._request('GET', f'{self.account_id}/conversations', {
            'platform': 'instagram',
            'fields': 'participants,messages{message,from,created_time}'
        })

    def reply_to_message(self, recipient_id, message_text):
        """Reply to a DM (within 24h window)"""
        return self._request('POST', f'{self.account_id}/messages', data={
            'recipient': {'id': recipient_id},
            'message': {'text': message_text}
        })

    def get_comments(self, media_id):
        """Get comments on a post"""
        return self._request('GET', f'{media_id}/comments', {
            'fields': 'id,text,from,timestamp'
        })

    def reply_to_comment(self, comment_id, message):
        """Reply to a comment"""
        return self._request('POST', f'{comment_id}/replies', {
            'message': message
        })


def test_connection():
    """Test if the API connection works"""
    engine = InstagramEngine()

    if not engine.token or engine.token == 'PENDING':
        print('ACCESS TOKEN not configured. Set IG_ACCESS_TOKEN in .env')
        return False

    if not engine.account_id or engine.account_id == 'PENDING':
        print('ACCOUNT ID not configured. Set IG_BUSINESS_ACCOUNT_ID in .env')
        return False

    info = engine.get_account_info()
    if info:
        print(f'Connected to @{info.get("username", "?")}')
        print(f'Followers: {info.get("followers_count", 0)}')
        print(f'Posts: {info.get("media_count", 0)}')
        return True
    else:
        print('Connection failed. Check your token.')
        return False


if __name__ == '__main__':
    test_connection()
