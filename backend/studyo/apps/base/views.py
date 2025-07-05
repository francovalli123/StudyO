from django.shortcuts import render

# Index. Actúa como Home
def index(request):
    return render(request, "base/index.html")