"""
Base class for weekly challenge evaluators.

Each evaluator is responsible for:
- Calculating current_value based on PomodoroSession data
- Determining if challenge is completed
- Providing metadata (title, description) for the challenge
"""
from abc import ABC, abstractmethod
from datetime import date
from typing import Tuple, Dict
from django.contrib.auth import get_user_model

User = get_user_model()


class BaseEvaluator(ABC):
    """Abstract base class for challenge evaluators"""

    def __init__(self, user: User, week_start: date, week_end: date):
        """
        Initialize evaluator with user and week boundaries.

        Args:
            user: The user being evaluated
            week_start: Start date of the week (Monday)
            week_end: End date of the week (Sunday)
        """
        self.user = user
        self.week_start = week_start
        self.week_end = week_end

    @abstractmethod
    def evaluate(self) -> Tuple[float, float, bool]:
        """
        Evaluate the challenge for the user in the specified week.

        Returns:
            Tuple of (current_value, target_value, is_completed)
        """
        pass

    @abstractmethod
    def get_metadata(self) -> Dict[str, str]:
        """
        Get challenge metadata (title and description).

        Returns:
            Dict with 'title' and 'description' keys
        """
        pass
