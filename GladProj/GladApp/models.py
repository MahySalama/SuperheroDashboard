from django.db import models

# Create your models here.

class TeamDC(models.Model):
    name = models.CharField(max_length=100)
    height = models.FloatField()
    weight = models.FloatField()
    games_played = models.IntegerField()

    def __str__(self):
        return self.name
    
    
class TeamMarvel(models.Model):
    name = models.CharField(max_length=100)
    height = models.FloatField()
    weight = models.FloatField()
    games_played = models.IntegerField()

    def __str__(self):
        return self.name

   