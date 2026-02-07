"""
Weekly Challenge Evaluators Factory and Core Functions

This module provides:
- Factory method to get evaluator for a challenge type
- Core functions for creating and evaluating weekly challenges
"""
import random
from datetime import datetime, timedelta, date
from django.db import transaction
from django.utils import timezone
from django.contrib.auth import get_user_model
from typing import Optional, Tuple

from apps.weekly_challenges.models import WeeklyChallenge, WeeklyChallengeType, WeeklyChallengeStatus
from utils.datetime import get_user_local_date

from .base import BaseEvaluator
from .marathon import MarathonEvaluator
from .deep_work import DeepWorkEvaluator
from .subject_focus import SubjectFocusEvaluator
from .early_start import EarlyStartEvaluator
from .strong_finish import StrongFinishEvaluator
from .quality import QualityEvaluator
from .clean_focus import CleanFocusEvaluator

User = get_user_model()

# Mapping of challenge types to evaluator classes
EVALUATOR_MAP = {
    WeeklyChallengeType.MARATHON_PRODUCTIVITY: MarathonEvaluator,
    WeeklyChallengeType.FOCUS_DEEP_WORK: DeepWorkEvaluator,
    WeeklyChallengeType.SUBJECT_FOCUS: SubjectFocusEvaluator,
    WeeklyChallengeType.EARLY_START: EarlyStartEvaluator,
    WeeklyChallengeType.STRONG_FINISH: StrongFinishEvaluator,
    WeeklyChallengeType.QUALITY_OVER_QUANTITY: QualityEvaluator,
    WeeklyChallengeType.CLEAN_FOCUS: CleanFocusEvaluator,
}


def get_evaluator_for_type(
    challenge_type: str,
    user: User,
    week_start: date,
    week_end: date
) -> BaseEvaluator:
    """
    Factory method to get the correct evaluator for a challenge type.

    Args:
        challenge_type: The type of challenge (from WeeklyChallengeType)
        user: The user being evaluated
        week_start: Start date of the week
        week_end: End date of the week

    Returns:
        An instance of the appropriate evaluator

    Raises:
        ValueError: If challenge_type is not recognized
    """
    if challenge_type not in EVALUATOR_MAP:
        raise ValueError(f"Unknown challenge type: {challenge_type}")

    evaluator_class = EVALUATOR_MAP[challenge_type]
    return evaluator_class(user, week_start, week_end)


def get_week_boundaries(user: User, reference_dt: datetime) -> Tuple[date, date]:
    """
    Calculate Monday-Sunday week boundaries in user's timezone.

    Args:
        user: The user (to respect their timezone)
        reference_dt: Any datetime in the target week

    Returns:
        Tuple of (week_start_date, week_end_date)
    """
    # Get the user's local date
    local_date = get_user_local_date(user, reference_dt)

    # Get Monday (week_start)
    week_start = local_date - timedelta(days=local_date.weekday())

    # Get Sunday (week_end)
    week_end = week_start + timedelta(days=6)

    return week_start, week_end


def close_expired_challenges(user: User, reference_dt: datetime) -> int:
    """
    Lazily mark previous active weekly challenges as FAILED when the week has advanced.

    Rules:
    - Compute the current week_start for the user
    - Any WeeklyChallenge with week_end < current_week_start and status ACTIVE -> mark FAILED

    Returns number of challenges updated.
    """
    current_week_start, _ = get_week_boundaries(user, reference_dt)

    expired_qs = WeeklyChallenge.objects.filter(
        user=user,
        week_end__lt=current_week_start,
        status=WeeklyChallengeStatus.ACTIVE
    )
    # Use a single UPDATE to reduce write queries and avoid looped saves.
    return expired_qs.update(status=WeeklyChallengeStatus.FAILED)


@transaction.atomic
def create_weekly_challenge_if_needed(user: User, reference_dt: datetime) -> WeeklyChallenge:
    """
    Create a weekly challenge if one doesn't exist for the current week.

    Rules:
    - Respects user's timezone for week calculation
    - Checks for existing challenge for the week
    - Creates ONE random challenge type per week
    - Challenge type is fixed for the entire week (no changes)

    Args:
        user: The user
        reference_dt: Reference datetime (typically current time)

    Returns:
        The active WeeklyChallenge for the week (created or existing)
    """
    # Before creating/getting current week, close any expired active challenges lazily
    close_expired_challenges(user, reference_dt)

    week_start, week_end = get_week_boundaries(user, reference_dt)

    # Try to get existing challenge for this week
    existing_challenge = WeeklyChallenge.objects.filter(
        user=user,
        week_start=week_start,
        week_end=week_end
    ).select_for_update().first()

    if existing_challenge:
        return existing_challenge

    # No existing challenge - create a new one with random type
    challenge_type = random.choice(list(WeeklyChallengeType.values))

    # Create the evaluator to get metadata
    evaluator = get_evaluator_for_type(challenge_type, user, week_start, week_end)
    current_value, target_value, is_completed = evaluator.evaluate()
    metadata = evaluator.get_metadata()

    # Create the challenge
    challenge = WeeklyChallenge.objects.create(
        user=user,
        challenge_type=challenge_type,
        week_start=week_start,
        week_end=week_end,
        current_value=current_value,
        target_value=target_value,
        status=WeeklyChallengeStatus.COMPLETED if is_completed else WeeklyChallengeStatus.ACTIVE
    )

    return challenge


@transaction.atomic
def evaluate_weekly_challenge(user: User, reference_dt: datetime) -> Optional[WeeklyChallenge]:
    """
    Evaluate the active weekly challenge for the user.

    Called when a PomodoroSession is created to update the challenge state.

    Args:
        user: The user
        reference_dt: Reference datetime (typically current time)

    Returns:
        The updated WeeklyChallenge, or None if no active challenge
    """
    # Ensure previous weeks' active challenges are closed before evaluating current week
    close_expired_challenges(user, reference_dt)

    week_start, week_end = get_week_boundaries(user, reference_dt)

    # Get the active challenge for this week
    challenge = WeeklyChallenge.objects.filter(
        user=user,
        week_start=week_start,
        week_end=week_end
    ).select_for_update().first()

    if not challenge:
        return None

    # Get the evaluator for this challenge type
    evaluator = get_evaluator_for_type(
        challenge.challenge_type,
        user,
        week_start,
        week_end
    )

    # Evaluate
    current_value, target_value, is_completed = evaluator.evaluate()

    # Update challenge
    challenge.current_value = current_value
    challenge.target_value = target_value

    if is_completed and challenge.status != WeeklyChallengeStatus.COMPLETED:
        challenge.status = WeeklyChallengeStatus.COMPLETED

    challenge.save()

    return challenge
