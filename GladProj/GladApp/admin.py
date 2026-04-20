from django.contrib import admin

# Register your models here.

from .models import TeamDC, TeamMarvel

admin.site.register(TeamDC)
admin.site.register(TeamMarvel)

