import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config import CORS_ORIGINS, FRONTEND_DIST, POLL_SECONDS
from routes import analytics, history, live
from schemas import HealthResponse
from services import history as history_service
from services.inference import models_loaded

SAVE_EVERY_TICKS = 60      # about every 5 minutes


async def poller():
    ticks = 0
    while True:
        await asyncio.to_thread(live.refresh)
        ticks += 1
        if ticks % SAVE_EVERY_TICKS == 0:
            await asyncio.to_thread(history_service.save)
        await asyncio.sleep(POLL_SECONDS)


@asynccontextmanager
async def lifespan(app: FastAPI):
    history_service.load()
    task = asyncio.create_task(poller())
    yield
    task.cancel()
    history_service.save()


app = FastAPI(title="BreathSafe API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware, allow_origins=CORS_ORIGINS,
    allow_methods=["*"], allow_headers=["*"],
)

app.include_router(live.router, prefix="/api")
app.include_router(history.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")


@app.get("/api/health", response_model=HealthResponse)
def health():
    return HealthResponse(
        api="ok",
        models_loaded=models_loaded(),
        firebase="ok" if live.state["firebase_ok"] else "error",
    )


# Serve the built React app (after `npm run build`)
if FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")