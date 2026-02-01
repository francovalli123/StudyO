# Backend API - Weekly Challenge Reference

## Endpoints

### GET Active Weekly Challenge
```
GET /api/weekly-challenge/active/
```

**Authentication:** Required (Token)

**Headers:**
```
Authorization: Token <AUTH_TOKEN>
Content-Type: application/json
```

**Response (200 OK):**
```json
{
  "id": 1,
  "title": "Racha de Enfoque Élite - 5 Pomodoros/día",
  "description": "Completá 5 Pomodoros diarios por 5 días seguidos. ¡Demuestra tu consistencia!",
  "current_value": 3,
  "target_value": 5,
  "progress_percentage": 60.0,
  "progress": 3,
  "status": "active",
  "week_start": "2026-02-01",
  "week_end": "2026-02-07",
  "target_days": 5,
  "required_pomodoros_per_day": 5,
  "completed_days": [
    "2026-02-01",
    "2026-02-02",
    "2026-02-03"
  ]
}
```

**Response (204 No Content / null):**
No active challenge for the user
```json
null
```

**Response (401 Unauthorized):**
```json
{
  "detail": "Invalid token."
}
```

---

## Django Models

### WeeklyChallenge

```python
class WeeklyChallenge(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='weekly_challenges')
    week_start = models.DateField()
    week_end = models.DateField()
    target_days = models.PositiveSmallIntegerField(default=5)
    required_pomodoros_per_day = models.PositiveSmallIntegerField(default=5)
    completed_days = models.JSONField(default=list)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)

    # New methods
    def get_title(self):
        return f"Racha de Enfoque Élite - {self.required_pomodoros_per_day} Pomodoros/día"

    def get_description(self):
        return f"Completá {self.required_pomodoros_per_day} Pomodoros diarios por {self.target_days} días seguidos. ¡Demuestra tu consistencia!"
```

---

## Serializer

```python
class WeeklyChallengeSerializer(serializers.ModelSerializer):
    progress = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()
    current_value = serializers.SerializerMethodField()
    target_value = serializers.SerializerMethodField()
    title = serializers.CharField(source='get_title', read_only=True, allow_null=True)
    description = serializers.CharField(source='get_description', read_only=True, allow_null=True)

    class Meta:
        model = WeeklyChallenge
        fields = (
            'id',
            'week_start',
            'week_end',
            'target_days',
            'progress',
            'progress_percentage',
            'current_value',
            'target_value',
            'required_pomodoros_per_day',
            'completed_days',
            'status',
            'title',
            'description'
        )

    def get_progress(self, obj):
        """Current progress (number of completed days)"""
        return len(obj.completed_days) if obj.completed_days else 0
    
    def get_progress_percentage(self, obj):
        """Progress as percentage (0-100)"""
        progress = len(obj.completed_days) if obj.completed_days else 0
        if obj.target_days == 0:
            return 0
        percentage = (progress / obj.target_days) * 100
        return min(round(percentage, 2), 100)
    
    def get_current_value(self, obj):
        """Alias for progress"""
        return len(obj.completed_days) if obj.completed_days else 0
    
    def get_target_value(self, obj):
        """Alias for target_days"""
        return obj.target_days
```

---

## View

```python
class ActiveWeeklyChallengeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        challenge = WeeklyChallenge.objects.filter(
            user=request.user,
            status='active'
        ).order_by('-week_start').first()

        if not challenge:
            return Response(None)

        return Response(WeeklyChallengeSerializer(challenge).data)
```

---

## Testing API

### Using cURL
```bash
# Get token first (login endpoint)
TOKEN="your_auth_token_here"

# Get active challenge
curl -X GET http://127.0.0.1:8000/api/weekly-challenge/active/ \
  -H "Authorization: Token $TOKEN" \
  -H "Content-Type: application/json"
```

### Using Python
```python
import requests

token = "your_auth_token_here"
headers = {
    "Authorization": f"Token {token}",
    "Content-Type": "application/json"
}

response = requests.get(
    "http://127.0.0.1:8000/api/weekly-challenge/active/",
    headers=headers
)

print(response.json())
```

### Using JavaScript
```javascript
const token = localStorage.getItem('authToken');

fetch('http://127.0.0.1:8000/api/weekly-challenge/active/', {
  method: 'GET',
  headers: {
    'Authorization': `Token ${token}`,
    'Content-Type': 'application/json'
  },
  credentials: 'include'
})
.then(r => r.json())
.then(data => console.log(data));
```

