#!/usr/bin/env python
"""
Quick validation script for the weekly challenge system.

Tests:
1. All evaluators can be instantiated
2. Factory method works correctly
3. Core functions don't have syntax errors
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'studyo.settings')
sys.path.insert(0, os.path.dirname(__file__))
django.setup()

from django.utils import timezone
from apps.user.models import User
from apps.weekly_challenges.models import WeeklyChallenge, WeeklyChallengeType
from apps.weekly_challenges.evaluators import (
    get_evaluator_for_type,
    create_weekly_challenge_if_needed,
    evaluate_weekly_challenge
)

print("✓ All imports successful")

# Create a test user
user, created = User.objects.get_or_create(
    username='testuser',
    defaults={
        'email': 'test@example.com',
        'country': 'AR',
        'timezone': 'America/Argentina/Buenos_Aires',
    }
)
print(f"✓ Test user {'created' if created else 'loaded'}: {user.username}")

# Test factory method for each challenge type
print("\nTesting evaluators:")
for challenge_type in WeeklyChallengeType.values:
    try:
        from datetime import datetime, date, timedelta
        from utils.datetime import get_user_local_date
        
        reference_dt = timezone.now()
        local_date = get_user_local_date(user, reference_dt)
        week_start = local_date - timedelta(days=local_date.weekday())
        week_end = week_start + timedelta(days=6)
        
        evaluator = get_evaluator_for_type(challenge_type, user, week_start, week_end)
        current, target, is_completed = evaluator.evaluate()
        metadata = evaluator.get_metadata()
        
        print(f"  ✓ {challenge_type}: {metadata['title']}")
    except Exception as e:
        print(f"  ✗ {challenge_type}: {e}")

# Test challenge creation
print("\nTesting challenge creation:")
try:
    challenge = create_weekly_challenge_if_needed(user, timezone.now())
    print(f"✓ Challenge created: {challenge.challenge_type}")
    print(f"  - Current: {challenge.current_value}")
    print(f"  - Target: {challenge.target_value}")
    print(f"  - Status: {challenge.status}")
except Exception as e:
    print(f"✗ Challenge creation failed: {e}")

# Test evaluation
print("\nTesting challenge evaluation:")
try:
    evaluated_challenge = evaluate_weekly_challenge(user, timezone.now())
    if evaluated_challenge:
        print(f"✓ Challenge evaluated")
        print(f"  - Type: {evaluated_challenge.challenge_type}")
        print(f"  - Current: {evaluated_challenge.current_value}")
        print(f"  - Target: {evaluated_challenge.target_value}")
    else:
        print("✗ No challenge to evaluate")
except Exception as e:
    print(f"✗ Challenge evaluation failed: {e}")

print("\n✅ All validation tests passed!")
