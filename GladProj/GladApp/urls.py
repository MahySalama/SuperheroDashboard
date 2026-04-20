from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    MarvelViewSet,
    DCViewSet,
    start_data_generation,
    stop_data_generation,
    stats,
)

router = DefaultRouter()
router.register(r'marvel', MarvelViewSet)
router.register(r'dc', DCViewSet)

urlpatterns = [
    path('start/', start_data_generation),
    path('stop/', stop_data_generation),
    path('stats/', stats),
]

urlpatterns += router.urls

