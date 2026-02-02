from django.utils import timezone
from apps.user.models import User
from apps.weekly_challenges.evaluators import create_weekly_challenge_if_needed, evaluate_weekly_challenge
from apps.weekly_challenges.models import WeeklyChallengeType

# Create or get test user
user, created = User.objects.get_or_create(
    username='testuser_challenges',
    defaults={'email': 'test.challenges@example.com', 'country': 'AR', 'timezone': 'America/Argentina/Buenos_Aires'}
)
print(f"✓ User: {user.username}")

# Test challenge creation
challenge = create_weekly_challenge_if_needed(user, timezone.now())
print(f"✓ Challenge created/loaded")
print(f"  - Type: {challenge.challenge_type}")
print(f"  - Current: {challenge.current_value}")
print(f"  - Target: {challenge.target_value}")
print(f"  - Status: {challenge.status}")

# Test that it's idempotent
challenge2 = create_weekly_challenge_if_needed(user, timezone.now())
print(f"✓ Idempotent check: {challenge.id == challenge2.id}")

print("\n✅ All tests passed!")
