from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import TeamDC, TeamMarvel
from .serializers import TeamDCSerializer, TeamMarvelSerializer

import threading
import time
import random


# -----------------------------
# PAGINATED VIEWSETS
# -----------------------------

class MarvelViewSet(viewsets.ModelViewSet):
    queryset = TeamMarvel.objects.all().order_by('id')
    serializer_class = TeamMarvelSerializer


class DCViewSet(viewsets.ModelViewSet):
    queryset = TeamDC.objects.all().order_by('id')
    serializer_class = TeamDCSerializer


# -----------------------------
# DATA GENERATION THREAD STATE
# -----------------------------

running = False
start_time = None


def generate_data():
    global running

    while running:
        for _ in range(10):
            TeamMarvel.objects.create(
                name=f"Marvel_{random.randint(1, 1000)}",
                height=random.randint(150, 210),
                weight=random.randint(50, 120),
                games_played=random.randint(1, 200)
            )

            TeamDC.objects.create(
                name=f"DC_{random.randint(1, 1000)}",
                height=random.randint(150, 210),
                weight=random.randint(50, 120),
                games_played=random.randint(1, 200)
            )

        time.sleep(2)


@api_view(['GET'])
def start_data_generation(request):
    global running, start_time

    if not running:
        running = True
        start_time = time.time()

        thread = threading.Thread(target=generate_data)
        thread.daemon = True
        thread.start()

        return Response({"status": "Started data generation"})

    return Response({"status": "Already running"})


@api_view(['GET'])
def stop_data_generation(request):
    global running, start_time

    running = False
    start_time = None

    return Response({"status": "Stopped data generation"})


@api_view(['GET'])
def stats(request):
    global start_time

    marvel_count = TeamMarvel.objects.count()
    dc_count = TeamDC.objects.count()
    total_rows = marvel_count + dc_count

    if total_rows == 0:
        elapsed = 0
    elif running and start_time is not None:
        elapsed = int(time.time() - start_time)
    else:
        elapsed = 0

    size_mb = round((total_rows * 200) / (1024 * 1024), 2)

    return Response({
        "marvel_count": marvel_count,
        "dc_count": dc_count,
        "total_rows": total_rows,
        "elapsed_time": elapsed,
        "size_mb": size_mb
    })