from django.db import models
from django.conf import settings

class WeeklyChallengeType(models.TextChoices):
    """Enum for weekly challenge types"""
    MARATHON_PRODUCTIVITY = 'marathon_productivity', 'Marathon Productivity'
    FOCUS_DEEP_WORK = 'focus_deep_work', 'Focus Deep Work'
    SUBJECT_FOCUS = 'subject_focus', 'Subject Focus'
    EARLY_START = 'early_start', 'Early Start'
    STRONG_FINISH = 'strong_finish', 'Strong Finish'
    QUALITY_OVER_QUANTITY = 'quality_over_quantity', 'Quality Over Quantity'
    CLEAN_FOCUS = 'clean_focus', 'Clean Focus'


class WeeklyChallengeStatus(models.TextChoices):
    """Enum for challenge status"""
    ACTIVE = 'active', 'Active'
    COMPLETED = 'completed', 'Completed'
    FAILED = 'failed', 'Failed'


class WeeklyChallenge(models.Model):
    """
    Model to store weekly challenges for users.
    
    Core design:
    - Single active challenge per user per week
    - Randomly selected challenge type
    - Backend-driven evaluation logic
    - No business logic, only state persistence
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='weekly_challenges'
    )

    challenge_type = models.CharField(
        max_length=30,
        choices=WeeklyChallengeType.choices,
        default=WeeklyChallengeType.MARATHON_PRODUCTIVITY,
        help_text="Type of challenge for this week"
    )

    week_start = models.DateField()
    week_end = models.DateField()

    current_value = models.FloatField(default=0.0, help_text="Current progress value")
    target_value = models.FloatField(default=1.0, help_text="Target value to achieve")

    status = models.CharField(
        max_length=10,
        choices=WeeklyChallengeStatus.choices,
        default=WeeklyChallengeStatus.ACTIVE
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'week_start')
        ordering = ['-week_start']

    def __str__(self):
        return f"{self.user} - {self.challenge_type} ({self.week_start})"