---

## Creating Test Data

### Django Shell
```bash
cd backend/studyo
python manage.py shell
```

```python
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.models import User
from apps.weekly_challenges.models import WeeklyChallenge

# Get or create user
user = User.objects.first()

# Create a weekly challenge
today = timezone.now().date()
week_start = today - timedelta(days=today.weekday())  # Monday
week_end = week_start + timedelta(days=6)  # Sunday

challenge = WeeklyChallenge.objects.create(
    user=user,
    week_start=week_start,
    week_end=week_end,
    target_days=5,
    required_pomodoros_per_day=5,
    completed_days=[
        str(week_start),
        str(week_start + timedelta(days=1)),
        str(week_start + timedelta(days=2)),
    ],
    status='active'
)

print(f"Created challenge: {challenge}")
print(f"Progress: {len(challenge.completed_days)}/{challenge.target_days}")
```

### Create with Management Command
```bash
python manage.py shell < create_challenge.py
```

---

## Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | int | Unique identifier |
| `title` | string | Dynamic title based on target |
| `description` | string | Dynamic description with goals |
| `current_value` | int | Current progress (days completed) |
| `target_value` | int | Target value (same as target_days) |
| `progress_percentage` | float | Progress as percentage (0-100) |
| `progress` | int | Number of days completed |
| `status` | enum | 'active' \| 'completed' \| 'failed' |
| `week_start` | date | Week start date (YYYY-MM-DD) |
| `week_end` | date | Week end date (YYYY-MM-DD) |
| `target_days` | int | Number of days to complete challenge |
| `required_pomodoros_per_day` | int | Pomodoros required per day |
| `completed_days` | array | List of completed dates (ISO format) |

---

## Status Flow

```
┌─────────┐
│ created │
└────┬────┘
     │
     ▼
┌──────────┐
│  active  │
└─┬─────┬─┘
  │     │
  │     └─────────────────┐
  │                       │
  ▼                       ▼
┌──────────┐        ┌──────────┐
│completed │        │  failed  │
└──────────┘        └──────────┘
```

### Transitions
- **created → active:** Automatic (status defaults to 'active')
- **active → completed:** When all target_days are met
- **active → failed:** When week ends without meeting target

---

## Common Issues & Solutions

### Issue: API returns `null`
**Cause:** No active challenge for the user
**Solution:** Create a challenge first
```python
WeeklyChallenge.objects.create(
    user=request.user,
    week_start=today,
    week_end=today + timedelta(days=6),
    status='active'
)
```

### Issue: `401 Unauthorized`
**Cause:** Invalid or missing token
**Solution:** Verify token in request header
```javascript
console.log('Token:', localStorage.getItem('authToken'));
// Should not be null or 'null'
```

### Issue: `404 Not Found`
**Cause:** Endpoint URL is incorrect
**Solution:** Verify endpoint:
```
Correct: /api/weekly-challenge/active/
Wrong:   /api/weekly-challenges/active/
```

### Issue: `progress_percentage` is `null`
**Cause:** Database doesn't have required fields
**Solution:** Verify model has all fields:
```python
# Should have:
# - target_days (PositiveSmallIntegerField)
# - completed_days (JSONField)
```

---

## Performance Notes

- **Query:** Single query per request (no N+1)
- **Response Size:** ~400-500 bytes
- **Cache:** Can be cached for 1-5 minutes
- **Rate Limit:** No specific limit (follows API rate limit)

---

## Future Enhancements

1. **Caching:**
   ```python
   from django.views.decorators.cache import cache_page
   
   @cache_page(60)  # Cache for 60 seconds
   def get(self, request):
       ...
   ```

2. **Pagination:** (If multiple challenges)
   ```python
   # Return list with pagination
   queryset = WeeklyChallenge.objects.filter(user=request.user)
   paginator = Paginator(queryset, 10)
   ```

3. **Filtering:**
   ```python
   # By status
   challenges = WeeklyChallenge.objects.filter(
       user=request.user,
       status__in=['active', 'completed']
   )
   ```

4. **Sorting:**
   ```python
   # By date
   challenges = WeeklyChallenge.objects.filter(
       user=request.user
   ).order_by('-week_start')
   ```

---

**Updated:** Feb 1, 2026
