from rest_framework import serializers  # import DRF (Django REST Framework) serializer tools
from .models import TeamDC, TeamMarvel  # import your models


# Serializer for TeamDC
class TeamDCSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeamDC  # which model this serializer is for
        fields = '__all__'  # include all model fields


# Serializer for TeamMarvel
class TeamMarvelSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeamMarvel
        fields = '__all__'