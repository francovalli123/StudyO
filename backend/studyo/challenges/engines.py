from .models import WeeklyChallenge

class ChallengeEngine:
    """
    Weekly Challenge Engine for StudyO.

    MVP version:
    - Deterministic (no AI involved)
    - Backend-driven
    - Event-based (called from Django signals)
    """

    TEMPLATE_DEFAULT = "consistency_streak"

    @staticmethod
    def create_weekly_challenge(user):
        """
        Creates a new weekly challenge for a user.

        For MVP purposes:
        - Always assigns the default template
        - Uses fixed, reasonable parameters
        """
        template_id = ChallengeEngine.TEMPLATE_DEFAULT
        parameters = ChallengeEngine.get_default_parameters(template_id)

        return WeeklyChallenge.objects.create(
            user=user,
            template_id=template_id,
            parameters=parameters
        )

    @staticmethod
    def get_default_parameters(template_id):
        """
        Returns default parameters for each challenge template.

        NOTE:
        Only fully supported templates are returned here.
        Other templates are intentionally excluded from MVP.
        """
        if template_id == "consistency_streak":
            return {
                "target_days": 5,              # Required consecutive valid days
                "min_pomodoros_per_day": 4     # Minimum pomodoros to count a day
            }

        elif template_id == "volume_grind":
            return {
                "target_pomodoros": 20         # Total pomodoros in the week
            }

        elif template_id == "planner_execution":
            return {
                "target_tasks": 3              # High priority tasks to complete
            }

        # Templates not supported in MVP (deep_focus, time_bound)
        return {}

    @staticmethod
    def update_progress_on_pomodoro(challenge, pomodoro_session):
        """
        Updates challenge progress when a PomodoroSession is created.

        This method should be called from a Django signal.
        """
        if challenge.is_completed:
            return

        if challenge.template_id == "volume_grind":
            # Each pomodoro counts as +1
            challenge.increment_progress(1)

        elif challenge.template_id == "consistency_streak":
            """
            MVP logic:
            - A day is considered valid if it reaches the minimum pomodoros
            - Each valid day increments progress by 1
            - Date validation logic is delegated to the model
            """
            if challenge.is_valid_study_day(pomodoro_session):
                challenge.increment_progress(1)

    @staticmethod
    def update_progress_on_task_completion(challenge, task):
        """
        Updates challenge progress when a Task is completed.

        This method should be called from a Django signal.
        """
        if challenge.is_completed:
            return

        if challenge.template_id == "planner_execution":
            # Only high priority tasks count
            if task.priority == 1:
                challenge.increment_progress(1)
