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
    # Returns Marvel rows ordered by database ID
    queryset = TeamMarvel.objects.all().order_by('id')
    serializer_class = TeamMarvelSerializer


class DCViewSet(viewsets.ModelViewSet):
    # Returns DC rows ordered by database ID
    queryset = TeamDC.objects.all().order_by('id')
    serializer_class = TeamDCSerializer


# -----------------------------
# DATA GENERATION THREAD STATE
# -----------------------------

# running controls whether the background thread should keep inserting rows
running = False

# start_time stores when the current generation session started
# It stays None when generation is not running
start_time = None

# elapsed_time stores the final frozen time after generation stops
# This lets the dashboard freeze the timer instead of resetting it immediately
elapsed_time = 0


def generate_data():
    """
    Background function that keeps inserting random Marvel and DC rows
    while running is True.
    """
    global running

    while running:
        # Insert 10 Marvel rows and 10 DC rows every cycle
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

        # Wait 2 seconds before inserting the next batch
        time.sleep(2)


@api_view(['GET'])
def start_data_generation(request):
    """
    Starts the background data generation thread.

    Demo behavior:
    - Pressing START starts a new generation session.
    - The timer resets to 0 when START is pressed.
    - If generation is already running, it does not start another thread.
    """
    global running, start_time, elapsed_time

    if not running:
        running = True

        # Starting a new generation session resets the timer to 0
        elapsed_time = 0
        start_time = time.time()

        # Start the background thread
        thread = threading.Thread(target=generate_data)
        thread.daemon = True
        thread.start()

        return Response({"status": "Started data generation"})

    return Response({"status": "Already running"})


@api_view(['GET'])
def stop_data_generation(request):
    """
    Stops the background data generation thread.

    Demo behavior:
    - Pressing STOP freezes the timer at the final elapsed value.
    - It does not reset the timer to 0 immediately.
    """
    global running, start_time, elapsed_time

    if running and start_time is not None:
        # Save the final elapsed time before stopping
        elapsed_time = int(time.time() - start_time)

    running = False
    start_time = None

    return Response({"status": "Stopped data generation"})


@api_view(['GET'])
def stats(request):
    """
    Returns live dashboard statistics:
    - Marvel row count
    - DC row count
    - Total rows
    - Elapsed generation time
    - Estimated database size
    """
    global start_time, elapsed_time

    marvel_count = TeamMarvel.objects.count()
    dc_count = TeamDC.objects.count()
    total_rows = marvel_count + dc_count

    # If the database is empty and generation is not running,
    # show the timer as 0. This is useful after running manage.py flush.
    if total_rows == 0 and not running:
        elapsed = 0
        elapsed_time = 0

    # If generation is running, calculate live elapsed time
    elif running and start_time is not None:
        elapsed = int(time.time() - start_time)

    # If generation is stopped, keep the final frozen elapsed time
    else:
        elapsed = elapsed_time

    # Rough estimated size calculation
    size_mb = round((total_rows * 200) / (1024 * 1024), 2)

    return Response({
        "marvel_count": marvel_count,
        "dc_count": dc_count,
        "total_rows": total_rows,
        "elapsed_time": elapsed,
        "size_mb": size_mb
    })